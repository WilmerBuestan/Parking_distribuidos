import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Asignación y Trazabilidad API')
    .setDescription(
      'Microservicio que gestiona la asignación de vehículos a propietarios usando ' +
        'clave compuesta (userId + vehicleId), con registro automático de auditoría ' +
        'desacoplado mediante TypeORM Subscribers.',
    )
    .setVersion('1.0')
    .addTag('asignaciones')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3005);
}
void bootstrap();
