import { BadRequestException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  const prisma = {
    collectionProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    generation: {
      findMany: jest.fn(),
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
});
