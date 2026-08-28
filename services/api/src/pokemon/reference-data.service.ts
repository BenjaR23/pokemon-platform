import { Injectable } from '@nestjs/common';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PokemonSyncContext } from './pokemon-sync-context.js';

/**
 * Extrae el ID numerico contenido al final
 * de una URL de recurso de PokeAPI.
 */
function getExternalIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean);
  const id = Number(parts.at(-1));

  if (!Number.isInteger(id)) {
    throw new Error(`Invalid PokeAPI resource URL: ${url}`);
  }

  return id;
}

@Injectable()
export class ReferenceDataService {
  constructor(
    private readonly pokeApiClient: PokeApiClient,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Sincroniza una generacion y todos los VersionGroup
   * asociados directamente a ella.
   *
   * Generation
   * - VersionGroup
   * -- Game
   */
  async syncGeneration(
    generationExternalId: number,
    syncContext?: PokemonSyncContext,
  ) {
    // Si esta generacion ya fue sincronizada durante esta misma ejecucion, se reutiliza el resultado.
    const cachedGeneration = syncContext?.generations.get(generationExternalId);

    if (cachedGeneration) {
      return cachedGeneration;
    }

    // Se consultan los datos completos de la generacion.
    const generationData =
      await this.pokeApiClient.getGeneration(generationExternalId);

    // Se crea o actualiza Generation.
    const generation = await this.prisma.generation.upsert({
      where: {
        externalId: generationData.id,
      },
      update: {
        name: generationData.name,
      },
      create: {
        externalId: generationData.id,
        name: generationData.name,
      },
    });

    // Cada VersionGroup de la generacion se delega
    // al metodo especializado syncVersionGroup.
    for (const versionGroupResource of generationData.version_groups) {
      const versionGroupExternalId = getExternalIdFromUrl(
        versionGroupResource.url,
      );

      await this.syncVersionGroup(
        versionGroupExternalId,
        generation.id,
        syncContext,
      );
    }

    // La generacion se considera sincronizada para esta ejecucion solamente despues de completar todos sus VersionGroup.
    syncContext?.generations.set(generationExternalId, generation);

    return generation;
  }

  /**
   * Sincroniza un VersionGroup concreto junto con sus juegos.
   *
   * Puede utilizarse de dos maneras:
   *
   * 1. Desde syncGeneration(), entregando generationId.
   * 2. Directamente desde otro servicio cuando un VersionGroup
   *    todavia no existe en la base de datos.
   */
  async syncVersionGroup(
    versionGroupExternalId: number,
    generationId?: string,
    syncContext?: PokemonSyncContext,
  ) {
    // Si este VersionGroup ya fue sincronizado durante esta misma ejecucion, se reutiliza el resultado.
    const cachedVersionGroup = syncContext?.versionGroups.get(
      versionGroupExternalId,
    );

    if (cachedVersionGroup) {
      return cachedVersionGroup;
    }

    // Se obtienen los datos completos del VersionGroup.
    const versionGroupData = await this.pokeApiClient.getVersionGroup(
      versionGroupExternalId,
    );

    /*
     * Si ya conocemos el UUID interno de Generation,
     * por ejemplo porque syncGeneration() llamó este método,
     * podemos utilizarlo directamente.
     */
    let resolvedGenerationId = generationId;

    /*
     * Si syncVersionGroup() fue llamado independientemente,
     * necesitamos averiguar a qué Generation pertenece.
     */
    if (!resolvedGenerationId) {
      const generationExternalId = getExternalIdFromUrl(
        versionGroupData.generation.url,
      );

      /*
       * Se sincroniza la Generation correspondiente compartiendo
       * el mismo contexto de esta ejecucion.
       */
      const generation = await this.syncGeneration(
        generationExternalId,
        syncContext,
      );

      resolvedGenerationId = generation.id;
    }

    // Se crea o actualiza VersionGroup.
    const versionGroup = await this.prisma.versionGroup.upsert({
      where: {
        externalId: versionGroupData.id,
      },
      update: {
        name: versionGroupData.name,
        generationId: resolvedGenerationId,
      },
      create: {
        externalId: versionGroupData.id,
        name: versionGroupData.name,
        generationId: resolvedGenerationId,
      },
    });

    // Se recorren todos los juegos concretos del VersionGroup.
    for (const version of versionGroupData.versions) {
      // La URL /version/:id contiene el ID externo del juego.
      const versionExternalId = getExternalIdFromUrl(version.url);

      // Se obtiene la informacion completa del juego desde PokeAPI.
      const versionData =
        await this.pokeApiClient.getVersion(versionExternalId);

      // Se crea o actualiza el juego y su relacion con VersionGroup.
      await this.prisma.game.upsert({
        where: {
          externalId: versionData.id,
        },
        update: {
          name: versionData.name,
          versionGroupId: versionGroup.id,
        },
        create: {
          externalId: versionData.id,
          name: versionData.name,
          versionGroupId: versionGroup.id,
        },
      });
    }

    // Solo se guarda el VersionGroup en el contexto cuando termino correctamente el sincronizar sus juegos.
    syncContext?.versionGroups.set(versionGroupExternalId, versionGroup);

    return versionGroup;
  }
}
