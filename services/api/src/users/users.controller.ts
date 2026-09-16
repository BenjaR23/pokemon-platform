import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { FavoritesService } from './favorites.service';
import { UsersService } from './users.service';
import { CreateCollectionProfileDto } from './dto/create-collection-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly favoritesService: FavoritesService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post('me/collection/:pokemonId')
  @UseGuards(AuthGuard)
  addToCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.usersService.addToCollection(user.id, pokemonId);
  }

  @Get('me/collection')
  @UseGuards(AuthGuard)
  getCollection(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getCollection(user.id);
  }

  @Delete('me/collection/:pokemonId')
  @UseGuards(AuthGuard)
  removeFromCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.usersService.removeFromCollection(user.id, pokemonId);
  }

  @Post('me/favorites/:pokemonId')
  @UseGuards(AuthGuard)
  addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.favoritesService.addFavorite(user.id, pokemonId);
  }

  @Get('me/favorites')
  @UseGuards(AuthGuard)
  getFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.getFavorites(user.id);
  }

  @Delete('me/favorites/:pokemonId')
  @UseGuards(AuthGuard)
  removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.favoritesService.removeFavorite(user.id, pokemonId);
  }

  @Post('me/profiles')
  @UseGuards(AuthGuard)
  createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectionProfileDto,
  ) {
    return this.profilesService.createProfile(user.id, dto);
  }

  @Get('me/profiles')
  @UseGuards(AuthGuard)
  getProfiles(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.getProfiles(user.id);
  }
}
