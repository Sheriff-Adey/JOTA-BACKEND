import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const port = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '2gb' }));
  app.setGlobalPrefix('api/v1');

  app.use((req, res, next) => {
    res.setTimeout(7200000); // 1 hour timeout
    next();
  });

  const options = new DocumentBuilder()
    .setTitle('JOTA API')
    .setDescription('JOTA API description')
    .setVersion('1.0')
    .addTag('jota')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Authorization')
    .build();
    
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
 
  app.enableCors();

  await app.listen(port);
}
bootstrap();
