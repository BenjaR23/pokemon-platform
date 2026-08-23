import { Injectable } from '@nestjs/common';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Extrae el ID numerico de una URL de recurso de PokeAPI.
function getExternalIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  const id = Number(parts.at(-1));

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid PokeAPI resource URL: ${url}`);
  }

  return id;
}
@Injectable()
export class PokemonService {
  constructor(
    // Cliente responsable exclusivamente de comunicarse con PokeAPI.
    private readonly pokeApiClient: PokeApiClient,

    // PrismaService nos permite persistir los datos obtenidos en PostgreSQL.
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Sincroniza una especie individual desde PokeAPI.
   *
   * Flujo:
   * 1. Obtener la especie desde PokeAPI.
   * 2. Resolver la generacion asociada.
   * 3. Resolver la cadena evolutiva asociada.
   * 4. Crear o actualizar la especie de PostgreSQL.
   */
  async syncSpecies(externalId: number) {
    // Obtenemos la informacion de la especie desde PokeAPI.
    const species = await this.pokeApiClient.getPokemonSpecies(externalId);

    // Extraemos us ID para relacionarlo con la tabla Generation.
    const generationExternalId = getExternalIdFromUrl(species.generation.url);

    // Se crea la generacion si no existo, si existe, se actualiza su nombre.
    const generation = await this.prisma.generation.upsert({
      where: {
        externalId: generationExternalId,
      },
      update: {
        name: species.generation.name,
      },
      create: {
        externalId: generationExternalId,
        name: species.generation.name,
      },
    });

    // Solo se crea una cadena evolutiva asociada si PokeAPI proporciona la url.
    let evolutionChainId: string | null = null;

    if (species.evolution_chain) {
      const evolutionChainExternalId = getExternalIdFromUrl(
        species.evolution_chain.url,
      );

      // Se crea la cadena evolutiva si no existe.
      const evolutionChain = await this.prisma.evolutionChain.upsert({
        where: {
          externalId: evolutionChainExternalId,
        },
        update: {},
        create: {
          externalId: evolutionChainExternalId,
        },
      });

      // Se guarda el UUID interno generado por la base de datos.
      evolutionChainId = evolutionChain.id;
    }

    // Se crea o actualiza la especie en nuestra base de datos.
    const savedSpecies = await this.prisma.pokemonSpecies.upsert({
      where: {
        externalId: species.id,
      },
      update: {
        name: species.name,
        generationId: generation.id,
        evolutionChainId,
      },
      create: {
        externalId: species.id,
        name: species.name,
        generationId: generation.id,
        evolutionChainId,
      },
    });

    // Se busca la variedad marcada como default por PokeAPI.
    const defaultVariety = species.varieties.find(
      (variety) => variety.is_default,
    );

    if (defaultVariety) {
      const varietyExternalId = getExternalIdFromUrl(
        defaultVariety.pokemon.url,
      );

      // Se consulta /pokemon/:id.
      const pokemon = await this.pokeApiClient.getPokemon(varietyExternalId);

      // Upsert.
      await this.prisma.pokemonVariety.upsert({
        where: {
          externalId: pokemon.id,
        },
        update: {
          name: pokemon.name,
          isDefault: true,
          speciesId: savedSpecies.id,
        },
        create: {
          externalId: pokemon.id,
          name: pokemon.name,
          isDefault: true,
          speciesId: savedSpecies.id,
        },
      });
    }

    // Por ahora se devuelve PokemonSpecies.
    return savedSpecies;
  }
}
