import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCollection(
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

    return this.prisma.userCollection.upsert({
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

  async getCollection(userId: string, profileId: string) {
    await this.validateProfileOwnership(userId, profileId);

    const collection = await this.prisma.userCollection.findMany({
      where: {
        profileId,
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

    return collection;
  }

  async removeFromCollection(
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

    await this.prisma.userCollection.deleteMany({
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
