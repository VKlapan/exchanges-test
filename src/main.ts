import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'exchanges',
      protoPath: join(__dirname, '../proto/exchanges.proto'),
      url: process.env.GRPC_BIND_URL || '0.0.0.0:50051',
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
