import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { Request } from 'express';

@Injectable()
export class SyncApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const expectedApiKey =
      this.configService.getOrThrow<string>('SYNC_API_KEY');

    const receivedApiKey = request.header('x-sync-key');

    if (!receivedApiKey || receivedApiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid synchronization API key');
    }

    return true;
  }
}
