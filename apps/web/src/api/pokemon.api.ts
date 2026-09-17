import type {
  PokemonGenerationOption,
  PokemonListResponse,
  PokemonTypeOption,
} from '../types/pokemon';

const API_URL = 'http://localhost:3000';

export interface GetPokemonParams {
  page: number;
  pageSize?: number;
  search?: string;
  type?: string;
  generation?: number;
  generationIds?: number[];
  minPokemonId?: number;
  maxPokemonId?: number;
}

export async function getPokemon(
  params: GetPokemonParams,
): Promise<PokemonListResponse> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: (params.pageSize ?? 24).toString(),
  });

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.type) {
    searchParams.set('type', params.type);
  }

  if (params.generation !== undefined) {
    searchParams.set(
      'generation',
      params.generation.toString(),
    );
  }

  if (
    params.generationIds &&
    params.generationIds.length > 0
  ) {
    searchParams.set(
      'generationIds',
      params.generationIds.join(','),
    );
  }

  if (params.minPokemonId !== undefined) {
    searchParams.set(
      'minPokemonId',
      params.minPokemonId.toString(),
    );
  }

  if (params.maxPokemonId !== undefined) {
    searchParams.set(
      'maxPokemonId',
      params.maxPokemonId.toString(),
    );
  }

  const response = await fetch(
    `${API_URL}/pokemon?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon');
  }

  return response.json() as Promise<PokemonListResponse>;
}

export async function getPokemonTypes(): Promise<
  PokemonTypeOption[]
> {
  const response = await fetch(
    `${API_URL}/pokemon/types`,
  );

  if (!response.ok) {
    throw new Error(
      'Failed to fetch Pokemon types',
    );
  }

  return response.json() as Promise<
    PokemonTypeOption[]
  >;
}

export async function getPokemonGenerations(): Promise<
  PokemonGenerationOption[]
> {
  const response = await fetch(
    `${API_URL}/pokemon/generations`,
  );

  if (!response.ok) {
    throw new Error(
      'Failed to fetch Pokemon generations',
    );
  }

  return response.json() as Promise<
    PokemonGenerationOption[]
  >;
}