import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCollection(userId: string, pokemonExternalId: number) {
    const species = await this.prisma.pokemonSpecies.findUnique({
      where: {
        externalId: pokemonExternalId,
      },
      select: {
        id: true,
        externalId: true,
        name: true,
      },
    });

    if (!species) {
      throw new NotFoundException(
        `Pokemon with id ${pokemonExternalId} was not found`,
      );
    }

    const collectionEntry = await this.prisma.userCollection.upsert({
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
          },
        },
      },
    });

    return collectionEntry;
  }

  async getCollection(userId: string) {
    const collection = await this.prisma.userCollection.findMany({
      where: {
        userId,
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

  async removeFromCollection(userId: string, pokemonExternalId: number) {
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
        userId,
        speciesId: species.id,
      },
    });

    return {
      removed: true,
    };
  }
}
