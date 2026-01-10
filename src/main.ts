import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Backend API')
    .setDescription('Documentation de l\'API Backend')
    .setVersion('1.0')
    .addTag('api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
    
  SwaggerModule.setup('api', app, document);
  logger.log('Swagger initialisé - Documentation disponible sur http://localhost:' + (process.env.PORT ?? 3000) + '/api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application démarrée avec succès sur le port ${port}`);
}
bootstrap();
