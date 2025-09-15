import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto';
import { UserResponse } from './response';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // TODO: вынести в отдельный файл
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

  // TODO: вынести в отдельный файл
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

    this.logger.log(`User created: ${user.id} (${user.name})`);

    return this.successResponse(
      'User created successfully',
      new UserResponse(user),
    );
  }

  async findOne(idOrName: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ name: idOrName }, { id: idOrName }],
      },
    });

    if (!user) {
      this.logger.warn(`User not found: ${idOrName}`);
      throw new NotFoundException(this.errorResponse('User not found!'));
    }

    this.logger.log(`User fetched: ${user.id} (${user.name})`);
    return this.successResponse(
      'User found successfully',
      new UserResponse(user),
    );
  }

  async findAll(search?: string, page = 0, limit = 10) {
    const users = await this.prisma.user.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {},
      skip: page * limit,
      take: limit,
    });

    if (users.length === 0) {
      this.logger.warn(
        `No users found${search ? ` for search: "${search}"` : ''}`,
      );
      throw new NotFoundException('No users found!');
    }

    this.logger.log(`Fetched ${users.length} users`);
    return this.successResponse(
      'Users fetched successfully',
      users.map((user) => new UserResponse(user)),
    );
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

    this.logger.log(`User deleted: ${user.id} (${user.name})`);

    await this.prisma.user.delete({
      where: { id: user.id },
    });

    return this.successResponse('User deleted');
  }

  //  TODO: изменение ролей, проверка на то что есть ли у пользователя роль
}
