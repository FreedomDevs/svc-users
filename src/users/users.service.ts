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

  private successResponse<T>(data: T, message = 'Success') {
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

    return this.successResponse(user, 'User created successfully');
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

    return this.successResponse(user, 'User found successfully');
  }
}
