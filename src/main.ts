import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const cluster = require('node:cluster');
const os = require('node:os');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); 
  
  // Clean, standard NestJS startup. 
  // Let the framework handle the HTTP server bind and router attachment.
  await app.listen(3000, '0.0.0.0');
  console.log(`[WORKER] Node process ${process.pid} booted and listening on 0.0.0.0:3000`);
}

if (cluster.isPrimary || cluster.isMaster) {
  const numWorkers = 8; 
  console.log(`[MASTER] Scaling to ${numWorkers} workers.`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker: any) => {
    console.log(`[MASTER] Worker ${worker.process.pid} died. Respawning...`);
    cluster.fork();
  });
} else {
  bootstrap().catch(err => {
    console.error(`[FATAL] Worker crashed:`, err);
    process.exit(1);
  });
}