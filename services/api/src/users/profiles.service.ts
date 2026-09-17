import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCollectionProfileDto,
  type CollectionObjectiveMode,
} from './dto/create-collection-profile.dto';
import { UpdateCollectionProfileDto } from './dto/update-collection-profile.dto';

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

  async getProfile(userId: string, profileId: string) {
    const profile = await this.prisma.collectionProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      include: this.profileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Collection profile not found');
    }

    const progress = await this.calculateProgress(profile);

    return {
      ...profile,
      progress,
    };
  }

  private async calculateProgress(profile: {
    id: string;
    objectiveMode: 'ALL' | 'GENERATIONS' | 'RANGE';
    startPokemonNumber: number | null;
    endPokemonNumber: number | null;
    generations: Array<{
      generation: {
        externalId: number;
        name: string;
      };
    }>;
  }) {
    if (profile.objectiveMode === 'GENERATIONS') {
      const generationIds = profile.generations.map(
        (entry) => entry.generation.externalId,
      );

      const speciesWhere = {
        generation: {
          externalId: {
            in: generationIds,
          },
        },
      };

      const [total, captured] = await Promise.all([
        this.prisma.pokemonSpecies.count({
          where: speciesWhere,
        }),

        this.prisma.userCollection.count({
          where: {
            profileId: profile.id,
            species: speciesWhere,
          },
        }),
      ]);

      return this.buildProgress(captured, total);
    }

    if (profile.objectiveMode === 'RANGE') {
      const start = profile.startPokemonNumber;
      const end = profile.endPokemonNumber;

      if (start === null || end === null) {
        throw new BadRequestException('Profile range configuration is invalid');
      }

      const speciesWhere = {
        externalId: {
          gte: start,
          lte: end,
        },
      };

      const [total, captured] = await Promise.all([
        this.prisma.pokemonSpecies.count({
          where: speciesWhere,
        }),

        this.prisma.userCollection.count({
          where: {
            profileId: profile.id,
            species: speciesWhere,
          },
        }),
      ]);

      return this.buildProgress(captured, total);
    }

    const [total, captured] = await Promise.all([
      this.prisma.pokemonSpecies.count(),

      this.prisma.userCollection.count({
        where: {
          profileId: profile.id,
        },
      }),
    ]);

    return this.buildProgress(captured, total);
  }

  private buildProgress(captured: number, total: number) {
    const percentage =
      total === 0 ? 0 : Number(((captured / total) * 100).toFixed(2));

    return {
      captured,
      total,
      percentage,
    };
  }

  async updateProfile(
    userId: string,
    profileId: string,
    dto: UpdateCollectionProfileDto,
  ) {
    const profile = await this.prisma.collectionProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      select: {
        id: true,
        name: true,
        objectiveMode: true,
        startPokemonNumber: true,
        endPokemonNumber: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Collection profile not found');
    }

    const name = dto.name !== undefined ? dto.name.trim() : profile.name;

    if (!name) {
      throw new BadRequestException('Profile name cannot be empty');
    }

    if (name !== profile.name) {
      const duplicate = await this.prisma.collectionProfile.findUnique({
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

      if (duplicate) {
        throw new BadRequestException(
          'A profile with this name already exists',
        );
      }
    }

    const objectiveMode = dto.objectiveMode ?? profile.objectiveMode;

    if (objectiveMode === 'GENERATIONS') {
      return this.updateGenerationProfile(profileId, name, dto);
    }

    if (objectiveMode === 'RANGE') {
      return this.updateRangeProfile(profile, name, dto);
    }

    return this.prisma.collectionProfile.update({
      where: {
        id: profileId,
      },
      data: {
        name,
        objectiveMode: 'ALL',
        startPokemonNumber: null,
        endPokemonNumber: null,
        generations: {
          deleteMany: {},
        },
      },
      include: this.profileInclude,
    });
  }

  private async updateGenerationProfile(
    profileId: string,
    name: string,
    dto: UpdateCollectionProfileDto,
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

    return this.prisma.collectionProfile.update({
      where: {
        id: profileId,
      },
      data: {
        name,
        objectiveMode: 'GENERATIONS',
        startPokemonNumber: null,
        endPokemonNumber: null,
        generations: {
          deleteMany: {},
          create: generations.map((generation) => ({
            generationId: generation.id,
          })),
        },
      },
      include: this.profileInclude,
    });
  }

  private async updateRangeProfile(
    profile: {
      id: string;
      startPokemonNumber: number | null;
      endPokemonNumber: number | null;
    },
    name: string,
    dto: UpdateCollectionProfileDto,
  ) {
    const startPokemonNumber =
      dto.startPokemonNumber ?? profile.startPokemonNumber;

    const endPokemonNumber = dto.endPokemonNumber ?? profile.endPokemonNumber;

    if (
      startPokemonNumber === null ||
      endPokemonNumber === null ||
      startPokemonNumber === undefined ||
      endPokemonNumber === undefined
    ) {
      throw new BadRequestException('Pokemon number range is required');
    }

    if (startPokemonNumber > endPokemonNumber) {
      throw new BadRequestException(
        'Start Pokemon number cannot be greater than end Pokemon number',
      );
    }

    return this.prisma.collectionProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        name,
        objectiveMode: 'RANGE',
        startPokemonNumber,
        endPokemonNumber,
        generations: {
          deleteMany: {},
        },
      },
      include: this.profileInclude,
    });
  }

  async deleteProfile(userId: string, profileId: string) {
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

    const profileCount = await this.prisma.collectionProfile.count({
      where: {
        userId,
      },
    });

    if (profileCount <= 1) {
      throw new BadRequestException(
        'The last collection profile cannot be deleted',
      );
    }

    await this.prisma.collectionProfile.delete({
      where: {
        id: profileId,
      },
    });

    return {
      removed: true,
    };
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
