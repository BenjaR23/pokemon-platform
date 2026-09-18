import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

import { RecommendationCoverageService } from './recommendation-coverage.service';
import { RecommendationPlanService } from './recommendation-plan.service';
import { ExtraGameRecommendationService } from './extra-game-recommendation.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationCoverageService: RecommendationCoverageService,
    private readonly recommendationPlanService: RecommendationPlanService,
    private readonly extraGameRecommendationService: ExtraGameRecommendationService,
  ) {}

  @Get('coverage/games/:gameId')
  getGameCoverage(
    @Param('gameId', ParseIntPipe)
    gameId: number,
  ) {
    return this.recommendationCoverageService.getGameCoverage(gameId);
  }

  @Get('profiles/:profileId/plan')
  @UseGuards(AuthGuard)
  getProfilePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.recommendationPlanService.getProfilePlan(user.id, profileId);
  }

  @Get('profiles/:profileId/extra-candidates')
  @UseGuards(AuthGuard)
  async getExtraCandidates(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param('profileId')
    profileId: string,
  ) {
    const plan = await this.recommendationPlanService.getProfilePlan(
      user.id,
      profileId,
    );

    return this.extraGameRecommendationService.inspectCandidateGames(
      plan.uncovered,
      plan.configuredGames.map((game) => game.externalId),
    );
  }
}
