import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiKeyGuard } from './guards/api-key-guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key',
  });
  const config = new DocumentBuilder()
    .setTitle('Knowledge Engine API')
    .setDescription('API for website scraping, file upload and knowledge base management')
    .setVersion('1.0')
    .addTag('Knowledge')
    .addApiKey({type: 'apiKey',name: 'x-api-key',in: 'header'},'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
