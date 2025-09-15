import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    if (!createUserDto.name || !createUserDto.password) {
      throw new BadRequestException({
        success: false,
        message: 'Name and password are required.',
      });
    }
    const user = this.prisma.user.create({
      data: {
        name: createUserDto.name,
        password: createUserDto.password,
        roles: ['USER'],
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }
}
