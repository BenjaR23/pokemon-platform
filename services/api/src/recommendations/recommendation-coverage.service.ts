import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const VALID_DIRECT_ACQUISITION_TYPES = ['encounter'] as const;

type CoverageSource = 'DIRECT' | 'EVOLUTION';

interface CoveredSpecies {
  id: string;
  externalId: number;
  name: string;
  source: CoverageSource;
}

interface EvolutionTarget {
  id: string;
  externalId: number;
  name: string;
}

export interface GameCoverageResult {
  game: {
    externalId: number;
    name: string;
  };
  species: Array<{
    externalId: number;
    name: string;
    source: CoverageSource;
  }>;
}

@Injectable()
export class RecommendationCoverageService {
  // La cobertura solo depende de datos de referencia estáticos
  // (juegos, adquisiciones y evoluciones), no del usuario que hace
  // la request. Por eso es seguro reutilizarla entre requests.
  //
  // La caché se invalida automáticamente por TTL o manualmente
  // llamando a clearCache() después de un import/seed.
  private readonly coverageCache = new Map<
    number,
    {
      result: GameCoverageResult;
      expiresAt: number;
    }
  >();

  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

  constructor(private readonly prisma: PrismaService) {}

  clearCache(): void {
    this.coverageCache.clear();
  }

  /**
   * Compatibilidad con el uso existente de un solo juego.
   */
  async getGameCoverage(gameExternalId: number): Promise<GameCoverageResult> {
    const results = await this.getGamesCoverage([gameExternalId]);
    const result = results[0];

    if (!result) {
      throw new NotFoundException(`Game not found: ${gameExternalId}`);
    }

    return result;
  }

  /**
   * Calcula la cobertura de varios juegos en una sola pasada.
   *
   * Cada tabla se consulta una sola vez para todos los juegos solicitados
   * y el cálculo de cobertura se realiza en memoria.
   */
  async getGamesCoverage(
    gameExternalIds: number[],
  ): Promise<GameCoverageResult[]> {
    const uniqueIds = Array.from(new Set(gameExternalIds));
    const now = Date.now();

    const resultsById = new Map<number, GameCoverageResult>();
    const missing: number[] = [];

    // Primero recuperamos los resultados todavía válidos desde caché.
    for (const id of uniqueIds) {
      const entry = this.coverageCache.get(id);

      if (entry && entry.expiresAt > now) {
        resultsById.set(id, entry.result);
      } else {
        missing.push(id);
      }
    }

    // Solo consultamos la base de datos si existen juegos que no están
    // disponibles en caché.
    if (missing.length > 0) {
      const games = await this.prisma.game.findMany({
        where: {
          externalId: {
            in: missing,
          },
        },
        select: {
          id: true,
          externalId: true,
          name: true,
          versionGroupId: true,
          versionGroup: {
            select: {
              generation: {
                select: {
                  externalId: true,
                },
              },
            },
          },
        },
      });

      const foundIds = new Set(games.map((game) => game.externalId));

      const notFound = missing.filter((id) => !foundIds.has(id));

      if (notFound.length > 0) {
        throw new NotFoundException(
          `Game(s) not found: ${notFound.join(', ')}`,
        );
      }

      const gameIds = games.map((game) => game.id);

      // Ambas consultas son independientes, por lo que pueden ejecutarse
      // en paralelo.
      const [directAcquisitions, evolutions] = await Promise.all([
        this.prisma.pokemonAcquisition.findMany({
          where: {
            gameId: {
              in: gameIds,
            },
            acquisitionType: {
              code: {
                in: [...VALID_DIRECT_ACQUISITION_TYPES],
              },
            },
          },
          select: {
            gameId: true,
            variety: {
              select: {
                species: {
                  select: {
                    id: true,
                    externalId: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.evolution.findMany({
          select: {
            fromSpeciesId: true,
            toSpecies: {
              select: {
                id: true,
                externalId: true,
                name: true,
                generation: {
                  select: {
                    externalId: true,
                  },
                },
              },
            },
            rules: {
              select: {
                versionGroupId: true,
              },
            },
          },
        }),
      ]);

      // Agrupamos las adquisiciones por juego para no tener que
      // recorrer todas las adquisiciones para cada juego.
      const acquisitionsByGameId = new Map<string, typeof directAcquisitions>();

      for (const acquisition of directAcquisitions) {
        const acquisitions = acquisitionsByGameId.get(acquisition.gameId) ?? [];

        acquisitions.push(acquisition);
        acquisitionsByGameId.set(acquisition.gameId, acquisitions);
      }

      for (const game of games) {
        const gameAcquisitions = acquisitionsByGameId.get(game.id) ?? [];

        const coveredSpecies = new Map<string, CoveredSpecies>();

        // 1. Especies obtenibles directamente en el juego.
        for (const acquisition of gameAcquisitions) {
          const species = acquisition.variety.species;

          coveredSpecies.set(species.id, {
            id: species.id,
            externalId: species.externalId,
            name: species.name,
            source: 'DIRECT',
          });
        }

        const generationExternalId = game.versionGroup.generation.externalId;

        // 2. Construimos el grafo de evoluciones válidas para
        //    este juego/version group.
        const evolutionGraph = new Map<string, EvolutionTarget[]>();

        for (const evolution of evolutions) {
          if (
            !evolution.toSpecies.generation ||
            evolution.toSpecies.generation.externalId > generationExternalId
          ) {
            continue;
          }

          if (
            !this.isEvolutionAvailableInVersionGroup(
              evolution.rules,
              game.versionGroupId,
            )
          ) {
            continue;
          }

          const targets = evolutionGraph.get(evolution.fromSpeciesId) ?? [];

          targets.push({
            id: evolution.toSpecies.id,
            externalId: evolution.toSpecies.externalId,
            name: evolution.toSpecies.name,
          });

          evolutionGraph.set(evolution.fromSpeciesId, targets);
        }

        // 3. Expandimos la cobertura siguiendo las cadenas evolutivas.
        this.expandEvolutionCoverage(coveredSpecies, evolutionGraph);

        const species = Array.from(coveredSpecies.values())
          .sort((a, b) => a.externalId - b.externalId)
          .map((species) => ({
            externalId: species.externalId,
            name: species.name,
            source: species.source,
          }));

        const result: GameCoverageResult = {
          game: {
            externalId: game.externalId,
            name: game.name,
          },
          species,
        };

        // Guardamos el resultado calculado en caché.
        this.coverageCache.set(game.externalId, {
          result,
          expiresAt: now + this.CACHE_TTL_MS,
        });

        resultsById.set(game.externalId, result);
      }
    }

    // Mantenemos el mismo orden que recibió el caller y no el orden
    // en que Prisma devolvió los juegos.
    return uniqueIds.map((id) => {
      const result = resultsById.get(id);

      if (!result) {
        throw new NotFoundException(`Game not found: ${id}`);
      }

      return result;
    });
  }

  private expandEvolutionCoverage(
    coveredSpecies: Map<string, CoveredSpecies>,
    evolutionGraph: Map<string, EvolutionTarget[]>,
  ): void {
    const processedSpeciesIds = new Set<string>();
    const pendingSpeciesIds = Array.from(coveredSpecies.keys());

    while (pendingSpeciesIds.length > 0) {
      const speciesId = pendingSpeciesIds.shift();

      if (!speciesId || processedSpeciesIds.has(speciesId)) {
        continue;
      }

      processedSpeciesIds.add(speciesId);

      const targets = evolutionGraph.get(speciesId) ?? [];

      for (const targetSpecies of targets) {
        if (coveredSpecies.has(targetSpecies.id)) {
          continue;
        }

        coveredSpecies.set(targetSpecies.id, {
          id: targetSpecies.id,
          externalId: targetSpecies.externalId,
          name: targetSpecies.name,
          source: 'EVOLUTION',
        });

        pendingSpeciesIds.push(targetSpecies.id);
      }
    }
  }

  private isEvolutionAvailableInVersionGroup(
    rules: Array<{
      versionGroupId: string | null;
    }>,
    versionGroupId: string,
  ): boolean {
    // Sin reglas específicas significa que la evolución
    // está disponible de forma general.
    if (rules.length === 0) {
      return true;
    }

    return rules.some(
      (rule) =>
        rule.versionGroupId === null || rule.versionGroupId === versionGroupId,
    );
  }
}
