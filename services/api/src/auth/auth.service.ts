import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: dto.email,
          },
          {
            username: dto.username,
          },
        ],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('A user with this email already exists');
      }

      throw new ConflictException('A user with this username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
  }
}
