import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function readPort(): number {
  const value = process.env.PORT ?? '3001';
  const port = Number(value);

  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

async function bootstrap(): Promise<void> {
  const port = readPort();
  const host = process.env.HOST?.trim() || '127.0.0.1';
  const app = await NestFactory.create(AppModule, { cors: false });

  app.enableShutdownHooks();

  try {
    await app.listen(port, host);
  } catch (error: unknown) {
    await app.close();
    throw error;
  }
}

void bootstrap().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : 'Backend startup failed.',
    'Bootstrap',
  );
  process.exitCode = 1;
});
