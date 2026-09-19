import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module.js';
import { PokemonModule } from './pokemon/pokemon.module.js';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';

import { RecommendationsModule } from './recommendations/recommendations.module';

import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PokemonModule,
    AuthModule,
    UsersModule,
    GamesModule,
    RecommendationsModule,
    HealthModule,
  ],
})
export class AppModule {}
