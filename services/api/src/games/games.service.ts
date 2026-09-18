import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const games = await this.prisma.game.findMany({
      include: {
        versionGroup: {
          include: {
            generation: true,
          },
        },
      },
      orderBy: [
        {
          versionGroup: {
            generation: {
              externalId: 'asc',
            },
          },
        },
        {
          externalId: 'asc',
        },
      ],
    });

    return games.map((game) => ({
      externalId: game.externalId,
      name: game.name,
      versionGroup: {
        externalId: game.versionGroup.externalId,
        name: game.versionGroup.name,
      },
      generation: {
        externalId: game.versionGroup.generation.externalId,
        name: game.versionGroup.generation.name,
      },
    }));
  }
}
