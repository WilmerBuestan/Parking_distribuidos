import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasModule } from './personas/personas.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin123',
      database: 'db_personas',
      autoLoadEntities: true, // Carga automáticamente las entidades registradas en los módulos
      synchronize: true, // IMPORTANTE: En desarrollo crea y actualiza las tablas automáticamente
    }),
    PersonasModule,
    RolesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
