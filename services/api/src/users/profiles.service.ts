import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCollectionProfileDto,
  type CollectionObjectiveMode,
} from './dto/create-collection-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateCollectionProfileDto) {
    const name = dto.name.trim();
    const objectiveMode: CollectionObjectiveMode = dto.objectiveMode ?? 'ALL';

    if (!name) {
      throw new BadRequestException('Profile name cannot be empty');
    }

    const existingProfile = await this.prisma.collectionProfile.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProfile) {
      throw new BadRequestException('A profile with this name already exists');
    }

    if (objectiveMode === 'GENERATIONS') {
      return this.createGenerationProfile(userId, name, dto);
    }

    if (objectiveMode === 'RANGE') {
      return this.createRangeProfile(userId, name, dto);
    }

    return this.prisma.collectionProfile.create({
      data: {
        userId,
        name,
        objectiveMode: 'ALL',
      },
      include: this.profileInclude,
    });
  }

  async getProfiles(userId: string) {
    return this.prisma.collectionProfile.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: this.profileInclude,
    });
  }

  private async createGenerationProfile(
    userId: string,
    name: string,
    dto: CreateCollectionProfileDto,
  ) {
    const generationIds = dto.generationIds ?? [];

    if (generationIds.length === 0) {
      throw new BadRequestException('At least one generation is required');
    }

    const generations = await this.prisma.generation.findMany({
      where: {
        externalId: {
          in: generationIds,
        },
      },
      select: {
        id: true,
        externalId: true,
      },
    });

    if (generations.length !== generationIds.length) {
      throw new BadRequestException('One or more generations do not exist');
    }

    return this.prisma.collectionProfile.create({
      data: {
        userId,
        name,
        objectiveMode: 'GENERATIONS',
        generations: {
          create: generations.map((generation) => ({
            generationId: generation.id,
          })),
        },
      },
      include: this.profileInclude,
    });
  }

  private async createRangeProfile(
    userId: string,
    name: string,
    dto: CreateCollectionProfileDto,
  ) {
    const startPokemonNumber = dto.startPokemonNumber;
    const endPokemonNumber = dto.endPokemonNumber;

    if (startPokemonNumber === undefined || endPokemonNumber === undefined) {
      throw new BadRequestException('Pokemon number range is required');
    }

    if (startPokemonNumber > endPokemonNumber) {
      throw new BadRequestException(
        'Start Pokemon number cannot be greater than end Pokemon number',
      );
    }

    return this.prisma.collectionProfile.create({
      data: {
        userId,
        name,
        objectiveMode: 'RANGE',
        startPokemonNumber,
        endPokemonNumber,
      },
      include: this.profileInclude,
    });
  }

  private readonly profileInclude = {
    generations: {
      include: {
        generation: {
          select: {
            externalId: true,
            name: true,
          },
        },
      },
      orderBy: {
        generation: {
          externalId: 'asc' as const,
        },
      },
    },
    games: {
      include: {
        game: {
          select: {
            externalId: true,
            name: true,
          },
        },
      },
    },
    preferences: true,
  };
}
