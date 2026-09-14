import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const bcryptHashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
  const bcryptCompareMock = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(prisma as never, jwtService as never);
  });

  it('registers a new user with a hashed password', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    prisma.user.create.mockResolvedValue({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      createdAt: new Date('2026-09-14T12:00:00.000Z'),
    });

    bcryptHashMock.mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      email: 'benja@example.com',
      username: 'benja',
      password: 'testpassword123',
    });

    expect(bcryptHashMock).toHaveBeenCalledWith('testpassword123', 12);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'benja@example.com',
        username: 'benja',
        passwordHash: 'hashed-password',
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    expect(result).toEqual({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      createdAt: new Date('2026-09-14T12:00:00.000Z'),
    });
  });

  it('throws when the email already exists', async () => {
    prisma.user.findFirst.mockResolvedValue({
      email: 'benja@example.com',
      username: 'other-user',
    });

    await expect(
      service.register({
        email: 'benja@example.com',
        username: 'benja',
        password: 'testpassword123',
      }),
    ).rejects.toThrow(
      new ConflictException('A user with this email already exists'),
    );

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('throws when the username already exists', async () => {
    prisma.user.findFirst.mockResolvedValue({
      email: 'other@example.com',
      username: 'benja',
    });

    await expect(
      service.register({
        email: 'benja@example.com',
        username: 'benja',
        password: 'testpassword123',
      }),
    ).rejects.toThrow(
      new ConflictException('A user with this username already exists'),
    );

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('does not return the password hash', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    prisma.user.create.mockResolvedValue({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      createdAt: new Date(),
    });

    bcryptHashMock.mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      email: 'benja@example.com',
      username: 'benja',
      password: 'testpassword123',
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('logs in a user with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      passwordHash: 'stored-password-hash',
    });

    bcryptCompareMock.mockResolvedValue(true as never);
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await service.login({
      email: 'benja@example.com',
      password: 'testpassword123',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'benja@example.com',
      },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });

    expect(bcryptCompareMock).toHaveBeenCalledWith(
      'testpassword123',
      'stored-password-hash',
    );

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-id',
        email: 'benja@example.com',
        username: 'benja',
      },
    });
  });

  it('throws when the password is incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      passwordHash: 'stored-password-hash',
    });

    bcryptCompareMock.mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'benja@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow('Invalid email or password');

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws when the email does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'testpassword123',
      }),
    ).rejects.toThrow('Invalid email or password');

    expect(bcryptCompareMock).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('returns the current authenticated user', async () => {
    const createdAt = new Date('2026-09-14T12:00:00.000Z');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      createdAt,
    });

    const result = await service.findCurrentUser('user-id');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'user-id',
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    expect(result).toEqual({
      id: 'user-id',
      email: 'benja@example.com',
      username: 'benja',
      createdAt,
    });
  });

  it('throws when the authenticated user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.findCurrentUser('missing-user-id'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
