import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service.js';
import { PokemonSyncService } from './pokemon-sync.service.js';
import { SyncPokemonRangeDto } from './dto/sync-pokemon-range.dto.js';

@Controller('pokemon')
export class PokemonController {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly pokemonSyncService: PokemonSyncService,
  ) {}

  // Sincroniza una especie individual desde PokeAPI.
  @Get(':id')
  async getPokemon(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.syncSpecies(id);
  }

  /**
   * Ejecuta manualmente una sincronizacion de un rango de especies.
   *
   * Ejemplo:
   * POST /pokemon/sync
   *
   * {
   *  "starId": 1,
   *  "endId": 3
   * }
   */
  @Post('sync')
  syncRange(@Body() body: SyncPokemonRangeDto) {
    return this.pokemonSyncService.syncRange(body.startId, body.endId);
  }
}
