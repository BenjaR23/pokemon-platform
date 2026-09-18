import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { RecommendationCoverageService } from './recommendation-coverage.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationCoverageService: RecommendationCoverageService,
  ) {}

  @Get('coverage/games/:gameId')
  getGameCoverage(
    @Param('gameId', ParseIntPipe)
    gameId: number,
  ) {
    return this.recommendationCoverageService.getGameCoverage(gameId);
  }
}
