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
    .setTitle('Tickets API')
    .setDescription(
      'Microservicio orquestador del sistema de Parqueadero. Al emitir un ticket de ' +
        'entrada, valida la persona (personas-service), la disponibilidad del vehículo ' +
        '(vehiculos-service) y asigna un espacio libre en la zona (zonas-service). ' +
        'Al procesar la salida, calcula el tiempo y la tarifa, y libera tanto el ' +
        'vehículo como el espacio ocupado.',
    )
    .setVersion('1.0')
    .addTag('tickets')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3004);
}
void bootstrap();