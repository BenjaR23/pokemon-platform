import { NotFoundException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  const prisma = {
    pokemonSpecies: {
      findUnique: jest.fn(),
    },
    userFavorite: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    collectionProfile: {
      findFirst: jest.fn(),
    },
  };

  let service: FavoritesService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new FavoritesService(prisma as never);

    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
    });
  });

  it('adds a Pokemon species to profile favorites', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userFavorite.upsert.mockResolvedValue({
      id: 'favorite-id',
      createdAt: new Date('2026-09-16T12:00:00.000Z'),
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

    const result = await service.addFavorite('user-id', 'profile-id', 25);

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

    expect(prisma.userFavorite.upsert).toHaveBeenCalledWith({
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

    expect(result.species.externalId).toBe(25);
  });

  it('throws when adding a Pokemon that does not exist', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(
      service.addFavorite('user-id', 'profile-id', 9999),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userFavorite.upsert).not.toHaveBeenCalled();
  });

  it('returns favorites ordered by Pokemon number', async () => {
    prisma.userFavorite.findMany.mockResolvedValue([
      {
        id: 'favorite-1',
        createdAt: new Date(),
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
      {
        id: 'favorite-2',
        createdAt: new Date(),
        species: {
          externalId: 133,
          name: 'eevee',
          generation: {
            externalId: 1,
            name: 'generation-i',
          },
          varieties: [
            {
              externalId: 133,
              name: 'eevee',
            },
          ],
        },
      },
    ]);

    const result = await service.getFavorites('user-id', 'profile-id');

    expect(prisma.collectionProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'profile-id',
        userId: 'user-id',
      },
      select: {
        id: true,
      },
    });

    expect(prisma.userFavorite.findMany).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-id',
      },
      orderBy: {
        species: {
          externalId: 'asc',
        },
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

    expect(result).toHaveLength(2);
    expect(result[0].species.externalId).toBe(25);
    expect(result[1].species.externalId).toBe(133);
  });

  it('removes a Pokemon from profile favorites', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userFavorite.deleteMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.removeFavorite('user-id', 'profile-id', 25);

    expect(prisma.userFavorite.deleteMany).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-id',
        speciesId: 'species-id',
      },
    });

    expect(result).toEqual({
      removed: true,
    });
  });

  it('removes favorites idempotently', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue({
      id: 'species-id',
    });

    prisma.userFavorite.deleteMany.mockResolvedValue({
      count: 0,
    });

    const result = await service.removeFavorite('user-id', 'profile-id', 25);

    expect(result).toEqual({
      removed: true,
    });
  });

  it('throws when removing a Pokemon that does not exist', async () => {
    prisma.pokemonSpecies.findUnique.mockResolvedValue(null);

    await expect(
      service.removeFavorite('user-id', 'profile-id', 9999),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userFavorite.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects access to a profile not owned by the user', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.getFavorites('user-id', 'other-profile-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userFavorite.findMany).not.toHaveBeenCalled();
  });
});
