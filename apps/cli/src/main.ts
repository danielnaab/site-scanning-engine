import { Command } from 'commander';
import { parseInt } from 'lodash';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { IngestController } from './ingest.controller';
import { QueueController } from './queue.controller';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger:
      process.env.NODE_ENV === 'dev'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['log', 'error', 'warn'],
  });
  return app;
}

function printMemoryUsage() {
  const used = process.memoryUsage();
  for (const key in used) {
    console.log(
      `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
    );
  }
}

async function ingest(cmdObj) {
  const nestApp = await bootstrap();
  const controller = nestApp.get(IngestController);
  console.log('ingesting target urls');

  if (cmdObj.limit) {
    await controller.writeUrls(cmdObj.limit);
  } else {
    await controller.writeUrls();
  }
  printMemoryUsage();
  await nestApp.close();
}

async function queueScans() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(QueueController);
  console.log('queueing scan jobs');

  await controller.queueScans();
  printMemoryUsage();
  await nestApp.close();
}

async function clearQueue() {
  const nestApp = await bootstrap();
  const controller = nestApp.get(QueueController);
  console.log('queueing scan jobs');

  await controller.clearQueue();
  printMemoryUsage();
  await nestApp.close();
}

async function main() {
  const program = new Command();
  program.version('0.0.1');
  program.description(
    'A command line interface for the site-scanning application.',
  );

  // ingest
  program
    .command('ingest')
    .description('ingest adds target urls to the Website database table')
    .option(
      '--limit <number>',
      'limits the ingest service to <number> urls',
      parseInt,
    )
    .action(ingest);

  // clear-queue
  program
    .command('clear-queue')
    .description('clears the Redis queue and cleans up old jobs')
    .action(clearQueue);

  // queue-scans
  program
    .command('queue-scans')
    .description(
      'queue-scans adds each target in the Website database table to the redis queue',
    )
    .action(queueScans);

  await program.parseAsync(process.argv);
}

main();
