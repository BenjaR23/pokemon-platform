import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RecommendationCoverageService } from './recommendation-coverage.service';
import { RecommendationPlanService } from './recommendation-plan.service';

describe('RecommendationPlanService', () => {
  let service: RecommendationPlanService;

  const prisma = {
    collectionProfile: {
      findFirst: jest.fn(),
    },

    collectionProfileGame: {
      findMany: jest.fn(),
    },

    pokemonSpecies: {
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
        RecommendationPlanService,
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

    service = moduleRef.get(RecommendationPlanService);
  });

  function mockProfile(
    overrides?: Partial<{
      objectiveMode: 'ALL' | 'GENERATIONS' | 'RANGE';
      startPokemonNumber: number | null;
      endPokemonNumber: number | null;
      generations: Array<{
        generation: {
          externalId: number;
        };
      }>;
    }>,
  ) {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-1',
      objectiveMode: 'ALL',
      startPokemonNumber: null,
      endPokemonNumber: null,
      generations: [],
      ...overrides,
    });
  }

  function mockConfiguredGames() {
    prisma.collectionProfileGame.findMany.mockResolvedValue([
      {
        role: 'AUXILIARY',
        position: 0,
        game: {
          externalId: 11,
          name: 'leafgreen',
        },
      },
      {
        role: 'PRIMARY',
        position: 1,
        game: {
          externalId: 9,
          name: 'emerald',
        },
      },
      {
        role: 'PRIMARY',
        position: 0,
        game: {
          externalId: 10,
          name: 'firered',
        },
      },
    ]);
  }

  function mockObjectiveSpecies() {
    prisma.pokemonSpecies.findMany.mockResolvedValue([
      {
        id: 'species-25',
        externalId: 25,
        name: 'pikachu',
      },
      {
        id: 'species-37',
        externalId: 37,
        name: 'vulpix',
      },
      {
        id: 'species-151',
        externalId: 151,
        name: 'mew',
      },
    ]);
  }

  it('assigns a species to the first primary game that covers it', async () => {
    mockProfile();
    mockConfiguredGames();
    mockObjectiveSpecies();

    coverageService.getGameCoverage.mockImplementation(
      (gameExternalId: number) => {
        if (gameExternalId === 10) {
          return Promise.resolve({
            game: {
              externalId: 10,
              name: 'firered',
            },
            species: [
              {
                externalId: 25,
                name: 'pikachu',
                source: 'DIRECT',
              },
            ],
          });
        }

        if (gameExternalId === 9) {
          return Promise.resolve({
            game: {
              externalId: 9,
              name: 'emerald',
            },
            species: [
              {
                externalId: 25,
                name: 'pikachu',
                source: 'DIRECT',
              },
            ],
          });
        }

        return Promise.resolve({
          game: {
            externalId: 11,
            name: 'leafgreen',
          },
          species: [],
        });
      },
    );

    const result = await service.getProfilePlan('user-1', 'profile-1');

    expect(result.assignments).toContainEqual({
      pokemon: {
        externalId: 25,
        name: 'pikachu',
      },
      game: {
        externalId: 10,
        name: 'firered',
        role: 'PRIMARY',
        position: 0,
      },
      source: 'DIRECT',
    });

    expect(
      result.assignments.some(
        (assignment) =>
          assignment.pokemon.externalId === 25 &&
          assignment.game.externalId === 9,
      ),
    ).toBe(false);
  });

  it('uses auxiliary games only after all primary games', async () => {
    mockProfile();
    mockConfiguredGames();
    mockObjectiveSpecies();

    coverageService.getGameCoverage.mockImplementation(
      (gameExternalId: number) => {
        if (gameExternalId === 11) {
          return Promise.resolve({
            game: {
              externalId: 11,
              name: 'leafgreen',
            },
            species: [
              {
                externalId: 37,
                name: 'vulpix',
                source: 'DIRECT',
              },
            ],
          });
        }

        return Promise.resolve({
          game: {
            externalId: gameExternalId,
            name: 'other',
          },
          species: [],
        });
      },
    );

    const result = await service.getProfilePlan('user-1', 'profile-1');

    expect(result.assignments).toContainEqual({
      pokemon: {
        externalId: 37,
        name: 'vulpix',
      },
      game: {
        externalId: 11,
        name: 'leafgreen',
        role: 'AUXILIARY',
        position: 0,
      },
      source: 'DIRECT',
    });

    expect(coverageService.getGameCoverage).toHaveBeenNthCalledWith(1, 10);

    expect(coverageService.getGameCoverage).toHaveBeenNthCalledWith(2, 9);

    expect(coverageService.getGameCoverage).toHaveBeenNthCalledWith(3, 11);
  });

  it('keeps species uncovered when no configured game covers them', async () => {
    mockProfile();
    mockConfiguredGames();
    mockObjectiveSpecies();

    coverageService.getGameCoverage.mockResolvedValue({
      game: {
        externalId: 10,
        name: 'game',
      },
      species: [],
    });

    const result = await service.getProfilePlan('user-1', 'profile-1');

    expect(result.assignments).toEqual([]);

    expect(result.uncovered).toEqual([
      {
        externalId: 25,
        name: 'pikachu',
      },
      {
        externalId: 37,
        name: 'vulpix',
      },
      {
        externalId: 151,
        name: 'mew',
      },
    ]);
  });

  it('preserves evolution as assignment source', async () => {
    mockProfile();
    mockConfiguredGames();

    prisma.pokemonSpecies.findMany.mockResolvedValue([
      {
        id: 'species-3',
        externalId: 3,
        name: 'venusaur',
      },
    ]);

    coverageService.getGameCoverage.mockImplementation(
      (gameExternalId: number) => {
        if (gameExternalId === 10) {
          return Promise.resolve({
            game: {
              externalId: 10,
              name: 'firered',
            },
            species: [
              {
                externalId: 3,
                name: 'venusaur',
                source: 'EVOLUTION',
              },
            ],
          });
        }

        return Promise.resolve({
          game: {
            externalId: gameExternalId,
            name: 'other',
          },
          species: [],
        });
      },
    );

    const result = await service.getProfilePlan('user-1', 'profile-1');

    expect(result.assignments).toEqual([
      {
        pokemon: {
          externalId: 3,
          name: 'venusaur',
        },
        game: {
          externalId: 10,
          name: 'firered',
          role: 'PRIMARY',
          position: 0,
        },
        source: 'EVOLUTION',
      },
    ]);
  });

  it('loads all species for an ALL objective', async () => {
    mockProfile({
      objectiveMode: 'ALL',
    });

    prisma.collectionProfileGame.findMany.mockResolvedValue([]);

    prisma.pokemonSpecies.findMany.mockResolvedValue([]);

    await service.getProfilePlan('user-1', 'profile-1');

    expect(prisma.pokemonSpecies.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        externalId: true,
        name: true,
      },
      orderBy: {
        externalId: 'asc',
      },
    });
  });

  it('loads species from selected generations for a GENERATIONS objective', async () => {
    mockProfile({
      objectiveMode: 'GENERATIONS',
      generations: [
        {
          generation: {
            externalId: 1,
          },
        },
        {
          generation: {
            externalId: 2,
          },
        },
      ],
    });

    prisma.collectionProfileGame.findMany.mockResolvedValue([]);

    prisma.pokemonSpecies.findMany.mockResolvedValue([]);

    await service.getProfilePlan('user-1', 'profile-1');

    expect(prisma.pokemonSpecies.findMany).toHaveBeenCalledWith({
      where: {
        generation: {
          externalId: {
            in: [1, 2],
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
  });

  it('loads species inside a RANGE objective', async () => {
    mockProfile({
      objectiveMode: 'RANGE',
      startPokemonNumber: 1,
      endPokemonNumber: 151,
    });

    prisma.collectionProfileGame.findMany.mockResolvedValue([]);

    prisma.pokemonSpecies.findMany.mockResolvedValue([]);

    await service.getProfilePlan('user-1', 'profile-1');

    expect(prisma.pokemonSpecies.findMany).toHaveBeenCalledWith({
      where: {
        externalId: {
          gte: 1,
          lte: 151,
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
  });

  it('returns configured games in primary then auxiliary order', async () => {
    mockProfile();
    mockConfiguredGames();

    prisma.pokemonSpecies.findMany.mockResolvedValue([]);

    coverageService.getGameCoverage.mockResolvedValue({
      game: {
        externalId: 10,
        name: 'game',
      },
      species: [],
    });

    const result = await service.getProfilePlan('user-1', 'profile-1');

    expect(result.configuredGames).toEqual([
      {
        externalId: 10,
        name: 'firered',
        role: 'PRIMARY',
        position: 0,
      },
      {
        externalId: 9,
        name: 'emerald',
        role: 'PRIMARY',
        position: 1,
      },
      {
        externalId: 11,
        name: 'leafgreen',
        role: 'AUXILIARY',
        position: 0,
      },
    ]);
  });

  it('throws when profile is not accessible by the user', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.getProfilePlan('user-1', 'profile-2'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.collectionProfileGame.findMany).not.toHaveBeenCalled();

    expect(prisma.pokemonSpecies.findMany).not.toHaveBeenCalled();

    expect(coverageService.getGameCoverage).not.toHaveBeenCalled();
  });
});
