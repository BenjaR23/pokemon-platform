import { PokemonSyncService } from './pokemon-sync.service.js';
import { PokemonService } from './pokemon.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EvolutionService } from './evolution.service.js';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

describe('PokemonSyncService', () => {
  let service: PokemonSyncService;

  const pokemonServiceMock = {
    syncSpecies: jest.fn(),
  };

  const prismaMock = {
    syncRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
    pokemonSpecies: {
      findMany: jest.fn(),
    },
  };

  const evolutionServiceMock = {
    syncEvolutionChain: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    service = new PokemonSyncService(
      pokemonServiceMock as unknown as PokemonService,
      prismaMock as unknown as PrismaService,
      evolutionServiceMock as unknown as EvolutionService,
    );
  });

  it('should synchronize an inclusive range of Pokemon species', async () => {
    prismaMock.syncRun.create.mockResolvedValue({
      id: 'sync-run-uuid',
      source: 'pokeapi',
      status: 'running',
      active: true,
    });

    pokemonServiceMock.syncSpecies.mockResolvedValue({});

    prismaMock.syncRun.update.mockResolvedValue({
      id: 'sync-run-uuid',
      source: 'pokeapi',
      status: 'completed',
      active: null,
    });

    prismaMock.pokemonSpecies.findMany.mockResolvedValue([
      {
        evolutionChain: {
          externalId: 1,
        },
      },
      {
        evolutionChain: {
          externalId: 1,
        },
      },
      {
        evolutionChain: {
          externalId: 1,
        },
      },
    ]);

    evolutionServiceMock.syncEvolutionChain.mockResolvedValue({
      id: 'evolution-chain-uuid',
      externalId: 1,
    });

    await service.syncRange(1, 3);

    expect(prismaMock.pokemonSpecies.findMany).toHaveBeenCalledWith({
      where: {
        externalId: {
          gte: 1,
          lte: 3,
        },
      },
      select: {
        evolutionChain: {
          select: {
            externalId: true,
          },
        },
      },
    });

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledTimes(1);

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledWith(1);

    expect(pokemonServiceMock.syncSpecies).toHaveBeenCalledTimes(3);

    expect(pokemonServiceMock.syncSpecies).toHaveBeenNthCalledWith(
      1,
      1,
      expect.any(Object),
    );

    expect(pokemonServiceMock.syncSpecies).toHaveBeenNthCalledWith(
      2,
      2,
      expect.any(Object),
    );

    expect(pokemonServiceMock.syncSpecies).toHaveBeenNthCalledWith(
      3,
      3,
      expect.any(Object),
    );

    expect(prismaMock.syncRun.create).toHaveBeenCalledWith({
      data: {
        source: 'pokeapi',
        status: 'running',
        active: true,
      },
    });

    expect(prismaMock.syncRun.update).toHaveBeenCalledWith({
      where: {
        id: 'sync-run-uuid',
      },
      data: {
        status: 'completed',
        active: null,
        finishedAt: expect.any(Date) as Date,
      },
    });
  });

  it('should mark the sync run as failed when a species cannot be synchronized', async () => {
    prismaMock.syncRun.create.mockResolvedValue({
      id: 'sync-run-uuid',
      source: 'pokeapi',
      status: 'running',
      active: true,
    });

    pokemonServiceMock.syncSpecies
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('PokeAPI failure'));

    prismaMock.syncRun.update.mockResolvedValue({});

    await expect(service.syncRange(1, 3)).rejects.toThrow('PokeAPI failure');

    expect(pokemonServiceMock.syncSpecies).toHaveBeenCalledTimes(2);

    expect(prismaMock.syncRun.update).toHaveBeenCalledWith({
      where: {
        id: 'sync-run-uuid',
      },
      data: {
        status: 'failed',
        active: null,
        finishedAt: expect.any(Date) as Date,
        error: 'PokeAPI failure',
      },
    });
  });

  it('should reject an invalid synchronization range', async () => {
    await expect(service.syncRange(10, 5)).rejects.toThrow(
      'Invalid Pokemon synchronization range',
    );

    expect(prismaMock.syncRun.create).not.toHaveBeenCalled();

    expect(pokemonServiceMock.syncSpecies).not.toHaveBeenCalled();
  });

  it('should synchronize each unique evolution chain once', async () => {
    prismaMock.syncRun.create.mockResolvedValue({
      id: 'sync-run-uuid',
      active: true,
    });

    pokemonServiceMock.syncSpecies.mockResolvedValue({});

    prismaMock.pokemonSpecies.findMany.mockResolvedValue([
      {
        evolutionChain: {
          externalId: 1,
        },
      },
      {
        evolutionChain: {
          externalId: 1,
        },
      },
      {
        evolutionChain: {
          externalId: 2,
        },
      },
    ]);

    evolutionServiceMock.syncEvolutionChain.mockResolvedValue({});

    prismaMock.syncRun.update.mockResolvedValue({});

    await service.syncRange(1, 3);

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledTimes(2);

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledWith(1);

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledWith(2);
  });

  it('should ignore species without an evolution chain', async () => {
    prismaMock.syncRun.create.mockResolvedValue({
      id: 'sync-run-uuid',
      active: true,
    });

    pokemonServiceMock.syncSpecies.mockResolvedValue({});

    prismaMock.pokemonSpecies.findMany.mockResolvedValue([
      {
        evolutionChain: null,
      },
      {
        evolutionChain: {
          externalId: 5,
        },
      },
      {
        evolutionChain: null,
      },
    ]);

    evolutionServiceMock.syncEvolutionChain.mockResolvedValue({});

    prismaMock.syncRun.update.mockResolvedValue({});

    await service.syncRange(1, 3);

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledTimes(1);

    expect(evolutionServiceMock.syncEvolutionChain).toHaveBeenCalledWith(5);
  });

  it('should reject a synchronization when another sync is already running', async () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.9.1',
        meta: {
          target: ['active'],
        },
      },
    );

    prismaMock.syncRun.create.mockRejectedValue(uniqueConstraintError);

    await expect(service.syncRange(1, 3)).rejects.toThrow(ConflictException);

    await expect(service.syncRange(1, 3)).rejects.toThrow(
      'A Pokemon synchronization is already running',
    );

    expect(pokemonServiceMock.syncSpecies).not.toHaveBeenCalled();

    expect(prismaMock.pokemonSpecies.findMany).not.toHaveBeenCalled();

    expect(evolutionServiceMock.syncEvolutionChain).not.toHaveBeenCalled();

    expect(prismaMock.syncRun.update).not.toHaveBeenCalled();
  });

  it('should rethrow unexpected errors when creating a sync run', async () => {
    const databaseError = new Error('Database unavailable');

    prismaMock.syncRun.create.mockRejectedValue(databaseError);

    await expect(service.syncRange(1, 3)).rejects.toThrow(
      'Database unavailable',
    );

    expect(pokemonServiceMock.syncSpecies).not.toHaveBeenCalled();

    expect(prismaMock.pokemonSpecies.findMany).not.toHaveBeenCalled();

    expect(evolutionServiceMock.syncEvolutionChain).not.toHaveBeenCalled();

    expect(prismaMock.syncRun.update).not.toHaveBeenCalled();
  });

  it('should reject a synchronization when another sync is already running', async () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.9.1',
        meta: {
          target: ['active'],
        },
      },
    );

    prismaMock.syncRun.create.mockRejectedValue(uniqueConstraintError);

    const syncPromise = service.syncRange(1, 3);

    await expect(syncPromise).rejects.toThrow(
      'A Pokemon synchronization is already running',
    );

    expect(pokemonServiceMock.syncSpecies).not.toHaveBeenCalled();

    expect(prismaMock.pokemonSpecies.findMany).not.toHaveBeenCalled();

    expect(evolutionServiceMock.syncEvolutionChain).not.toHaveBeenCalled();

    expect(prismaMock.syncRun.update).not.toHaveBeenCalled();
  });
});
