import { Module } from '@nestjs/common';

import { PokemonController } from './pokemon.controller.js';
import { PokemonService } from './pokemon.service.js';
import { PokeApiClient } from './pokeapi/client.js';
import { ReferenceDataService } from './reference-data.service.js';
import { PokemonSyncService } from './pokemon-sync.service.js';
import { EvolutionService } from './evolution.service.js';
import { EncounterService } from './encounter.service.js';

@Module({
  controllers: [PokemonController],

  providers: [
    PokemonService,
    PokeApiClient,
    ReferenceDataService,
    PokemonSyncService,
    EvolutionService,
    EncounterService,
  ],

  exports: [PokemonService],
})
export class PokemonModule {}
