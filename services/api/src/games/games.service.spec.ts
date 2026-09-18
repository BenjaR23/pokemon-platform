import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { GamesService } from './games.service';

describe('GamesService', () => {
  let service: GamesService;

  const prisma = {
    game: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(GamesService);
  });

  it('returns games with generation and version group', async () => {
    prisma.game.findMany.mockResolvedValue([
      {
        externalId: 10,
        name: 'firered',
        versionGroup: {
          externalId: 7,
          name: 'firered-leafgreen',
          generation: {
            externalId: 3,
            name: 'generation-iii',
          },
        },
      },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      {
        externalId: 10,
        name: 'firered',
        versionGroup: {
          externalId: 7,
          name: 'firered-leafgreen',
        },
        generation: {
          externalId: 3,
          name: 'generation-iii',
        },
      },
    ]);
  });
});
