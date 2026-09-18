import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RecommendationCoverageService } from './recommendation-coverage.service';

describe('RecommendationCoverageService', () => {
  let service: RecommendationCoverageService;

  const prisma = {
    game: {
      findUnique: jest.fn(),
    },

    pokemonAcquisition: {
      findMany: jest.fn(),
    },

    evolution: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationCoverageService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(RecommendationCoverageService);
  });

  function mockGame(generation = 3, versionGroupId = 'vg-1') {
    prisma.game.findUnique.mockResolvedValue({
      id: 'game-1',
      externalId: 10,
      name: 'firered',
      versionGroupId,
      versionGroup: {
        generation: {
          externalId: generation,
        },
      },
    });
  }

  function evolution(
    fromSpeciesId: string,
    toSpeciesId: string,
    externalId: number,
    name: string,
    versionGroupId: string | null = null,
  ) {
    return {
      fromSpeciesId,
      toSpecies: {
        id: toSpeciesId,
        externalId,
        name,
      },
      rules:
        versionGroupId === null
          ? []
          : [
              {
                versionGroupId,
              },
            ],
    };
  }

  it('returns directly obtainable species', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([]);

    await expect(service.getGameCoverage(10)).resolves.toEqual({
      game: {
        externalId: 10,
        name: 'firered',
      },
      species: [
        {
          externalId: 1,
          name: 'bulbasaur',
          source: 'DIRECT',
        },
      ],
    });
  });

  it('filters direct acquisitions by valid acquisition type', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([]);

    prisma.evolution.findMany.mockResolvedValue([]);

    await service.getGameCoverage(10);

    expect(prisma.pokemonAcquisition.findMany).toHaveBeenCalledWith({
      where: {
        gameId: 'game-1',
        acquisitionType: {
          code: {
            in: ['encounter'],
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
  });

  it('includes species obtainable through evolution', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-1', 'species-2', 2, 'ivysaur'),
    ]);

    await expect(service.getGameCoverage(10)).resolves.toEqual({
      game: {
        externalId: 10,
        name: 'firered',
      },
      species: [
        {
          externalId: 1,
          name: 'bulbasaur',
          source: 'DIRECT',
        },
        {
          externalId: 2,
          name: 'ivysaur',
          source: 'EVOLUTION',
        },
      ],
    });
  });

  it('expands multi-step evolution chains', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-1', 'species-2', 2, 'ivysaur'),
      evolution('species-2', 'species-3', 3, 'venusaur'),
    ]);

    await expect(service.getGameCoverage(10)).resolves.toEqual({
      game: {
        externalId: 10,
        name: 'firered',
      },
      species: [
        {
          externalId: 1,
          name: 'bulbasaur',
          source: 'DIRECT',
        },
        {
          externalId: 2,
          name: 'ivysaur',
          source: 'EVOLUTION',
        },
        {
          externalId: 3,
          name: 'venusaur',
          source: 'EVOLUTION',
        },
      ],
    });

    expect(prisma.evolution.findMany).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate directly obtainable species reached through evolution', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
      {
        variety: {
          species: {
            id: 'species-2',
            externalId: 2,
            name: 'ivysaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-1', 'species-2', 2, 'ivysaur'),
    ]);

    const result = await service.getGameCoverage(10);

    expect(result.species).toEqual([
      {
        externalId: 1,
        name: 'bulbasaur',
        source: 'DIRECT',
      },
      {
        externalId: 2,
        name: 'ivysaur',
        source: 'DIRECT',
      },
    ]);
  });

  it('accepts evolution rule for the current version group', async () => {
    mockGame(3, 'vg-1');

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-1', 'species-2', 2, 'ivysaur', 'vg-1'),
    ]);

    const result = await service.getGameCoverage(10);

    expect(result.species).toContainEqual({
      externalId: 2,
      name: 'ivysaur',
      source: 'EVOLUTION',
    });
  });

  it('rejects evolution restricted to another version group', async () => {
    mockGame(3, 'vg-1');

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-1', 'species-2', 2, 'ivysaur', 'vg-2'),
    ]);

    await expect(service.getGameCoverage(10)).resolves.toEqual({
      game: {
        externalId: 10,
        name: 'firered',
      },
      species: [
        {
          externalId: 1,
          name: 'bulbasaur',
          source: 'DIRECT',
        },
      ],
    });
  });

  it('accepts unrestricted evolution rules', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      {
        fromSpeciesId: 'species-1',
        toSpecies: {
          id: 'species-2',
          externalId: 2,
          name: 'ivysaur',
        },
        rules: [
          {
            versionGroupId: null,
          },
        ],
      },
    ]);

    const result = await service.getGameCoverage(10);

    expect(result.species).toContainEqual({
      externalId: 2,
      name: 'ivysaur',
      source: 'EVOLUTION',
    });
  });

  it('only loads evolutions introduced up to the game generation', async () => {
    mockGame(3, 'vg-3');

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'primeape',
            externalId: 57,
            name: 'primeape',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([]);

    await service.getGameCoverage(10);

    expect(prisma.evolution.findMany).toHaveBeenCalledWith({
      where: {
        toSpecies: {
          generation: {
            externalId: {
              lte: 3,
            },
          },
        },
      },
      select: {
        fromSpeciesId: true,
        toSpecies: {
          select: {
            id: true,
            externalId: true,
            name: true,
          },
        },
        rules: {
          select: {
            versionGroupId: true,
          },
        },
      },
    });
  });

  it('accepts an evolution introduced before the game generation', async () => {
    mockGame(4, 'vg-4');

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-123',
            externalId: 123,
            name: 'scyther',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-123', 'species-212', 212, 'scizor'),
    ]);

    const result = await service.getGameCoverage(10);

    expect(result.species).toContainEqual({
      externalId: 212,
      name: 'scizor',
      source: 'EVOLUTION',
    });
  });

  it('loads the evolution graph with a single query', async () => {
    mockGame();

    prisma.pokemonAcquisition.findMany.mockResolvedValue([
      {
        variety: {
          species: {
            id: 'species-1',
            externalId: 1,
            name: 'bulbasaur',
          },
        },
      },
    ]);

    prisma.evolution.findMany.mockResolvedValue([
      evolution('species-1', 'species-2', 2, 'ivysaur'),
      evolution('species-2', 'species-3', 3, 'venusaur'),
    ]);

    const result = await service.getGameCoverage(10);

    expect(prisma.evolution.findMany).toHaveBeenCalledTimes(1);

    expect(result.species).toEqual([
      {
        externalId: 1,
        name: 'bulbasaur',
        source: 'DIRECT',
      },
      {
        externalId: 2,
        name: 'ivysaur',
        source: 'EVOLUTION',
      },
      {
        externalId: 3,
        name: 'venusaur',
        source: 'EVOLUTION',
      },
    ]);
  });

  it('throws when game does not exist', async () => {
    prisma.game.findUnique.mockResolvedValue(null);

    await expect(service.getGameCoverage(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.pokemonAcquisition.findMany).not.toHaveBeenCalled();

    expect(prisma.evolution.findMany).not.toHaveBeenCalled();
  });
});
