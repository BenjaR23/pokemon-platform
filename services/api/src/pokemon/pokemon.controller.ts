import { Controller, Get } from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  findAll() {
    return this.pokemonService.findAll();
  }
}
