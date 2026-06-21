import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Esta línea activa las validaciones de los DTOs
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Personas API')
    .setDescription(
      'Microservicio de gestión de personas y usuarios del sistema de Parqueadero. ' +
        'Expone búsquedas por cédula, username y apellido, usadas por tickets-service ' +
        'para validar la identidad de quien solicita un ticket de entrada.',
    )
    .setVersion('1.0')
    .addTag('personas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
}
void bootstrap();