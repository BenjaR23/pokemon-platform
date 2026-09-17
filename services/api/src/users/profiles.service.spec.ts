import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  const prisma = {
    collectionProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    generation: {
      findMany: jest.fn(),
    },
    pokemonSpecies: {
      count: jest.fn(),
    },
    userCollection: {
      count: jest.fn(),
    },
  };

  let service: ProfilesService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ProfilesService(prisma as never);

    prisma.collectionProfile.findUnique.mockResolvedValue(null);
  });

  it('creates an ALL profile by default', async () => {
    const profile = {
      id: 'profile-id',
      userId: 'user-id',
      name: 'National Dex',
      objectiveMode: 'ALL',
      startPokemonNumber: null,
      endPokemonNumber: null,
      generations: [],
      games: [],
      preferences: null,
    };

    prisma.collectionProfile.create.mockResolvedValue(profile);

    const result = await service.createProfile('user-id', {
      name: 'National Dex',
    });

    expect(prisma.collectionProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 'user-id',
          name: 'National Dex',
          objectiveMode: 'ALL',
        },
      }),
    );

    expect(result).toEqual(profile);
  });

  it('creates a GENERATIONS profile', async () => {
    prisma.generation.findMany.mockResolvedValue([
      {
        id: 'generation-1-id',
        externalId: 1,
      },
      {
        id: 'generation-2-id',
        externalId: 2,
      },
    ]);

    prisma.collectionProfile.create.mockResolvedValue({
      id: 'profile-id',
    });

    await service.createProfile('user-id', {
      name: 'Kanto + Johto',
      objectiveMode: 'GENERATIONS',
      generationIds: [1, 2],
    });

    expect(prisma.generation.findMany).toHaveBeenCalledWith({
      where: {
        externalId: {
          in: [1, 2],
        },
      },
      select: {
        id: true,
        externalId: true,
      },
    });

    expect(prisma.collectionProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 'user-id',
          name: 'Kanto + Johto',
          objectiveMode: 'GENERATIONS',
          generations: {
            create: [
              {
                generationId: 'generation-1-id',
              },
              {
                generationId: 'generation-2-id',
              },
            ],
          },
        },
      }),
    );
  });

  it('creates a RANGE profile', async () => {
    prisma.collectionProfile.create.mockResolvedValue({
      id: 'profile-id',
    });

    await service.createProfile('user-id', {
      name: 'First 251',
      objectiveMode: 'RANGE',
      startPokemonNumber: 1,
      endPokemonNumber: 251,
    });

    expect(prisma.collectionProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 'user-id',
          name: 'First 251',
          objectiveMode: 'RANGE',
          startPokemonNumber: 1,
          endPokemonNumber: 251,
        },
      }),
    );
  });

  it('rejects an empty generation selection', async () => {
    await expect(
      service.createProfile('user-id', {
        name: 'Empty',
        objectiveMode: 'GENERATIONS',
        generationIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collectionProfile.create).not.toHaveBeenCalled();
  });

  it('rejects nonexistent generations', async () => {
    prisma.generation.findMany.mockResolvedValue([
      {
        id: 'generation-1-id',
        externalId: 1,
      },
    ]);

    await expect(
      service.createProfile('user-id', {
        name: 'Invalid Generations',
        objectiveMode: 'GENERATIONS',
        generationIds: [1, 999],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collectionProfile.create).not.toHaveBeenCalled();
  });

  it('rejects an inverted Pokemon number range', async () => {
    await expect(
      service.createProfile('user-id', {
        name: 'Invalid Range',
        objectiveMode: 'RANGE',
        startPokemonNumber: 251,
        endPokemonNumber: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collectionProfile.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate profile names', async () => {
    prisma.collectionProfile.findUnique.mockResolvedValue({
      id: 'existing-profile-id',
    });

    await expect(
      service.createProfile('user-id', {
        name: 'Main',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collectionProfile.create).not.toHaveBeenCalled();
  });

  it('lists only profiles owned by the authenticated user', async () => {
    const profiles = [
      {
        id: 'profile-1',
        name: 'Main',
      },
      {
        id: 'profile-2',
        name: 'Kanto',
      },
    ];

    prisma.collectionProfile.findMany.mockResolvedValue(profiles);

    const result = await service.getProfiles('user-id');

    expect(prisma.collectionProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-id',
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    );

    expect(result).toEqual(profiles);
  });

  it('returns an ALL profile with calculated progress', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      userId: 'user-id',
      name: 'National Dex',
      objectiveMode: 'ALL',
      startPokemonNumber: null,
      endPokemonNumber: null,
      generations: [],
      games: [],
      preferences: null,
    });

    prisma.pokemonSpecies.count.mockResolvedValue(100);

    prisma.userCollection.count.mockResolvedValue(25);

    const result = await service.getProfile('user-id', 'profile-id');

    expect(prisma.collectionProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'profile-id',
          userId: 'user-id',
        },
      }),
    );

    expect(result.progress).toEqual({
      captured: 25,
      total: 100,
      percentage: 25,
    });
  });

  it('calculates progress for selected generations', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      userId: 'user-id',
      name: 'Kanto + Johto',
      objectiveMode: 'GENERATIONS',
      startPokemonNumber: null,
      endPokemonNumber: null,
      generations: [
        {
          generation: {
            externalId: 1,
            name: 'generation-i',
          },
        },
        {
          generation: {
            externalId: 2,
            name: 'generation-ii',
          },
        },
      ],
      games: [],
      preferences: null,
    });

    prisma.pokemonSpecies.count.mockResolvedValue(251);

    prisma.userCollection.count.mockResolvedValue(100);

    const result = await service.getProfile('user-id', 'profile-id');

    expect(prisma.pokemonSpecies.count).toHaveBeenCalledWith({
      where: {
        generation: {
          externalId: {
            in: [1, 2],
          },
        },
      },
    });

    expect(prisma.userCollection.count).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-id',
        species: {
          generation: {
            externalId: {
              in: [1, 2],
            },
          },
        },
      },
    });

    expect(result.progress).toEqual({
      captured: 100,
      total: 251,
      percentage: 39.84,
    });
  });

  it('calculates progress for a Pokemon number range', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      userId: 'user-id',
      name: 'First 151',
      objectiveMode: 'RANGE',
      startPokemonNumber: 1,
      endPokemonNumber: 151,
      generations: [],
      games: [],
      preferences: null,
    });

    prisma.pokemonSpecies.count.mockResolvedValue(151);

    prisma.userCollection.count.mockResolvedValue(75);

    const result = await service.getProfile('user-id', 'profile-id');

    expect(prisma.pokemonSpecies.count).toHaveBeenCalledWith({
      where: {
        externalId: {
          gte: 1,
          lte: 151,
        },
      },
    });

    expect(result.progress).toEqual({
      captured: 75,
      total: 151,
      percentage: 49.67,
    });
  });

  it('throws when the profile is not owned by the user', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.getProfile('user-id', 'other-profile-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.pokemonSpecies.count).not.toHaveBeenCalled();

    expect(prisma.userCollection.count).not.toHaveBeenCalled();
  });

  it('updates a profile from GENERATIONS to ALL', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      name: 'Kanto',
      objectiveMode: 'GENERATIONS',
      startPokemonNumber: null,
      endPokemonNumber: null,
    });

    prisma.collectionProfile.update.mockResolvedValue({
      id: 'profile-id',
      name: 'Kanto',
      objectiveMode: 'ALL',
    });

    await service.updateProfile('user-id', 'profile-id', {
      objectiveMode: 'ALL',
    });

    expect(prisma.collectionProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'profile-id',
        },
        data: {
          name: 'Kanto',
          objectiveMode: 'ALL',
          startPokemonNumber: null,
          endPokemonNumber: null,
          generations: {
            deleteMany: {},
          },
        },
      }),
    );
  });

  it('updates a profile to selected generations', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      name: 'Main',
      objectiveMode: 'ALL',
      startPokemonNumber: null,
      endPokemonNumber: null,
    });

    prisma.generation.findMany.mockResolvedValue([
      {
        id: 'generation-1-id',
        externalId: 1,
      },
      {
        id: 'generation-2-id',
        externalId: 2,
      },
    ]);

    prisma.collectionProfile.update.mockResolvedValue({
      id: 'profile-id',
    });

    await service.updateProfile('user-id', 'profile-id', {
      objectiveMode: 'GENERATIONS',
      generationIds: [1, 2],
    });

    expect(prisma.collectionProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'profile-id',
        },
        data: {
          name: 'Main',
          objectiveMode: 'GENERATIONS',
          startPokemonNumber: null,
          endPokemonNumber: null,
          generations: {
            deleteMany: {},
            create: [
              {
                generationId: 'generation-1-id',
              },
              {
                generationId: 'generation-2-id',
              },
            ],
          },
        },
      }),
    );
  });

  it('updates a profile to a Pokemon number range', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      name: 'Main',
      objectiveMode: 'ALL',
      startPokemonNumber: null,
      endPokemonNumber: null,
    });

    prisma.collectionProfile.update.mockResolvedValue({
      id: 'profile-id',
    });

    await service.updateProfile('user-id', 'profile-id', {
      objectiveMode: 'RANGE',
      startPokemonNumber: 1,
      endPokemonNumber: 151,
    });

    expect(prisma.collectionProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Main',
          objectiveMode: 'RANGE',
          startPokemonNumber: 1,
          endPokemonNumber: 151,
          generations: {
            deleteMany: {},
          },
        },
      }),
    );
  });

  it('updates an existing range partially', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      name: 'First 151',
      objectiveMode: 'RANGE',
      startPokemonNumber: 1,
      endPokemonNumber: 151,
    });

    prisma.collectionProfile.update.mockResolvedValue({
      id: 'profile-id',
    });

    await service.updateProfile('user-id', 'profile-id', {
      endPokemonNumber: 251,
    });

    expect(prisma.collectionProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'First 151',
          objectiveMode: 'RANGE',
          startPokemonNumber: 1,
          endPokemonNumber: 251,
          generations: {
            deleteMany: {},
          },
        },
      }),
    );
  });

  it('rejects updating a profile not owned by the user', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.updateProfile('user-id', 'other-profile-id', {
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a duplicate profile name on update', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      name: 'Main',
      objectiveMode: 'ALL',
      startPokemonNumber: null,
      endPokemonNumber: null,
    });

    prisma.collectionProfile.findUnique.mockResolvedValue({
      id: 'existing-profile-id',
    });

    await expect(
      service.updateProfile('user-id', 'profile-id', {
        name: 'Kanto',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collectionProfile.update).not.toHaveBeenCalled();
  });

  it('deletes an owned profile when the user has more than one', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
    });

    prisma.collectionProfile.count.mockResolvedValue(2);

    prisma.collectionProfile.delete.mockResolvedValue({
      id: 'profile-id',
    });

    const result = await service.deleteProfile('user-id', 'profile-id');

    expect(prisma.collectionProfile.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
      },
    });

    expect(prisma.collectionProfile.delete).toHaveBeenCalledWith({
      where: {
        id: 'profile-id',
      },
    });

    expect(result).toEqual({
      removed: true,
    });
  });

  it('rejects deleting the last profile', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
    });

    prisma.collectionProfile.count.mockResolvedValue(1);

    await expect(
      service.deleteProfile('user-id', 'profile-id'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.collectionProfile.delete).not.toHaveBeenCalled();
  });

  it('rejects deleting a profile not owned by the user', async () => {
    prisma.collectionProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteProfile('user-id', 'other-profile-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.collectionProfile.delete).not.toHaveBeenCalled();
  });
});
