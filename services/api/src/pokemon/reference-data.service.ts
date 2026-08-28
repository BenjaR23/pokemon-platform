import { Injectable } from '@nestjs/common';
import { PokeApiClient } from './pokeapi/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

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
   * └── VersionGroup
   *     └── Game
   */
  async syncGeneration(generationExternalId: number) {
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

      await this.syncVersionGroup(versionGroupExternalId, generation.id);
    }

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
  ) {
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
       * Sincronizamos la generación correspondiente.
       * Como syncGeneration() llamará nuevamente a syncVersionGroup(),
       * en esa llamada sí recibirá generation.id y no volverá
       * a entrar en este bloque.
       */
      const generation = await this.syncGeneration(generationExternalId);

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

    return versionGroup;
  }
}
