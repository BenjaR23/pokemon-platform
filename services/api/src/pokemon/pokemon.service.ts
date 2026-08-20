import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PokemonService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pokemonSpecies.findMany({
      orderBy: {
        externalId: 'asc',
      },
    });
  }
}
