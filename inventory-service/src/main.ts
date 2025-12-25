import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBITMQ_INVENTORY_QUEUE || 'inventory_queue',
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'inventory_service_dlx',
          'x-dead-letter-routing-key': 'inventory_service_dlq',
        },
      },
    },
  });


  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3003);
  console.log('Inventory Service is running on: 3003');
}
bootstrap();

