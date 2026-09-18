import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PokemonModule } from '../pokemon/pokemon.module.js';

import { RecommendationCoverageService } from './recommendation-coverage.service';
import { RecommendationPlanService } from './recommendation-plan.service';
import { ExtraGameRecommendationService } from './extra-game-recommendation.service';
import { RecommendationPokedexService } from './recommendation-pokedex.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [PrismaModule, AuthModule, PokemonModule],

  controllers: [RecommendationsController],

  providers: [
    RecommendationCoverageService,
    RecommendationPlanService,
    ExtraGameRecommendationService,
    RecommendationPokedexService,
  ],

  exports: [
    RecommendationCoverageService,
    RecommendationPlanService,
    ExtraGameRecommendationService,
    RecommendationPokedexService,
  ],
})
export class RecommendationsModule {}
