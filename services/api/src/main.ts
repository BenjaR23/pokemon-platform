import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Valida automaticamente todos lo DTO recibidos por la API.
  app.useGlobalPipes(
    new ValidationPipe({
      // Elimina propiedades que no esten declaradas en el DTO.
      whitelist: true,

      // En vez de ignorar propiedades desconocidas, devuelve 400 Bad Request.
      forbidNonWhitelisted: true,

      // Convierte el payload al tipo definido por el DTO.
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
