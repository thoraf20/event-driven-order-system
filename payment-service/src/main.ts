import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBITMQ_PAYMENT_QUEUE || 'payment_queue',
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'payment_service_dlx',
          'x-dead-letter-routing-key': 'payment_service_dlq',
        },
      },
    },
  });


  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
  console.log('Payment Service is running on: 3002');
}
bootstrap();

