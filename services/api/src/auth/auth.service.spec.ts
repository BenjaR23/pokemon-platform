import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const bcryptHashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never);
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
});
