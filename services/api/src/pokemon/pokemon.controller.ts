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
import { Query } from '@nestjs/common';
import { GetPokemonQueryDto } from './dto/get-pokemon-query.dto.js';

@Controller('pokemon')
export class PokemonController {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly pokemonSyncService: PokemonSyncService,
  ) {}

  @Get('types')
  findTypes() {
    return this.pokemonService.findTypes();
  }

  @Get('generations')
  findGenerations() {
    return this.pokemonService.findGenerations();
  }

  // Sincroniza una especie individual desde PokeAPI.
  @Get(':id')
  async getPokemon(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findOne(id);
  }

  @Get(':id/variants/:variantId')
  findOneVariant(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.pokemonService.findOne(id, variantId);
  }

  @Get()
  findAll(@Query() query: GetPokemonQueryDto) {
    return this.pokemonService.findAll(
      query.page,
      query.pageSize,
      query.search,
      query.type,
      query.generation,
    );
  }

  @Get(':id/encounters')
  findEncounters(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findEncounters(id);
  }

  @Get(':id/variants/:variantId/encounters')
  findVariantEncounters(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.pokemonService.findEncounters(id, variantId);
  }

  /**
   * Ejecuta manualmente una sincronizacion de un rango de especies.
   *
   * Ejemplo:
   * POST /pokemon/sync
   *
   * {
   *  "startId": 1,
   *  "endId": 3
   * }
   */
  @Post('sync')
  syncRange(@Body() body: SyncPokemonRangeDto) {
    return this.pokemonSyncService.syncRange(body.startId, body.endId);
  }
}
