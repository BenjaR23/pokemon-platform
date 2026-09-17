import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(
    userId: string,
    profileId: string,
    pokemonExternalId: number,
  ) {
    await this.validateProfileOwnership(userId, profileId);

    const species = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId: pokemonExternalId,
      },
      select: {
        id: true,
      },
    });

    if (!species) {
      throw new NotFoundException(
        `Pokemon with id ${pokemonExternalId} was not found`,
      );
    }

    return this.prisma.userFavorite.upsert({
      where: {
        profileId_speciesId: {
          profileId,
          speciesId: species.id,
        },
      },
      update: {},
      create: {
        profileId,
        speciesId: species.id,
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
  }

  async getFavorites(userId: string, profileId: string) {
    await this.validateProfileOwnership(userId, profileId);

    return this.prisma.userFavorite.findMany({
      where: {
        profileId,
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
  }

  async removeFavorite(
    userId: string,
    profileId: string,
    pokemonExternalId: number,
  ) {
    await this.validateProfileOwnership(userId, profileId);

    const species = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId: pokemonExternalId,
      },
      select: {
        id: true,
      },
    });

    if (!species) {
      throw new NotFoundException(
        `Pokemon with id ${pokemonExternalId} was not found`,
      );
    }

    await this.prisma.userFavorite.deleteMany({
      where: {
        profileId,
        speciesId: species.id,
      },
    });

    return {
      removed: true,
    };
  }

  private async validateProfileOwnership(userId: string, profileId: string) {
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
}
