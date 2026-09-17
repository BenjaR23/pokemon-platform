import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FavoritesService } from './favorites.service';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, FavoritesService, ProfilesService],
})
export class UsersModule {}
