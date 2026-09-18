import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProfileGamesService } from './profile-games.service';

describe('ProfileGamesService', () => {
  let service: ProfileGamesService;

  const prisma = {
    collectionProfile: {
      findFirst: jest.fn(),
    },

    collectionProfileGame: {
      findMany: jest.fn(),
    },

    game: {
      findMany: jest.fn(),
    },

    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProfileGamesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(ProfileGamesService);
  });

  describe('getProfileGames', () => {
    it('returns empty configuration', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
      });

      prisma.collectionProfileGame.findMany.mockResolvedValue([]);

      await expect(
        service.getProfileGames('user-1', 'profile-1'),
      ).resolves.toEqual({
        primary: [],
        auxiliary: [],
      });
    });

    it('returns primary and auxiliary games ordered', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
      });

      prisma.collectionProfileGame.findMany.mockResolvedValue([
        {
          role: 'PRIMARY',
          position: 0,
          game: {
            externalId: 10,
            name: 'firered',
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
          role: 'AUXILIARY',
          position: 0,
          game: {
            externalId: 11,
            name: 'leafgreen',
          },
        },
      ]);

      await expect(
        service.getProfileGames('user-1', 'profile-1'),
      ).resolves.toEqual({
        primary: [
          {
            externalId: 10,
            name: 'firered',
            position: 0,
          },
          {
            externalId: 9,
            name: 'emerald',
            position: 1,
          },
        ],
        auxiliary: [
          {
            externalId: 11,
            name: 'leafgreen',
            position: 0,
          },
        ],
      });

      expect(prisma.collectionProfileGame.findMany).toHaveBeenCalledWith({
        where: {
          profileId: 'profile-1',
        },
        include: {
          game: true,
        },
        orderBy: [
          {
            role: 'asc',
          },
          {
            position: 'asc',
          },
        ],
      });
    });

    it('rejects inaccessible profile', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.getProfileGames('user-1', 'profile-2'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.collectionProfileGame.findMany).not.toHaveBeenCalled();
    });
  });

  describe('updateProfileGames', () => {
    it('stores primary and auxiliary games with their positions', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
      });

      prisma.game.findMany.mockResolvedValue([
        {
          id: 'game-fire-red',
          externalId: 10,
        },
        {
          id: 'game-emerald',
          externalId: 9,
        },
        {
          id: 'game-leaf-green',
          externalId: 11,
        },
      ]);

      const transaction = {
        collectionProfileGame: {
          deleteMany: jest.fn().mockResolvedValue({
            count: 0,
          }),
          createMany: jest.fn().mockResolvedValue({
            count: 3,
          }),
        },
      };

      prisma.$transaction.mockImplementation(
        (callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
      );

      prisma.collectionProfileGame.findMany.mockResolvedValue([
        {
          role: 'PRIMARY',
          position: 0,
          game: {
            externalId: 10,
            name: 'firered',
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
          role: 'AUXILIARY',
          position: 0,
          game: {
            externalId: 11,
            name: 'leafgreen',
          },
        },
      ]);

      const result = await service.updateProfileGames('user-1', 'profile-1', {
        primaryGameIds: [10, 9],
        auxiliaryGameIds: [11],
      });

      expect(transaction.collectionProfileGame.deleteMany).toHaveBeenCalledWith(
        {
          where: {
            profileId: 'profile-1',
          },
        },
      );

      expect(transaction.collectionProfileGame.createMany).toHaveBeenCalledWith(
        {
          data: [
            {
              profileId: 'profile-1',
              gameId: 'game-fire-red',
              role: 'PRIMARY',
              position: 0,
            },
            {
              profileId: 'profile-1',
              gameId: 'game-emerald',
              role: 'PRIMARY',
              position: 1,
            },
            {
              profileId: 'profile-1',
              gameId: 'game-leaf-green',
              role: 'AUXILIARY',
              position: 0,
            },
          ],
        },
      );

      expect(result).toEqual({
        primary: [
          {
            externalId: 10,
            name: 'firered',
            position: 0,
          },
          {
            externalId: 9,
            name: 'emerald',
            position: 1,
          },
        ],
        auxiliary: [
          {
            externalId: 11,
            name: 'leafgreen',
            position: 0,
          },
        ],
      });
    });

    it('allows empty configuration', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
      });

      prisma.game.findMany.mockResolvedValue([]);

      const transaction = {
        collectionProfileGame: {
          deleteMany: jest.fn().mockResolvedValue({
            count: 2,
          }),
          createMany: jest.fn(),
        },
      };

      prisma.$transaction.mockImplementation(
        (callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
      );

      prisma.collectionProfileGame.findMany.mockResolvedValue([]);

      await expect(
        service.updateProfileGames('user-1', 'profile-1', {
          primaryGameIds: [],
          auxiliaryGameIds: [],
        }),
      ).resolves.toEqual({
        primary: [],
        auxiliary: [],
      });

      expect(transaction.collectionProfileGame.deleteMany).toHaveBeenCalled();

      expect(
        transaction.collectionProfileGame.createMany,
      ).not.toHaveBeenCalled();
    });

    it('rejects a game used as both primary and auxiliary', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
      });

      await expect(
        service.updateProfileGames('user-1', 'profile-1', {
          primaryGameIds: [10],
          auxiliaryGameIds: [10],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.game.findMany).not.toHaveBeenCalled();

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects games that do not exist', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
      });

      prisma.game.findMany.mockResolvedValue([
        {
          id: 'game-fire-red',
          externalId: 10,
        },
      ]);

      await expect(
        service.updateProfileGames('user-1', 'profile-1', {
          primaryGameIds: [10, 999999],
          auxiliaryGameIds: [],
        }),
      ).rejects.toThrow('Games not found: 999999');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects inaccessible profile before modifying anything', async () => {
      prisma.collectionProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfileGames('user-1', 'profile-2', {
          primaryGameIds: [10],
          auxiliaryGameIds: [],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.game.findMany).not.toHaveBeenCalled();

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
