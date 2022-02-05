import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';

import { CoreScannerModule, CoreScannerService } from '@app/core-scanner';
import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { ScanStatus } from '@app/core-scanner/scan-status';

import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

describe('CoreScanner (e2e)', () => {
  let service: CoreScannerService;
  let moduleFixture: TestingModule;
  let mockLogger: PinoLogger;

  beforeEach(async () => {
    mockLogger = mock<PinoLogger>();
    moduleFixture = await Test.createTestingModule({
      imports: [CoreScannerModule],
      providers: [
        {
          provide: getLoggerToken(CoreScannerService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = moduleFixture.get<CoreScannerService>(CoreScannerService);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('returns results for 18f.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: '18f.gov',
      scanId: '123',
    };

    const result = await service.scan(input);

    expect(result.coreResult).toEqual({
      finalUrl: 'https://18f.gsa.gov/',
      finalUrlBaseDomain: 'gsa.gov',
      finalUrlIsLive: true,
      finalUrlMIMEType: 'text/html',
      finalUrlSameDomain: false,
      finalUrlSameWebsite: false,
      finalUrlStatusCode: 200,
      status: 'completed',
      targetUrl404Test: true,
      targetUrlBaseDomain: '18f.gov',
      targetUrlRedirects: true,
      website: {
        id: 1,
      },
    });
    expect(result.solutionsResult).toEqual({
      dapDetected: true,
      dapParameters: undefined,
      mainElementFinalUrl: true,
      ogArticleModifiedFinalUrl: undefined,
      ogArticlePublishedFinalUrl: undefined,
      ogDescriptionFinalUrl: null,
      ogTitleFinalUrl: null,
      robotsTxtCrawlDelay: undefined,
      robotsTxtDetected: true,
      robotsTxtFinalUrl: 'https://18f.gsa.gov/robots.txt',
      robotsTxtFinalUrlLive: true,
      robotsTxtFinalUrlMimeType: 'text/plain',
      robotsTxtFinalUrlSize: 65,
      robotsTxtSitemapLocations: 'https://18f.gsa.gov/sitemap.xml',
      robotsTxtStatusCode: 200,
      robotsTxtTargetUrlRedirects: true,
      sitemapTargetUrlRedirects: true,
      sitemapXmlCount: result.solutionsResult.sitemapXmlCount, // // This changes often, so ignore non-matches
      sitemapXmlDetected: true,
      sitemapXmlFinalUrl: 'https://18f.gsa.gov/sitemap.xml',
      sitemapXmlFinalUrlFilesize:
        result.solutionsResult.sitemapXmlFinalUrlFilesize, // This changes often, so ignore non-matches
      sitemapXmlFinalUrlLive: true,
      sitemapXmlFinalUrlMimeType: 'application/xml',
      sitemapXmlPdfCount: 0,
      sitemapXmlStatusCode: 200,
      thirdPartyServiceCount: 5,
      thirdPartyServiceDomains:
        'dap.digitalgov.gov,fonts.googleapis.com,search.usa.gov,www.google-analytics.com,www.googletagmanager.com',
      usaClasses: 55,
      uswdsCount: 153,
      uswdsInlineCss: 0,
      uswdsMerriweatherFont: 5,
      uswdsPublicSansFont: 20,
      uswdsSemanticVersion: '2.9.0',
      uswdsSourceSansFont: 5,
      uswdsString: 8,
      uswdsStringInCss: 20,
      uswdsTables: 0,
      uswdsUsFlag: 20,
      uswdsUsFlagInCss: 0,
      uswdsVersion: 20,
      website: {
        id: 1,
      },
    });
  });

  it('returns results for poolsafety.gov', async () => {
    const input: CoreInputDto = {
      websiteId: 1,
      url: 'poolsafety.gov',
      scanId: '123',
    };

    const result = await service.scan(input);
    expect(result.coreResult).toEqual({
      finalUrl: 'https://www.poolsafely.gov/',
      finalUrlBaseDomain: 'poolsafely.gov',
      finalUrlIsLive: true,
      finalUrlMIMEType: 'text/html',
      finalUrlSameDomain: false,
      finalUrlSameWebsite: false,
      finalUrlStatusCode: 200,
      status: 'completed',
      targetUrl404Test: true,
      targetUrlBaseDomain: 'poolsafety.gov',
      targetUrlRedirects: true,
      website: {
        id: 1,
      },
    });
    expect(result.solutionsResult).toEqual({
      dapDetected: true,
      dapParameters: undefined,
      mainElementFinalUrl: false,
      ogArticleModifiedFinalUrl: undefined,
      ogArticlePublishedFinalUrl: undefined,
      ogDescriptionFinalUrl: null,
      ogTitleFinalUrl: 'Pool Safely',
      robotsTxtCrawlDelay: undefined,
      robotsTxtDetected: true,
      robotsTxtFinalUrl: 'https://www.poolsafely.gov/robots.txt',
      robotsTxtFinalUrlLive: true,
      robotsTxtFinalUrlMimeType: 'text/plain',
      robotsTxtFinalUrlSize: 26,
      robotsTxtSitemapLocations: '',
      robotsTxtStatusCode: 200,
      robotsTxtTargetUrlRedirects: true,
      sitemapTargetUrlRedirects: true,
      sitemapXmlCount: 0,
      sitemapXmlDetected: true,
      sitemapXmlFinalUrl: 'https://www.poolsafely.gov/sitemap.xml',
      sitemapXmlFinalUrlFilesize: 26147,
      sitemapXmlFinalUrlLive: true,
      sitemapXmlFinalUrlMimeType: 'text/xml',
      sitemapXmlPdfCount: 0,
      sitemapXmlStatusCode: 200,
      // These two are sensitive to load times - so ignore for e2e purposes
      thirdPartyServiceCount: result.solutionsResult.thirdPartyServiceCount,
      thirdPartyServiceDomains: result.solutionsResult.thirdPartyServiceDomains,
      usaClasses: 0,
      uswdsCount: 0,
      uswdsInlineCss: 0,
      uswdsMerriweatherFont: 0,
      uswdsPublicSansFont: 0,
      uswdsSemanticVersion: undefined,
      uswdsSourceSansFont: 0,
      uswdsString: 0,
      uswdsStringInCss: 0,
      uswdsTables: 0,
      uswdsUsFlag: 0,
      uswdsUsFlagInCss: 0,
      uswdsVersion: 0,
      website: {
        id: 1,
      },
    });
  });
});
