import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  // Sincroniza una especie individual desde PokeAPI.
  @Get(':id')
  async getPokemon(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.syncSpecies(id);
  }
}
