import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PokeAPiPokemon, PokeApiPokemonSpecies } from './pokeapi.types.js';

@Injectable()
export class PokeApiClient {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  async getPokemonSpecies(externalId: number): Promise<PokeApiPokemonSpecies> {
    const response = await fetch(
      `${this.baseUrl}/pokemon-species/${externalId}`,
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeApi returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeApiPokemonSpecies>;
  }

  async getPokemon(externalId: number): Promise<PokeAPiPokemon> {
    const response = await fetch(`${this.baseUrl}/pokemon/${externalId}`);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeAPiPokemon>;
  }
}
