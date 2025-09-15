import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private successResponse<T>(message = 'Success', data?: T) {
    if (data === undefined || data === null) {
      return {
        success: true,
        message,
      };
    }

    return {
      success: true,
      message,
      data,
    };
  }

  private errorResponse(message: string) {
    return {
      success: false,
      message,
    };
  }

  async create(createUserDto: CreateUserDto) {
    if (!createUserDto.name || !createUserDto.password) {
      throw new BadRequestException(
        this.errorResponse('Name and password are required.'),
      );
    }

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        password: createUserDto.password,
        roles: ['USER'],
      },
    });

    return this.successResponse('User created successfully', user);
  }

  async findOne(idOrName: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ name: idOrName }, { id: idOrName }],
      },
    });

    if (!user) {
      throw new NotFoundException(this.errorResponse('User not found!'));
    }

    return this.successResponse('User found successfully', user);
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async delete(idOrName: string) {
    if (!idOrName) {
      throw new BadRequestException(this.errorResponse('ID is required!'));
    }

    const response = await this.findOne(idOrName);
    const user = response.data;

    if (!user) {
      throw new NotFoundException(this.errorResponse('User not found!'));
    }

    await this.prisma.user.delete({
      where: { id: user.id },
    });

    return this.successResponse('User deleted');
  }
}
