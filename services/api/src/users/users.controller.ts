import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Body,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { FavoritesService } from './favorites.service';
import { UsersService } from './users.service';
import { CreateCollectionProfileDto } from './dto/create-collection-profile.dto';
import { ProfilesService } from './profiles.service';
import { UpdateCollectionProfileDto } from './dto/update-collection-profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly favoritesService: FavoritesService,
    private readonly profilesService: ProfilesService,
  ) {}

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

  @Get('me/profiles/:profileId')
  @UseGuards(AuthGuard)
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.profilesService.getProfile(user.id, profileId);
  }

  @Patch('me/profiles/:profileId')
  @UseGuards(AuthGuard)
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
    @Body() dto: UpdateCollectionProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, profileId, dto);
  }

  @Delete('me/profiles/:profileId')
  @UseGuards(AuthGuard)
  deleteProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.profilesService.deleteProfile(user.id, profileId);
  }

  @Post('me/profiles/:profileId/collection/:pokemonId')
  @UseGuards(AuthGuard)
  addToProfileCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.usersService.addToCollection(user.id, profileId, pokemonId);
  }

  @Get('me/profiles/:profileId/collection')
  @UseGuards(AuthGuard)
  getProfileCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.usersService.getCollection(user.id, profileId);
  }

  @Delete('me/profiles/:profileId/collection/:pokemonId')
  @UseGuards(AuthGuard)
  removeFromProfileCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.usersService.removeFromCollection(
      user.id,
      profileId,
      pokemonId,
    );
  }

  @Post('me/profiles/:profileId/favorites/:pokemonId')
  @UseGuards(AuthGuard)
  addProfileFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.favoritesService.addFavorite(user.id, profileId, pokemonId);
  }

  @Get('me/profiles/:profileId/favorites')
  @UseGuards(AuthGuard)
  getProfileFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
  ) {
    return this.favoritesService.getFavorites(user.id, profileId);
  }

  @Delete('me/profiles/:profileId/favorites/:pokemonId')
  @UseGuards(AuthGuard)
  removeProfileFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('profileId') profileId: string,
    @Param('pokemonId', ParseIntPipe)
    pokemonId: number,
  ) {
    return this.favoritesService.removeFavorite(user.id, profileId, pokemonId);
  }
}
