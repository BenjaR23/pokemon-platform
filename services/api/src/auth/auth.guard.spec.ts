import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };

  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(jwtService as never);
  });

  function createExecutionContext(request: Partial<Request>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('throws when the access token cookie is missing', async () => {
    const context = createExecutionContext({
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws when the access token is invalid', async () => {
    const request = {
      headers: {
        cookie: 'access_token=invalid-token',
      },
    };

    const context = createExecutionContext(request);

    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token');
  });

  it('adds the authenticated user to the request', async () => {
    const request = {
      headers: {
        cookie: 'access_token=valid-token',
      },
    };

    const context = createExecutionContext(request);

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');

    expect(request).toHaveProperty('user', {
      id: 'user-id',
    });
  });
});
