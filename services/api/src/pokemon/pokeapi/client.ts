import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  PokeApiGeneration,
  PokeAPiPokemon,
  PokeApiPokemonForm,
  PokeApiPokemonSpecies,
  PokeApiVersion,
  PokeApiVersionGroup,
} from './pokeapi.types.js';

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

  /**
   * Obtiene una forma concreta desde PokeAPI.
   *
   * El endpoint /pokemon-form/:id contiene informacion
   * especifica de una forma asociada a una variedad.
   */
  async getPokemonForm(externalId: number): Promise<PokeApiPokemonForm> {
    const response = await fetch(`${this.baseUrl}/pokemon-form/${externalId}`);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeApiPokemonForm>;
  }

  // Obtiene una generacion desde PokeAPI.
  async getGeneration(externalId: number): Promise<PokeApiGeneration> {
    const response = await fetch(`${this.baseUrl}/generation/${externalId}`);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeApiGeneration>;
  }

  // Obtiene un grupo de versiones desde PokeAPI.
  async getVersionGroup(externalId: number): Promise<PokeApiVersionGroup> {
    const response = await fetch(`${this.baseUrl}/version-group/${externalId}`);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeApiVersionGroup>;
  }

  // Obtiene una version/juego concreto desde PokeAPI.
  async getVersion(externalId: number): Promise<PokeApiVersion> {
    const response = await fetch(`${this.baseUrl}/version/${externalId}`);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeApiVersion>;
  }
}
