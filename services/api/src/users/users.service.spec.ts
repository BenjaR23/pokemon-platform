import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    pokemonSpecies: {
      findUnique: jest.fn(),
    },
    userCollection: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UsersService(prisma as never);
  });

  it('adds a Pokemon species to the user collection', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userCollection.upsert.mockResolvedValue({
      id: 'collection-id',
      createdAt: new Date('2026-09-15T12:00:00.000Z'),
      species: {
        externalId: 25,
        name: 'pikachu',
        generation: {
          externalId: 1,
          name: 'generation-i',
        },
        varieties: [
          {
            externalId: 25,
            name: 'pikachu',
          },
        ],
      },
    });

    const result = await service.addToCollection('user-id', 25);

    expect(prisma.pokemonSpecies.findUnique).toHaveBeenCalledWith({
      where: {
        externalId: 25,
      },
      select: {
        id: true,
      },
    });

    expect(prisma.userCollection.upsert).toHaveBeenCalledWith({
      where: {
        userId_speciesId: {
          userId: 'user-id',
          speciesId: 'species-id',
        },
      },
      update: {},
      create: {
        userId: 'user-id',
        speciesId: 'species-id',
      },
      select: {
        id: true,
        createdAt: true,
        species: {
          select: {
            externalId: true,
            name: true,
            generation: {
              select: {
                externalId: true,
                name: true,
              },
            },
            varieties: {
              where: {
                isDefault: true,
              },
              take: 1,
              select: {
                externalId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    expect(result).toEqual({
      id: 'collection-id',
      createdAt: new Date('2026-09-15T12:00:00.000Z'),
      species: {
        externalId: 25,
        name: 'pikachu',
        generation: {
          externalId: 1,
          name: 'generation-i',
        },
        varieties: [
          {
            externalId: 25,
            name: 'pikachu',
          },
        ],
      },
    });
  });

  it('throws when adding a Pokemon that does not exist', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(
      service.addToCollection('user-id', 99999),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userCollection.upsert).not.toHaveBeenCalled();
  });

  it('returns the authenticated user collection', async () => {
    const collection = [
      {
        id: 'collection-id',
        createdAt: new Date('2026-09-15T12:00:00.000Z'),
        species: {
          externalId: 25,
          name: 'pikachu',
          generation: {
            externalId: 1,
            name: 'generation-i',
          },
          varieties: [
            {
              externalId: 25,
              name: 'pikachu',
            },
          ],
        },
      },
    ];

    prisma.userCollection.findMany.mockResolvedValue(collection);

    const result = await service.getCollection('user-id');

    expect(prisma.userCollection.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        species: {
          select: {
            externalId: true,
            name: true,
            generation: {
              select: {
                externalId: true,
                name: true,
              },
            },
            varieties: {
              where: {
                isDefault: true,
              },
              take: 1,
              select: {
                externalId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    expect(result).toEqual(collection);
  });

  it('removes a Pokemon species from the user collection', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userCollection.deleteMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.removeFromCollection('user-id', 25);

    expect(prisma.userCollection.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        speciesId: 'species-id',
      },
    });

    expect(result).toEqual({
      removed: true,
    });
  });

  it('keeps removal idempotent when the Pokemon is not in the collection', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userCollection.deleteMany.mockResolvedValue({
      count: 0,
    });

    const result = await service.removeFromCollection('user-id', 25);

    expect(result).toEqual({
      removed: true,
    });
  });

  it('throws when removing a Pokemon that does not exist', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(
      service.removeFromCollection('user-id', 99999),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userCollection.deleteMany).not.toHaveBeenCalled();
  });
});
