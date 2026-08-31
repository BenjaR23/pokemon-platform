import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import {
  PokeApiChainLink,
  PokeApiEvolutionDetail,
} from './pokeapi/pokeapi.types.js';

function getExternalIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  const id = Number(parts.at(-1));

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid PokeAPI resource URL: ${url}`);
  }

  return id;
}

@Injectable()
export class EvolutionService {
  constructor(
    private readonly pokeApiClient: PokeApiClient,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Se obtiene una cadena evolutica completa desde PokeAPI
   * y garantiza que su registro base exista en PostgreSQL.
   *
   * La sincronizacion de las transiciones y reglas se agregara
   * posteriormente recorriendo evolutionChain.chain.
   */
  async syncEvolutionChain(externalId: number) {
    const evolutionChain =
      await this.pokeApiClient.getEvolutionChain(externalId);

    const savedChain = await this.prisma.evolutionChain.upsert({
      where: {
        externalId: evolutionChain.id,
      },
      update: {},
      create: {
        externalId: evolutionChain.id,
      },
    });

    await this.syncEvolutionBranch(savedChain.id, evolutionChain.chain);

    return savedChain;
  }

  private async syncEvolutionTransition(
    chainId: string,
    fromLink: PokeApiChainLink,
    toLink: PokeApiChainLink,
  ) {
    /**
     * Cada ChainLink apunta a una especie de Pokemon.
     * Los IDs externos se obtienen directamente desde sus URLs.
     */
    const fromSpeciesExternalId = getExternalIdFromUrl(fromLink.species.url);

    const toSpeciesExternalId = getExternalIdFromUrl(toLink.species.url);

    /**
     * Las especies deben existir previamente en la base de datos.
     * EvolutionService no es responsable de sincronizar PokemonSpecies,
     * solo de relacionarlas.
     */
    const fromSpecies = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId: fromSpeciesExternalId,
      },
    });

    const toSpecies = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId: toSpeciesExternalId,
      },
    });

    /**
     * Una cadena de PokeAPI puede contener especies que aun no hayan sido sincronizadas en nuestra base de datos.
     *
     * En ese caso no se puede crear la relacion Evolution porque sus claves
     * foraneas requieren ambas PokemonSpecies.
     *
     * No se considera un error: la transicion podra crearse en una
     * sincronizacion posterior cuando ambas especies existan.
     */
    if (!fromSpecies || !toSpecies) {
      return;
    }

    const detailsByTrigger = new Map<number, PokeApiEvolutionDetail[]>();

    for (const evolutionDetail of toLink.evolution_details) {
      const triggerExternalId = getExternalIdFromUrl(
        evolutionDetail.trigger.url,
      );

      const existingDetails = detailsByTrigger.get(triggerExternalId) ?? [];

      existingDetails.push(evolutionDetail);

      detailsByTrigger.set(triggerExternalId, existingDetails);
    }

    for (const details of detailsByTrigger.values()) {
      const firstDetail = details[0];

      const triggerExternalId = getExternalIdFromUrl(firstDetail.trigger.url);

      const trigger = await this.prisma.evolutionTrigger.upsert({
        where: {
          externalId: triggerExternalId,
        },
        update: {
          name: firstDetail.trigger.name,
        },
        create: {
          externalId: triggerExternalId,
          name: firstDetail.trigger.name,
        },
      });

      const evolution = await this.prisma.evolution.upsert({
        where: {
          chainId_fromSpeciesId_toSpeciesId_triggerId: {
            chainId,
            fromSpeciesId: fromSpecies.id,
            toSpeciesId: toSpecies.id,
            triggerId: trigger.id,
          },
        },
        update: {},
        create: {
          chainId,
          fromSpeciesId: fromSpecies.id,
          toSpeciesId: toSpecies.id,
          triggerId: trigger.id,
        },
      });

      await this.prisma.evolutionRule.deleteMany({
        where: {
          evolutionId: evolution.id,
        },
      });

      for (const detail of details) {
        await this.createEvolutionRule(evolution.id, detail);
      }
    }
  }

  private async syncEvolutionBranch(
    chainId: string,
    currentLink: PokeApiChainLink,
  ): Promise<void> {
    // Cada hijo representa una posible evolucion desde la especie actual.
    for (const child of currentLink.evolves_to) {
      await this.syncEvolutionTransition(chainId, currentLink, child);

      // Luego se procesan recursivamente las evoluciones que pueden ocurrir desde ese hijo.
      await this.syncEvolutionBranch(chainId, child);
    }
  }

  private async syncItem(
    itemResource: {
      name: string;
      url: string;
    } | null,
  ) {
    if (!itemResource) {
      return null;
    }

    const externalId = getExternalIdFromUrl(itemResource.url);

    return this.prisma.item.upsert({
      where: {
        externalId,
      },
      update: {
        name: itemResource.name,
      },
      create: {
        externalId,
        name: itemResource.name,
      },
    });
  }

  private async createEvolutionRule(
    evolutionId: string,
    evolutionDetail: PokeApiEvolutionDetail,
  ) {
    const item = await this.syncItem(evolutionDetail.item);

    return this.prisma.evolutionRule.create({
      data: {
        evolutionId,

        minLevel: evolutionDetail.min_level,
        minHappiness: evolutionDetail.min_happiness,
        minBeauty: evolutionDetail.min_beauty,
        minAffection: evolutionDetail.min_affection,

        /**
         * PokeAPI utiliza una cadena vacia cuando no existe un restriccion de hora.
         *
         * En la base de datos se prefiere null para representar ausencia de una condicion.
         */
        timeOfDay:
          evolutionDetail.time_of_day === ''
            ? null
            : evolutionDetail.time_of_day,

        itemId: item?.id ?? null,
      },
    });
  }
}
