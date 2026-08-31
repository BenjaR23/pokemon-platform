import { Injectable } from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';
import { PrismaService } from '../prisma/prisma.service';
import { createPokemonSyncContext } from './pokemon-sync-context.js';
import { EvolutionService } from './evolution.service.js';

@Injectable()
export class PokemonSyncService {
  constructor(
    // Servicio que sabe sincronizar una especie concreta.
    private readonly pokemonService: PokemonService,

    // Prisma se utiliza para registrar cada ejecucion de sincronizacion.
    private readonly prisma: PrismaService,

    private readonly evolutionService: EvolutionService,
  ) {}

  /**
   * Sincroniza un rango inclusivo de especies.
   *
   * Ejemplo:
   * syncRange(1, 151)
   *
   * sincronizara:
   * 1, 2, 3, ..., 151
   */
  async syncRange(startId: number, endId: number) {
    // Validacion basica del rango recibido.
    if (startId < 1 || endId < startId) {
      throw new Error('Invalid Pokemon synchronization range');
    }

    // Registramos el inicio de la ejecucion.
    const syncRun = await this.prisma.syncRun.create({
      data: {
        source: 'pokeapi',
        status: 'running',
      },
    });

    try {
      /**
       * Se sincronizan las especies de forma secuencial.
       *
       * Por ahora evitamos concurrencia para:
       * - reducir carga sobre PokeAPI
       * - simplificar errores
       * - facilitar debugging
       *
       * Mas adelante se podra introducir concurrencia controlada.
       */
      const syncContext = createPokemonSyncContext();

      for (let externalId = startId; externalId <= endId; externalId++) {
        await this.pokemonService.syncSpecies(externalId, syncContext);
      }

      /**
       * FASE 2: sincronizacion de cadenas evolutivas.
       *
       * Primero terminamos de persistir todas las especies del rango.
       * De esta forma EvolutionService tiene la mayor cantidad posible
       * de especies disponibles al momento de crear las transiciones.
       */
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

      /**
       * Varias especies pueden compartir exactamente la misma cadena.
       *
       * Ejemplo: Bulbasaur, Ivysaur y Venusaur apuntan todos a la cadena 1.
       *
       * Set evita solicitar y procesar esa cadena tres veces.
       */
      const evolutionChainExternalIds = new Set<number>();

      for (const species of synchronizedSpecies) {
        if (species.evolutionChain) {
          evolutionChainExternalIds.add(species.evolutionChain.externalId);
        }
      }

      // Cada cadena se sincroniza una sola vez durante esta ejecucion.
      for (const evolutionChainExternalId of evolutionChainExternalIds) {
        await this.evolutionService.syncEvolutionChain(
          evolutionChainExternalId,
        );
      }

      // Si todas las especies se sincronizaron correctamente, se marca la ejecucion como completada.
      return await this.prisma.syncRun.update({
        where: {
          id: syncRun.id,
        },
        data: {
          status: 'completed',
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      // Convertimos cualquier tipo de error a un mensaje persistible.
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown synchronization error';

      // Se registra el fallo antes de propagar el error.
      await this.prisma.syncRun.update({
        where: {
          id: syncRun.id,
        },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          error: message,
        },
      });

      // El error vuelve a subir para que el caller sepa que la sincronizacion no termino correctamente.
      throw error;
    }
  }
}
