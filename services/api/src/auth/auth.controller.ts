import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';

import type { CookieOptions, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

import type { AuthenticatedUser } from './types/authenticated-user.type';

const ACCESS_TOKEN_COOKIE = 'access_token';

function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body()
    dto: LoginDto,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const { accessToken, user } = await this.authService.login(dto);

    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...getAuthCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000,
    });

    return user;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentUser(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.authService.findCurrentUser(user.id);
  }

  @Post('logout')
  logout(
    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    response.clearCookie(ACCESS_TOKEN_COOKIE, getAuthCookieOptions());

    return {
      message: 'Logged out successfully',
    };
  }
}
