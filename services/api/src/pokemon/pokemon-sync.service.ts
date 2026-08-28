import { Injectable } from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';
import { PrismaService } from '../prisma/prisma.service';
import { createPokemonSyncContext } from './pokemon-sync-context.js';

@Injectable()
export class PokemonSyncService {
  constructor(
    // Servicio que sabe sincronizar una especie concreta.
    private readonly pokemonService: PokemonService,

    // Prisma se utiliza para registrar cada ejecucion de sincronizacion.
    private readonly prisma: PrismaService,
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
