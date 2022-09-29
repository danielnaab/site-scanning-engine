import { parse } from '@fast-csv/parse';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

import { CreateWebsiteDto } from '@app/database/websites/dto/create-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';

import { SubdomainRow } from './subdomain-row.interface';

@Injectable()
export class IngestService {
  private logger = new Logger(IngestService.name);

  constructor(
    private httpService: HttpService,
    private websiteService: WebsiteService,
    private configService: ConfigService,
  ) {}

  private currentFederalSubdomains = this.configService.get<string>(
    'federalSubdomainsUrl',
  );

  async getUrls(url?: string): Promise<string> {
    const urlList = url ?? this.currentFederalSubdomains;
    const urls = await this.httpService
      .get(urlList)
      .pipe(map((resp) => resp.data))
      .toPromise();
    return urls;
  }

  /**
   * writeUrls writes target urls to the Websites table.
   */
  async writeUrls(urls: string, maxRows?: number) {
    const writes: Promise<any>[] = [];
    const newestWebsiteRecord = await this.websiteService.findNewestWebsite();

    const stream = parse<SubdomainRow, CreateWebsiteDto>({
      headers: [
        'targetUrl',
        'baseDomain',
        'url',
        'branch',
        'agency',
        'agencyCode',
        'bureau',
        'bureauCode',
        'sourceListFederalDomains',
        'sourceListDap',
        'sourceListPulse',
      ],
      renameHeaders: true, // discard the existing headers to ease parsing
      maxRows: maxRows,
    })
      .transform(
        (data: SubdomainRow): CreateWebsiteDto => ({
          ...data,
          website: data.targetUrl.toLowerCase(),
          agencyCode: data.agencyCode ? parseInt(data.agencyCode) : null,
          bureauCode: data.bureauCode ? parseInt(data.bureauCode) : null,
          sourceListFederalDomains:
            data.sourceListFederalDomains.toLowerCase() === 'true'
              ? true
              : false,
          sourceListDap:
            data.sourceListDap.toLowerCase() === 'true' ? true : false,
          sourceListPulse:
            data.sourceListPulse.toLowerCase() === 'true' ? true : false,
        }),
      )
      .on('error', (error) => this.logger.error(error.message, error.stack))
      .on('data', (row: CreateWebsiteDto) => {
        writes.push(this.writeToDatabase(row));
      })
      .on('end', (rowCount: number) => {
        this.logger.debug(rowCount);
      });

    stream.write(urls);

    const end = new Promise((resolve) => {
      stream.end(async () => {
        try {
          await Promise.all(writes);
          this.logger.debug('finished ingest of urls');

          if (newestWebsiteRecord) {
            const deleted = await this.websiteService.deleteBefore(
              new Date(newestWebsiteRecord.updated),
            );
            this.logger.debug(
              `finished removing ${deleted.affected} invalid url(s)`,
            );
          }
          resolve('');
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `encountered error during ingest process: ${err.message}`,
            err.stack,
          );
        }
      });
    });

    return end;
  }

  /**
   * writeToDatabase writes a CSV to the database.
   * @param row a CreateWebsiteDto object.
   */
  async writeToDatabase(row: CreateWebsiteDto) {
    try {
      await this.websiteService.create(row);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `encountered error saving to database: ${err.message}`,
        err.stack,
      );
    }
  }
}
