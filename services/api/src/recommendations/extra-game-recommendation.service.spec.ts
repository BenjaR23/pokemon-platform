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
    getGamesCoverage: jest.fn(),
  };

  type Species = {
    externalId: number;
    name: string;
    source: 'DIRECT' | 'EVOLUTION';
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

  function mockCoverageByGame(
    coverageById: Record<
      number,
      {
        name: string;
        species: Species[];
      }
    >,
  ) {
    coverageService.getGamesCoverage.mockImplementation((ids: number[]) =>
      Promise.resolve(
        ids.map((id) => {
          const coverage = coverageById[id];

          if (!coverage) {
            throw new Error(`Missing mock coverage for game ${id}`);
          }

          return {
            game: {
              externalId: id,
              name: coverage.name,
            },
            species: coverage.species,
          };
        }),
      ),
    );
  }

  it('returns no suggestions when there are no uncovered species', async () => {
    const result = await service.recommendExtraGames([], [10, 11]);

    expect(result).toEqual({
      suggestedGames: [],
      stillUncovered: [],
    });

    expect(prisma.game.findMany).not.toHaveBeenCalled();
    expect(coverageService.getGamesCoverage).not.toHaveBeenCalled();
  });

  it('returns all uncovered species when there are no candidate games', async () => {
    prisma.game.findMany.mockResolvedValue([]);

    const result = await service.recommendExtraGames(
      [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
      ],
      [],
    );

    expect(result).toEqual({
      suggestedGames: [],
      stillUncovered: [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
      ],
    });

    expect(prisma.game.findMany).toHaveBeenCalledWith({
      where: {
        externalId: {
          notIn: [],
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

    expect(coverageService.getGamesCoverage).not.toHaveBeenCalled();
  });

  it('does not consider already configured games', async () => {
    prisma.game.findMany.mockResolvedValue([]);

    await service.recommendExtraGames(
      [{ externalId: 151, name: 'mew' }],
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

    expect(coverageService.getGamesCoverage).not.toHaveBeenCalled();
  });

  it('prefers one game that covers all missing species', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 20, name: 'game-x' },
      { externalId: 21, name: 'game-y' },
      { externalId: 22, name: 'game-z' },
    ]);

    mockCoverageByGame({
      20: {
        name: 'game-x',
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
        ],
      },
      21: {
        name: 'game-y',
        species: [
          {
            externalId: 2,
            name: 'b',
            source: 'DIRECT',
          },
        ],
      },
      22: {
        name: 'game-z',
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
      },
    });

    const result = await service.recommendExtraGames(
      [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 22,
        name: 'game-z',
        coveredSpecies: [
          { externalId: 1, name: 'a' },
          { externalId: 2, name: 'b' },
        ],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);

    expect(coverageService.getGamesCoverage).toHaveBeenCalledTimes(1);
    expect(coverageService.getGamesCoverage).toHaveBeenCalledWith([20, 21, 22]);
  });

  it('combines games when multiple games are required', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 20, name: 'game-x' },
      { externalId: 21, name: 'game-y' },
      { externalId: 22, name: 'game-z' },
    ]);

    mockCoverageByGame({
      20: {
        name: 'game-x',
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
      },
      21: {
        name: 'game-y',
        species: [
          {
            externalId: 3,
            name: 'c',
            source: 'DIRECT',
          },
        ],
      },
      22: {
        name: 'game-z',
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
        ],
      },
    });

    const result = await service.recommendExtraGames(
      [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
        { externalId: 3, name: 'c' },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-x',
        coveredSpecies: [
          { externalId: 1, name: 'a' },
          { externalId: 2, name: 'b' },
        ],
      },
      {
        externalId: 21,
        name: 'game-y',
        coveredSpecies: [{ externalId: 3, name: 'c' }],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);

    expect(coverageService.getGamesCoverage).toHaveBeenCalledTimes(1);
    expect(coverageService.getGamesCoverage).toHaveBeenCalledWith([20, 21, 22]);
  });

  it('returns species that cannot be covered by any candidate game', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 20, name: 'game-x' },
    ]);

    mockCoverageByGame({
      20: {
        name: 'game-x',
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
        ],
      },
    });

    const result = await service.recommendExtraGames(
      [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-x',
        coveredSpecies: [{ externalId: 1, name: 'a' }],
      },
    ]);

    expect(result.stillUncovered).toEqual([{ externalId: 2, name: 'b' }]);
  });

  it('ignores candidate games that cover none of the missing species', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 20, name: 'game-x' },
      { externalId: 21, name: 'game-y' },
    ]);

    mockCoverageByGame({
      20: {
        name: 'game-x',
        species: [
          {
            externalId: 999,
            name: 'other',
            source: 'DIRECT',
          },
        ],
      },
      21: {
        name: 'game-y',
        species: [
          {
            externalId: 1,
            name: 'a',
            source: 'DIRECT',
          },
        ],
      },
    });

    const result = await service.recommendExtraGames(
      [{ externalId: 1, name: 'a' }],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 21,
        name: 'game-y',
        coveredSpecies: [{ externalId: 1, name: 'a' }],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);
  });

  it('prefers a dominating candidate over a strictly smaller subset', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 20, name: 'game-a' },
      { externalId: 21, name: 'game-b' },
    ]);

    mockCoverageByGame({
      20: {
        name: 'game-a',
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
      },
      21: {
        name: 'game-b',
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
      },
    });

    const result = await service.recommendExtraGames(
      [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
        { externalId: 3, name: 'c' },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-a',
        coveredSpecies: [
          { externalId: 1, name: 'a' },
          { externalId: 2, name: 'b' },
          { externalId: 3, name: 'c' },
        ],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);
  });

  it('uses the lower external id when two games cover the same species', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 30, name: 'game-b' },
      { externalId: 20, name: 'game-a' },
    ]);

    mockCoverageByGame({
      30: {
        name: 'game-b',
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
      },
      20: {
        name: 'game-a',
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
      },
    });

    const result = await service.recommendExtraGames(
      [
        { externalId: 1, name: 'a' },
        { externalId: 2, name: 'b' },
      ],
      [],
    );

    expect(result.suggestedGames).toEqual([
      {
        externalId: 20,
        name: 'game-a',
        coveredSpecies: [
          { externalId: 1, name: 'a' },
          { externalId: 2, name: 'b' },
        ],
      },
    ]);

    expect(result.stillUncovered).toEqual([]);
  });

  it('finds a smaller exact combination even when greedy starts with more games', async () => {
    prisma.game.findMany.mockResolvedValue([
      { externalId: 20, name: 'game-a' },
      { externalId: 21, name: 'game-b' },
      { externalId: 22, name: 'game-c' },
      { externalId: 23, name: 'game-d' },
    ]);

    const coverageByGame: Record<number, number[]> = {
      20: [1, 2, 3, 4],
      21: [1, 2, 5],
      22: [3, 4, 6],
      23: [5, 6],
    };

    coverageService.getGamesCoverage.mockImplementation((ids: number[]) =>
      Promise.resolve(
        ids.map((id) => ({
          game: {
            externalId: id,
            name: `game-${id}`,
          },
          species: coverageByGame[id].map((externalId) => ({
            externalId,
            name: `species-${externalId}`,
            source: 'DIRECT' as const,
          })),
        })),
      ),
    );

    const result = await service.recommendExtraGames(
      [1, 2, 3, 4, 5, 6].map((externalId) => ({
        externalId,
        name: `species-${externalId}`,
      })),
      [],
    );

    expect(result.suggestedGames).toHaveLength(2);
    expect(result.stillUncovered).toEqual([]);

    expect(coverageService.getGamesCoverage).toHaveBeenCalledTimes(1);
    expect(coverageService.getGamesCoverage).toHaveBeenCalledWith([
      20, 21, 22, 23,
    ]);
  });

  it('handles many candidate games without exponential combination enumeration', async () => {
    const games = Array.from({ length: 40 }, (_, index) => ({
      externalId: index + 1,
      name: `game-${index + 1}`,
    }));

    prisma.game.findMany.mockResolvedValue(games);

    coverageService.getGamesCoverage.mockImplementation((ids: number[]) =>
      Promise.resolve(
        ids.map((id) => {
          const speciesId = ((id - 1) % 5) + 1;

          return {
            game: {
              externalId: id,
              name: `game-${id}`,
            },
            species: [
              {
                externalId: speciesId,
                name: `species-${speciesId}`,
                source: 'DIRECT' as const,
              },
            ],
          };
        }),
      ),
    );

    const result = await service.recommendExtraGames(
      [1, 2, 3, 4, 5].map((externalId) => ({
        externalId,
        name: `species-${externalId}`,
      })),
      [],
    );

    expect(result.suggestedGames).toHaveLength(5);
    expect(result.stillUncovered).toEqual([]);

    expect(coverageService.getGamesCoverage).toHaveBeenCalledTimes(1);
    expect(coverageService.getGamesCoverage).toHaveBeenCalledWith(
      games.map((game) => game.externalId),
    );
  });
});
