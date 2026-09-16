import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(userId: string, pokemonExternalId: number) {
    const profileId = await this.getMainProfileId(userId);

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

  async getFavorites(userId: string) {
    const profileId = await this.getMainProfileId(userId);

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

  async removeFavorite(userId: string, pokemonExternalId: number) {
    const profileId = await this.getMainProfileId(userId);

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

  private async getMainProfileId(userId: string) {
    const profile = await this.prisma.collectionProfile.findUnique({
      where: {
        userId_name: {
          userId,
          name: 'Main',
        },
      },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Collection profile not found');
    }

    return profile.id;
  }
}
