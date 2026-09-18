import {
  createPokemonSearchParams,
  type GetPokemonParams,
} from '../api/pokemon.api';

import type {
  PokemonListResponse,
} from '../types/pokemon';

const API_URL =
  'http://localhost:3000';

export type RecommendationGameRole =
  | 'PRIMARY'
  | 'AUXILIARY';

export type RecommendationSource =
  | 'DIRECT'
  | 'EVOLUTION';

export interface RecommendationConfiguredGame {
  externalId: number;
  name: string;
  role: RecommendationGameRole;
  position: number;
}

export interface RecommendationPokemon {
  externalId: number;
  name: string;
}

export interface RecommendationAssignment {
  pokemon: RecommendationPokemon;

  game: {
    externalId: number;
    name: string;
    role: RecommendationGameRole;
    position: number;
  };

  source: RecommendationSource;
}

export interface SuggestedGame {
  externalId: number;
  name: string;
  coveredSpecies:
    RecommendationPokemon[];
}

export interface RecommendationPlan {
  objective: {
    total: number;
  };

  configuredGames:
    RecommendationConfiguredGame[];

  assignments:
    RecommendationAssignment[];

  uncovered:
    RecommendationPokemon[];

  remainingUncovered:
    RecommendationPokemon[];

  suggestedGames:
    SuggestedGame[];

  stillUncovered:
    RecommendationPokemon[];
}

export async function getRecommendationPlan(
  profileId: string,
): Promise<RecommendationPlan> {
  const response = await fetch(
    `${API_URL}/recommendations/profiles/${profileId}/plan`,
    {
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load recommendation plan',
    );
  }

  return response.json() as Promise<RecommendationPlan>;
}

export async function getRecommendationPokedex(
  profileId: string,
  params: GetPokemonParams,
): Promise<PokemonListResponse> {
  const searchParams =
    createPokemonSearchParams(
      params,
    );

  const response = await fetch(
    `${API_URL}/recommendations/profiles/${profileId}/pokedex?${searchParams.toString()}`,
    {
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Failed to load recommendation Pokedex',
    );
  }

  return response.json() as Promise<PokemonListResponse>;
}