import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const cluster = require('node:cluster');
const os = require('node:os');

async function bootstrap() {
  console.log("Checking Redis URL:", process.env.UPSTASH_REDIS_REST_URL);
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.enableCors(); 
  
  await app.init();
  const server = app.getHttpServer();
  
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  await new Promise<void>((resolve) => {
    server.listen(process.env.PORT ?? 3000, '0.0.0.0', 5000, () => {
      console.log(`[WORKER] Node process ${process.pid} booted and listening.`);
      resolve();
    });
  });
}

if (cluster.isPrimary || cluster.isMaster) {
  // Check for cloud limits, otherwise default to high-performance local tuning
  const maxLocalCores = Math.min(os.cpus().length, 8);
  const numWorkers = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : maxLocalCores; 
  
  console.log(`[MASTER] Hardware detected. Scaling to ${numWorkers} worker(s).`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker: any) => {
    console.log(`[MASTER] Worker ${worker.process.pid} died. Respawning...`);
    cluster.fork();
  });
} else {
  bootstrap().catch(err => {
    console.error(`[FATAL] Worker ${process.pid} crashed:`, err);
    process.exit(1);
  });
}