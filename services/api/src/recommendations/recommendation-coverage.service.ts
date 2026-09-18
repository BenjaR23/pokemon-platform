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

@Injectable()
export class RecommendationCoverageService {
  constructor(private readonly prisma: PrismaService) {}

  async getGameCoverage(gameExternalId: number) {
    const game = await this.prisma.game.findUnique({
      where: {
        externalId: gameExternalId,
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

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const directAcquisitions = await this.prisma.pokemonAcquisition.findMany({
      where: {
        gameId: game.id,
        acquisitionType: {
          code: {
            in: [...VALID_DIRECT_ACQUISITION_TYPES],
          },
        },
      },
      select: {
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
    });

    const coveredSpecies = new Map<string, CoveredSpecies>();

    for (const acquisition of directAcquisitions) {
      const species = acquisition.variety.species;

      coveredSpecies.set(species.id, {
        id: species.id,
        externalId: species.externalId,
        name: species.name,
        source: 'DIRECT',
      });
    }

    await this.expandEvolutionCoverage(
      coveredSpecies,
      game.versionGroupId,
      game.versionGroup.generation.externalId,
    );

    const species = Array.from(coveredSpecies.values())
      .sort((a, b) => a.externalId - b.externalId)
      .map((coveredSpecies) => ({
        externalId: coveredSpecies.externalId,
        name: coveredSpecies.name,
        source: coveredSpecies.source,
      }));

    return {
      game: {
        externalId: game.externalId,
        name: game.name,
      },
      species,
    };
  }

  private async expandEvolutionCoverage(
    coveredSpecies: Map<string, CoveredSpecies>,
    versionGroupId: string,
    gameGeneration: number,
  ) {
    const processedSpeciesIds = new Set<string>();

    const pendingSpeciesIds = Array.from(coveredSpecies.keys());

    while (pendingSpeciesIds.length > 0) {
      const speciesId = pendingSpeciesIds.shift();

      if (!speciesId || processedSpeciesIds.has(speciesId)) {
        continue;
      }

      processedSpeciesIds.add(speciesId);

      const evolutions = await this.prisma.evolution.findMany({
        where: {
          fromSpeciesId: speciesId,
        },
        select: {
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
      });

      for (const evolution of evolutions) {
        const targetSpecies = evolution.toSpecies;

        const targetGeneration = targetSpecies.generation?.externalId;

        if (
          targetGeneration !== undefined &&
          targetGeneration > gameGeneration
        ) {
          continue;
        }

        if (
          !this.isEvolutionAvailableInVersionGroup(
            evolution.rules,
            versionGroupId,
          )
        ) {
          continue;
        }

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
  ) {
    if (rules.length === 0) {
      return true;
    }

    return rules.some(
      (rule) =>
        rule.versionGroupId === null || rule.versionGroupId === versionGroupId,
    );
  }
}
