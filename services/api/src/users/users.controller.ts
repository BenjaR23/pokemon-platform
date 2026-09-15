import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Delete,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
