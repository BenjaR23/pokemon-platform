import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

import { AuthGuard } from './auth.guard';

interface AuthenticatedRequest {
  headers: {
    cookie?: string;
  };
  user?: {
    id: string;
  };
}

describe('AuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };

  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();

    guard = new AuthGuard(jwtService as never);
  });

  function createExecutionContext(cookie?: string): ExecutionContext {
    const request = {
      headers: {
        cookie,
      },
    } as AuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('allows requests with a valid access token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
    });

    const context = createExecutionContext('access_token=valid-token');

    const result = await guard.canActivate(context);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');

    expect(result).toBe(true);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    expect(request.user).toEqual({
      id: 'user-id',
    });
  });

  it('throws when the access token cookie is missing', async () => {
    const context = createExecutionContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws when the access token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const context = createExecutionContext('access_token=invalid-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('extracts the access token among multiple cookies', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
    });

    const context = createExecutionContext(
      'theme=dark; access_token=valid-token; language=es',
    );

    await guard.canActivate(context);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
  });
});
