import { Injectable } from '@nestjs/common';

import { PokemonService } from '../pokemon/pokemon.service.js';
import { GetPokemonQueryDto } from '../pokemon/dto/get-pokemon-query.dto.js';

import { RecommendationPlanService } from './recommendation-plan.service.js';

@Injectable()
export class RecommendationPokedexService {
  constructor(
    private readonly recommendationPlanService: RecommendationPlanService,

    private readonly pokemonService: PokemonService,
  ) {}

  async getProfilePokedex(
    userId: string,
    profileId: string,
    query: GetPokemonQueryDto,
  ) {
    const plan = await this.recommendationPlanService.getProfilePlan(
      userId,
      profileId,
    );

    const pokemonIdsByGame = new Map<number, number[]>();

    for (const assignment of plan.assignments) {
      const gameId = assignment.game.externalId;

      const gamePokemonIds = pokemonIdsByGame.get(gameId) ?? [];

      gamePokemonIds.push(assignment.pokemon.externalId);

      pokemonIdsByGame.set(gameId, gamePokemonIds);
    }

    const orderedPokemonIds: number[] = [];

    for (const game of plan.configuredGames) {
      const gamePokemonIds = pokemonIdsByGame.get(game.externalId) ?? [];

      gamePokemonIds.sort((first, second) => first - second);

      orderedPokemonIds.push(...gamePokemonIds);
    }

    const uncoveredPokemonIds = plan.uncovered
      .map((pokemon) => pokemon.externalId)
      .sort((first, second) => first - second);

    orderedPokemonIds.push(...uncoveredPokemonIds);

    return this.pokemonService.findAll(
      query.page,
      query.pageSize,
      query.search,
      query.type,
      query.generation,
      query.generationIds,
      query.minPokemonId,
      query.maxPokemonId,
      orderedPokemonIds,
    );
  }
}
