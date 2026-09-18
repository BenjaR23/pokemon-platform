import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationCoverageService } from './recommendation-coverage.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationPlanService } from './recommendation-plan.service';
import { AuthModule } from '../auth/auth.module';
import { ExtraGameRecommendationService } from './extra-game-recommendation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationCoverageService,
    RecommendationPlanService,
    ExtraGameRecommendationService,
  ],
  exports: [
    RecommendationCoverageService,
    RecommendationPlanService,
    ExtraGameRecommendationService,
  ],
})
export class RecommendationsModule {}
