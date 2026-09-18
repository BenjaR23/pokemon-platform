import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileGamesDto } from './dto/update-profile-games.dto';

@Injectable()
export class ProfileGamesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileGames(userId: string, profileId: string) {
    await this.ensureProfileOwnership(userId, profileId);

    const profileGames = await this.prisma.collectionProfileGame.findMany({
      where: {
        profileId,
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

    return {
      primary: profileGames
        .filter((profileGame) => profileGame.role === 'PRIMARY')
        .map((profileGame) => ({
          externalId: profileGame.game.externalId,
          name: profileGame.game.name,
          position: profileGame.position,
        })),

      auxiliary: profileGames
        .filter((profileGame) => profileGame.role === 'AUXILIARY')
        .map((profileGame) => ({
          externalId: profileGame.game.externalId,
          name: profileGame.game.name,
          position: profileGame.position,
        })),
    };
  }

  async updateProfileGames(
    userId: string,
    profileId: string,
    dto: UpdateProfileGamesDto,
  ) {
    await this.ensureProfileOwnership(userId, profileId);

    this.validateNoSharedGames(dto.primaryGameIds, dto.auxiliaryGameIds);

    const requestedGameIds = [...dto.primaryGameIds, ...dto.auxiliaryGameIds];

    const games = await this.prisma.game.findMany({
      where: {
        externalId: {
          in: requestedGameIds,
        },
      },
      select: {
        id: true,
        externalId: true,
      },
    });

    if (games.length !== requestedGameIds.length) {
      const existingIds = new Set(games.map((game) => game.externalId));

      const missingIds = requestedGameIds.filter(
        (externalId) => !existingIds.has(externalId),
      );

      throw new BadRequestException(
        `Games not found: ${missingIds.join(', ')}`,
      );
    }

    const gameIdByExternalId = new Map(
      games.map((game) => [game.externalId, game.id]),
    );

    await this.prisma.$transaction(async (transaction) => {
      await transaction.collectionProfileGame.deleteMany({
        where: {
          profileId,
        },
      });

      const primaryGames = dto.primaryGameIds.map((externalId, position) => ({
        profileId,
        gameId: gameIdByExternalId.get(externalId)!,
        role: 'PRIMARY' as const,
        position,
      }));

      const auxiliaryGames = dto.auxiliaryGameIds.map(
        (externalId, position) => ({
          profileId,
          gameId: gameIdByExternalId.get(externalId)!,
          role: 'AUXILIARY' as const,
          position,
        }),
      );

      const profileGames = [...primaryGames, ...auxiliaryGames];

      if (profileGames.length > 0) {
        await transaction.collectionProfileGame.createMany({
          data: profileGames,
        });
      }
    });

    return this.getProfileGames(userId, profileId);
  }

  private async ensureProfileOwnership(userId: string, profileId: string) {
    const profile = await this.prisma.collectionProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Collection profile not found');
    }
  }

  private validateNoSharedGames(
    primaryGameIds: number[],
    auxiliaryGameIds: number[],
  ) {
    const primaryIds = new Set(primaryGameIds);

    const sharedGameIds = auxiliaryGameIds.filter((gameId) =>
      primaryIds.has(gameId),
    );

    if (sharedGameIds.length > 0) {
      throw new BadRequestException(
        `Games cannot be both primary and auxiliary: ${sharedGameIds.join(', ')}`,
      );
    }
  }
}
