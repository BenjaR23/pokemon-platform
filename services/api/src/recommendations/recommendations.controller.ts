import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

import { GetPokemonQueryDto } from '../pokemon/dto/get-pokemon-query.dto.js';

import { RecommendationCoverageService } from './recommendation-coverage.service';

import { RecommendationPlanService } from './recommendation-plan.service';

import { RecommendationPokedexService } from './recommendation-pokedex.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationCoverageService: RecommendationCoverageService,

    private readonly recommendationPlanService: RecommendationPlanService,

    private readonly recommendationPokedexService: RecommendationPokedexService,
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
    @CurrentUser()
    user: AuthenticatedUser,

    @Param('profileId')
    profileId: string,
  ) {
    return this.recommendationPlanService.getProfilePlan(user.id, profileId);
  }

  @Get('profiles/:profileId/pokedex')
  @UseGuards(AuthGuard)
  getProfilePokedex(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param('profileId')
    profileId: string,

    @Query()
    query: GetPokemonQueryDto,
  ) {
    return this.recommendationPokedexService.getProfilePokedex(
      user.id,
      profileId,
      query,
    );
  }
}
