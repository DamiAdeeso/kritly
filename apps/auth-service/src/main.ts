import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create microservice
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
      },
    }
  );

  // Global validation pipe
  microservice.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await microservice.listen();
  
  const microservicePort = parseInt(process.env.AUTH_SERVICE_PORT || '3001');
  console.log(`🚀 Auth Service (Microservice) is running on: localhost:${microservicePort}`);
  
  // Also create HTTP app for direct API access and documentation
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Rev Auth Service API')
    .setDescription('Authentication microservice for Rev platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const httpPort = process.env.HTTP_PORT || 3002;
  await app.listen(httpPort);
  
  console.log(`🚀 Auth Service (HTTP) is running on: http://localhost:${httpPort}`);
  console.log(`📚 API Documentation: http://localhost:${httpPort}/api/docs`);
}

bootstrap();
