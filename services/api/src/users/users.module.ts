import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, FavoritesService],
})
export class UsersModule {}
