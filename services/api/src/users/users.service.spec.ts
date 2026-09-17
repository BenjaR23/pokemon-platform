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
    collectionProfile: {
      findFirst: jest.fn(),
    },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UsersService(prisma as never);

    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
    });
  });

  it('adds a Pokemon species to the profile collection', async () => {
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

    const result = await service.addToCollection('user-id', 'profile-id', 25);

    expect(prisma.collectionProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'profile-id',
        userId: 'user-id',
      },
      select: {
        id: true,
      },
    });

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
        profileId_speciesId: {
          profileId: 'profile-id',
          speciesId: 'species-id',
        },
      },
      update: {},
      create: {
        profileId: 'profile-id',
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
      service.addToCollection('user-id', 'profile-id', 99999),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userCollection.upsert).not.toHaveBeenCalled();
  });

  it('returns the authenticated profile collection', async () => {
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

    const result = await service.getCollection('user-id', 'profile-id');

    expect(prisma.collectionProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'profile-id',
        userId: 'user-id',
      },
      select: {
        id: true,
      },
    });

    expect(prisma.userCollection.findMany).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-id',
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

  it('removes a Pokemon species from the profile collection', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userCollection.deleteMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.removeFromCollection(
      'user-id',
      'profile-id',
      25,
    );

    expect(prisma.userCollection.deleteMany).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-id',
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

    const result = await service.removeFromCollection(
      'user-id',
      'profile-id',
      25,
    );

    expect(result).toEqual({
      removed: true,
    });
  });

  it('throws when removing a Pokemon that does not exist', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(
      service.removeFromCollection('user-id', 'profile-id', 99999),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userCollection.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects access to a profile not owned by the user', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.getCollection('user-id', 'other-profile-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userCollection.findMany).not.toHaveBeenCalled();
  });
});
