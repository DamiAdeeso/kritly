import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create gRPC microservice
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(process.cwd(), 'libs/common/src/proto/auth.proto'),
        url: `0.0.0.0:${process.env.AUTH_SERVICE_PORT || 3001}`,
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
  console.log(`🚀 Auth Service (gRPC) is running on: 0.0.0.0:${microservicePort}`);
  
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

  const httpPort = process.env.PORT || process.env.HTTP_PORT || 3002;
  await app.listen(httpPort, '0.0.0.0');
  
  console.log(`🚀 Auth Service (HTTP) is running on: http://localhost:${httpPort}`);
  console.log(`📚 API Documentation: http://localhost:${httpPort}/api/docs`);
}

bootstrap();
