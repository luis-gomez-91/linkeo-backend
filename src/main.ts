import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Linkeo API')
    .setDescription('API del SaaS Link in Bio - planes, usuarios, páginas, enlaces y pagos con Nuvei/Paymentez')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Linkeo API: http://localhost:${port}`);
  console.log(`Swagger:   http://localhost:${port}/api/docs`);
}
bootstrap().catch(console.error);
