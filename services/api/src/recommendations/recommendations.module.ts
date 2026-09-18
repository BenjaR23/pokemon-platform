import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationCoverageService } from './recommendation-coverage.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [RecommendationCoverageService],
  exports: [RecommendationCoverageService],
})
export class RecommendationsModule {}
