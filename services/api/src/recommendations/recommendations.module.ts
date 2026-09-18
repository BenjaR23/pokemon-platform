import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationCoverageService } from './recommendation-coverage.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationPlanService } from './recommendation-plan.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecommendationsController],
  providers: [RecommendationCoverageService, RecommendationPlanService],
  exports: [RecommendationCoverageService, RecommendationPlanService],
})
export class RecommendationsModule {}
