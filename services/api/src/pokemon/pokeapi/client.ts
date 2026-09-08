import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  PokeApiGeneration,
  PokeAPiPokemon,
  PokeApiPokemonForm,
  PokeApiPokemonSpecies,
  PokeApiVersion,
  PokeApiVersionGroup,
  PokeApiEvolutionChain,
  PokeApiPokemonEncounter,
  PokeApiLocationArea,
  PokeApiLocation,
  PokeApiEncounterConditionValue,
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

  async getEvolutionChain(externalId: number): Promise<PokeApiEvolutionChain> {
    const response = await fetch(
      `${this.baseUrl}/evolution-chain/${externalId}`,
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status}`,
      );
    }

    return response.json() as Promise<PokeApiEvolutionChain>;
  }

  async getPokemonEncounters(
    externalId: number,
  ): Promise<PokeApiPokemonEncounter[]> {
    const url = `${this.baseUrl}/pokemon/${externalId}/encounters`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status} for ${url}`,
      );
    }

    return response.json() as Promise<PokeApiPokemonEncounter[]>;
  }

  async getLocationArea(externalId: number): Promise<PokeApiLocationArea> {
    const url = `${this.baseUrl}/location-area/${externalId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status} for ${url}`,
      );
    }

    return response.json() as Promise<PokeApiLocationArea>;
  }

  async getLocation(externalId: number): Promise<PokeApiLocation> {
    const url = `${this.baseUrl}/location/${externalId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status} for ${url}`,
      );
    }

    return response.json() as Promise<PokeApiLocation>;
  }

  async getEncounterConditionValue(
    externalId: number,
  ): Promise<PokeApiEncounterConditionValue> {
    const url = `${this.baseUrl}/encounter-condition-value/${externalId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status} for ${url}`,
      );
    }

    return response.json() as Promise<PokeApiEncounterConditionValue>;
  }

  async getVersion(externalId: number): Promise<PokeApiVersion> {
    const url = `${this.baseUrl}/version/${externalId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `PokeAPI returned status ${response.status} for ${url}`,
      );
    }

    return response.json() as Promise<PokeApiVersion>;
  }
}
