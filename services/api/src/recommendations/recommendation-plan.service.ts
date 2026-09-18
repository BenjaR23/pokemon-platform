import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ExtraGameRecommendationService } from './extra-game-recommendation.service';
import { RecommendationCoverageService } from './recommendation-coverage.service';

interface ObjectiveSpecies {
  id: string;
  externalId: number;
  name: string;
}

@Injectable()
export class RecommendationPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverageService: RecommendationCoverageService,
    private readonly extraGameRecommendationService: ExtraGameRecommendationService,
  ) {}

  async getProfilePlan(userId: string, profileId: string) {
    const profile = await this.prisma.collectionProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      select: {
        id: true,
        objectiveMode: true,
        startPokemonNumber: true,
        endPokemonNumber: true,
        generations: {
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

    if (!profile) {
      throw new NotFoundException('Collection profile not found');
    }

    const configuredGames = await this.prisma.collectionProfileGame.findMany({
      where: {
        profileId,
      },
      include: {
        game: {
          select: {
            externalId: true,
            name: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    const orderedGames = [
      ...configuredGames
        .filter((game) => game.role === 'PRIMARY')
        .sort((a, b) => a.position - b.position),

      ...configuredGames
        .filter((game) => game.role === 'AUXILIARY')
        .sort((a, b) => a.position - b.position),
    ];

    const objectiveSpecies = await this.getObjectiveSpecies(profile);

    const unassignedSpecies = new Map<number, ObjectiveSpecies>(
      objectiveSpecies.map((species) => [species.externalId, species]),
    );

    const assignments: Array<{
      pokemon: {
        externalId: number;
        name: string;
      };
      game: {
        externalId: number;
        name: string;
        role: 'PRIMARY' | 'AUXILIARY';
        position: number;
      };
      source: 'DIRECT' | 'EVOLUTION';
    }> = [];

    for (const profileGame of orderedGames) {
      const coverage = await this.coverageService.getGameCoverage(
        profileGame.game.externalId,
      );

      const coverageBySpecies = new Map(
        coverage.species.map((species) => [species.externalId, species]),
      );

      for (const [pokemonExternalId, pokemon] of unassignedSpecies) {
        const covered = coverageBySpecies.get(pokemonExternalId);

        if (!covered) {
          continue;
        }

        assignments.push({
          pokemon: {
            externalId: pokemon.externalId,
            name: pokemon.name,
          },
          game: {
            externalId: profileGame.game.externalId,
            name: profileGame.game.name,
            role: profileGame.role,
            position: profileGame.position,
          },
          source: covered.source,
        });

        unassignedSpecies.delete(pokemonExternalId);
      }
    }

    assignments.sort((a, b) => a.pokemon.externalId - b.pokemon.externalId);

    const uncovered = Array.from(unassignedSpecies.values())
      .sort((a, b) => a.externalId - b.externalId)
      .map((species) => ({
        externalId: species.externalId,
        name: species.name,
      }));

    const configuredGameIds = orderedGames.map(
      (profileGame) => profileGame.game.externalId,
    );

    const extraRecommendations =
      await this.extraGameRecommendationService.recommendExtraGames(
        uncovered,
        configuredGameIds,
      );

    return {
      objective: {
        total: objectiveSpecies.length,
      },

      configuredGames: orderedGames.map((profileGame) => ({
        externalId: profileGame.game.externalId,
        name: profileGame.game.name,
        role: profileGame.role,
        position: profileGame.position,
      })),

      assignments,
      uncovered,

      suggestedGames: extraRecommendations.suggestedGames,

      stillUncovered: extraRecommendations.stillUncovered,
    };
  }

  private async getObjectiveSpecies(profile: {
    objectiveMode: 'ALL' | 'GENERATIONS' | 'RANGE';
    startPokemonNumber: number | null;
    endPokemonNumber: number | null;
    generations: Array<{
      generation: {
        externalId: number;
      };
    }>;
  }) {
    if (profile.objectiveMode === 'GENERATIONS') {
      const generationIds = profile.generations.map(
        (entry) => entry.generation.externalId,
      );

      return this.prisma.pokemonSpecies.findMany({
        where: {
          generation: {
            externalId: {
              in: generationIds,
            },
          },
        },
        select: {
          id: true,
          externalId: true,
          name: true,
        },
        orderBy: {
          externalId: 'asc',
        },
      });
    }

    if (
      profile.objectiveMode === 'RANGE' &&
      profile.startPokemonNumber !== null &&
      profile.endPokemonNumber !== null
    ) {
      return this.prisma.pokemonSpecies.findMany({
        where: {
          externalId: {
            gte: profile.startPokemonNumber,
            lte: profile.endPokemonNumber,
          },
        },
        select: {
          id: true,
          externalId: true,
          name: true,
        },
        orderBy: {
          externalId: 'asc',
        },
      });
    }

    return this.prisma.pokemonSpecies.findMany({
      select: {
        id: true,
        externalId: true,
        name: true,
      },
      orderBy: {
        externalId: 'asc',
      },
    });
  }
}
