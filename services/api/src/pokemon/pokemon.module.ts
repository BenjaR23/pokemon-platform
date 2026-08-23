import { Module } from '@nestjs/common';
import { PokemonController } from './pokemon.controller.js';
import { PokemonService } from './pokemon.service.js';
import { PokeApiClient } from './pokeapi/client.js';

@Module({
  controllers: [PokemonController],
  providers: [PokemonService, PokeApiClient],
})
export class PokemonModule {}
