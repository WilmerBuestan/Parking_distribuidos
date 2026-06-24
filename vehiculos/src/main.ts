import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Vehículos API')
    .setDescription(
      'Microservicio de gestión de vehículos del sistema de Parqueadero. ' +
        'Usa herencia de tabla (Auto, Camioneta, Motocicleta). Expone búsqueda ' +
        'por placa y consulta/actualización de disponibilidad, usadas por ' +
        'tickets-service al emitir y cerrar tickets.',
    )
    .setVersion('1.0')
    .addTag('vehiculos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
