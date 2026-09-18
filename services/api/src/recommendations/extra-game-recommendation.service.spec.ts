import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ExtraGameRecommendationService } from './extra-game-recommendation.service';
import { RecommendationCoverageService } from './recommendation-coverage.service';

describe('ExtraGameRecommendationService', () => {
  let service: ExtraGameRecommendationService;

  const prisma = {
    game: {
      findMany: jest.fn(),
    },
  };

  const coverageService = {
    getGameCoverage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExtraGameRecommendationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: RecommendationCoverageService,
          useValue: coverageService,
        },
      ],
    }).compile();

    service = moduleRef.get(ExtraGameRecommendationService);
  });

  it('returns no suggestions when there are no uncovered species', async () => {
    const result = await service.recommendExtraGames([], [10, 11]);

    expect(result).toEqual({
      suggestedGames: [],
      stillUncovered: [],
    });

    expect(prisma.game.findMany).not.toHaveBeenCalled();

    expect(coverageService.getGameCoverage).not.toHaveBeenCalled();
  });

  it('does not consider already configured games', async () => {
    prisma.game.findMany.mockResolvedValue([]);

    await service.recommendExtraGames(
      [
        {
          externalId: 151,
          name: 'mew',
        },
      ],
      [10, 11],
    );

    expect(prisma.game.findMany).toHaveBeenCalledWith({
      where: {
        externalId: {
          notIn: [10, 11],
        },
      },
      select: {
        externalId: true,
        name: true,
      },
      orderBy: {
        externalId: 'asc',
      },
    });
  });

  it('prefers one game that covers all missing species', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 20,
        name: 'game-x',
      },
      {
        externalId: 21,
        name: 'game-y',
      },
      {
        externalId: 22,
        name: 'game-z',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation((gameId: number) => {
      if (gameId === 20) {
        return Promise.resolve({
          game: {
            externalId: 20,
            name: 'game-x',
          },
          species: [
            {
              externalId: 1,
              name: 'a',
              source: 'DIRECT',
            },
          ],
        });
      }

      if (gameId === 21) {
        return Promise.resolve({
          game: {
            externalId: 21,
            name: 'game-y',
          },
          species: [
            {
              externalId: 2,
              name: 'b',
              source: 'DIRECT',
            },
          ],
        });
      }

      return Promise.resolve({
        game: {
          externalId: 22,
          name: 'game-z',
        },
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
          {
            externalId: 2,
            name: 'b',
            source: 'DIRECT',
          },
        ],
      });
    });

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'a',
        },
        {
          externalId: 2,
          name: 'b',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 22,
        name: 'game-z',
        coveredSpecies: [
          {
            externalId: 1,
            name: 'a',
          },
          {
            externalId: 2,
            name: 'b',
          },
        ],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);
  });

  it('combines games when multiple games are required', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 20,
        name: 'game-x',
      },
      {
        externalId: 21,
        name: 'game-y',
      },
      {
        externalId: 22,
        name: 'game-z',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation((gameId: number) => {
      if (gameId === 20) {
        return Promise.resolve({
          game: {
            externalId: 20,
            name: 'game-x',
          },
          species: [
            {
              externalId: 1,
              name: 'a',
              source: 'DIRECT',
            },
            {
              externalId: 2,
              name: 'b',
              source: 'DIRECT',
            },
          ],
        });
      }

      if (gameId === 21) {
        return Promise.resolve({
          game: {
            externalId: 21,
            name: 'game-y',
          },
          species: [
            {
              externalId: 3,
              name: 'c',
              source: 'DIRECT',
            },
          ],
        });
      }

      return Promise.resolve({
        game: {
          externalId: 22,
          name: 'game-z',
        },
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
        ],
      });
    });

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'a',
        },
        {
          externalId: 2,
          name: 'b',
        },
        {
          externalId: 3,
          name: 'c',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-x',
        coveredSpecies: [
          {
            externalId: 1,
            name: 'a',
          },
          {
            externalId: 2,
            name: 'b',
          },
        ],
      },
      {
        externalId: 21,
        name: 'game-y',
        coveredSpecies: [
          {
            externalId: 3,
            name: 'c',
          },
        ],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);
  });

  it('returns species that cannot be covered by any candidate game', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 20,
        name: 'game-x',
      },
    ]);

    coverageService.getGameCoverage.mockResolvedValue({
      game: {
        externalId: 20,
        name: 'game-x',
      },
      species: [
        {
          externalId: 1,
          name: 'a',
          source: 'DIRECT',
        },
      ],
    });

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'a',
        },
        {
          externalId: 2,
          name: 'b',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-x',
        coveredSpecies: [
          {
            externalId: 1,
            name: 'a',
          },
        ],
      },
    ]);

    expect(result.stillUncovered).toEqual([
      {
        externalId: 2,
        name: 'b',
      },
    ]);
  });

  it('ignores candidate games that cover none of the missing species', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 20,
        name: 'game-x',
      },
      {
        externalId: 21,
        name: 'game-y',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation((gameId: number) => {
      if (gameId === 20) {
        return Promise.resolve({
          game: {
            externalId: 20,
            name: 'game-x',
          },
          species: [
            {
              externalId: 999,
              name: 'other',
              source: 'DIRECT',
            },
          ],
        });
      }

      return Promise.resolve({
        game: {
          externalId: 21,
          name: 'game-y',
        },
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
        ],
      });
    });

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'a',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 21,
        name: 'game-y',
        coveredSpecies: [
          {
            externalId: 1,
            name: 'a',
          },
        ],
      },
    ]);
  });

  it('prefers a dominating candidate over a strictly smaller subset', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 20,
        name: 'game-a',
      },
      {
        externalId: 21,
        name: 'game-b',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation((gameId: number) => {
      if (gameId === 20) {
        return Promise.resolve({
          game: {
            externalId: 20,
            name: 'game-a',
          },
          species: [
            {
              externalId: 1,
              name: 'a',
              source: 'DIRECT',
            },
            {
              externalId: 2,
              name: 'b',
              source: 'DIRECT',
            },
            {
              externalId: 3,
              name: 'c',
              source: 'DIRECT',
            },
          ],
        });
      }

      return Promise.resolve({
        game: {
          externalId: 21,
          name: 'game-b',
        },
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
          {
            externalId: 2,
            name: 'b',
            source: 'DIRECT',
          },
        ],
      });
    });

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'a',
        },
        {
          externalId: 2,
          name: 'b',
        },
        {
          externalId: 3,
          name: 'c',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-a',
        coveredSpecies: [
          {
            externalId: 1,
            name: 'a',
          },
          {
            externalId: 2,
            name: 'b',
          },
          {
            externalId: 3,
            name: 'c',
          },
        ],
      },
    ]);
  });

  it('uses the lower external id when two games cover the same species', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 30,
        name: 'game-b',
      },
      {
        externalId: 20,
        name: 'game-a',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation((gameId: number) =>
      Promise.resolve({
        game: {
          externalId: gameId,
          name: gameId === 20 ? 'game-a' : 'game-b',
        },
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
          {
            externalId: 2,
            name: 'b',
            source: 'DIRECT',
          },
        ],
      }),
    );

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'a',
        },
        {
          externalId: 2,
          name: 'b',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-a',
        coveredSpecies: [
          {
            externalId: 1,
            name: 'a',
          },
          {
            externalId: 2,
            name: 'b',
          },
        ],
      },
    ]);
  });

  it('finds a smaller exact combination even when greedy starts with more games', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 20,
        name: 'game-a',
      },
      {
        externalId: 21,
        name: 'game-b',
      },
      {
        externalId: 22,
        name: 'game-c',
      },
      {
        externalId: 23,
        name: 'game-d',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation((gameId: number) => {
      const coverageByGame: Record<number, number[]> = {
        20: [1, 2, 3, 4],
        21: [1, 2, 5],
        22: [3, 4, 6],
        23: [5, 6],
      };

      return Promise.resolve({
        game: {
          externalId: gameId,
          name: `game-${gameId}`,
        },
        species: coverageByGame[gameId].map((externalId) => ({
          externalId,
          name: `species-${externalId}`,
          source: 'DIRECT' as const,
        })),
      });
    });

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'species-1',
        },
        {
          externalId: 2,
          name: 'species-2',
        },
        {
          externalId: 3,
          name: 'species-3',
        },
        {
          externalId: 4,
          name: 'species-4',
        },
        {
          externalId: 5,
          name: 'species-5',
        },
        {
          externalId: 6,
          name: 'species-6',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toHaveLength(2);

    expect(result.stillUncovered).toEqual([]);
  });

  it('handles many candidates without enumerating bitmask combinations', async () => {
    const games = Array.from(
      {
        length: 40,
      },
      (_, index) => ({
        externalId: index + 1,
        name: `game-${index + 1}`,
      }),
    );

    prisma.game.findMany.mockResolvedValue(games);

    coverageService.getGameCoverage.mockImplementation((gameId: number) =>
      Promise.resolve({
        game: {
          externalId: gameId,
          name: `game-${gameId}`,
        },
        species: [
          {
            externalId: ((gameId - 1) % 5) + 1,
            name: `species-${((gameId - 1) % 5) + 1}`,
            source: 'DIRECT',
          },
        ],
      }),
    );

    const result = await service.recommendExtraGames(
      [
        {
          externalId: 1,
          name: 'species-1',
        },
        {
          externalId: 2,
          name: 'species-2',
        },
        {
          externalId: 3,
          name: 'species-3',
        },
        {
          externalId: 4,
          name: 'species-4',
        },
        {
          externalId: 5,
          name: 'species-5',
        },
      ],
      [],
    );

    expect(result.suggestedGames).toHaveLength(5);

    expect(result.stillUncovered).toEqual([]);
  });
});
