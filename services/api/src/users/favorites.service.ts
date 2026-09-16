import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(userId: string, pokemonExternalId: number) {
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
        userId_speciesId: {
          userId,
          speciesId: species.id,
        },
      },
      update: {},
      create: {
        userId,
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
    return this.prisma.userFavorite.findMany({
      where: {
        userId,
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
        userId,
        speciesId: species.id,
      },
    });

    return {
      removed: true,
    };
  }
}
