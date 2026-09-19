import { ConflictException, Injectable } from '@nestjs/common';

import { PokemonService } from './pokemon.service.js';
import { PrismaService } from '../prisma/prisma.service';
import { createPokemonSyncContext } from './pokemon-sync-context.js';
import { EvolutionService } from './evolution.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class PokemonSyncService {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly prisma: PrismaService,
    private readonly evolutionService: EvolutionService,
  ) {}

  async syncRange(startId: number, endId: number) {
    if (startId < 1 || endId < startId) {
      throw new Error('Invalid Pokemon synchronization range');
    }

    let syncRunId: string;

    try {
      const syncRun = await this.prisma.syncRun.create({
        data: {
          source: 'pokeapi',
          status: 'running',
          active: true,
        },
      });

      syncRunId = syncRun.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A Pokemon synchronization is already running',
        );
      }

      throw error;
    }

    try {
      const syncContext = createPokemonSyncContext();

      for (let externalId = startId; externalId <= endId; externalId++) {
        await this.pokemonService.syncSpecies(externalId, syncContext);
      }

      const synchronizedSpecies = await this.prisma.pokemonSpecies.findMany({
        where: {
          externalId: {
            gte: startId,
            lte: endId,
          },
        },
        select: {
          evolutionChain: {
            select: {
              externalId: true,
            },
          },
        },
      });

      const evolutionChainExternalIds = new Set<number>();

      for (const species of synchronizedSpecies) {
        if (species.evolutionChain) {
          evolutionChainExternalIds.add(species.evolutionChain.externalId);
        }
      }

      for (const evolutionChainExternalId of evolutionChainExternalIds) {
        await this.evolutionService.syncEvolutionChain(
          evolutionChainExternalId,
        );
      }

      return await this.prisma.syncRun.update({
        where: {
          id: syncRunId,
        },
        data: {
          status: 'completed',
          active: null,
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown synchronization error';

      await this.prisma.syncRun.update({
        where: {
          id: syncRunId,
        },
        data: {
          status: 'failed',
          active: null,
          finishedAt: new Date(),
          error: message,
        },
      });

      throw error;
    }
  }
}
