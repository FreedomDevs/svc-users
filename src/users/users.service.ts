import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto';
import { errorResponse, successResponse, UserResponse } from './response';
import { Roles } from '@prisma/client';
import { ServiceResponse } from './users.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getUserOrThrow(resp: ServiceResponse<UserResponse>): UserResponse {
    if (!resp.data) {
      this.logger.warn(`User not found`);
      throw new NotFoundException(errorResponse('User not found!'));
    }
    return resp.data;
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ServiceResponse<UserResponse>> {
    if (!createUserDto.name || !createUserDto.password) {
      throw new BadRequestException(
        errorResponse('Name and password are required.'),
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

    return successResponse('User created successfully', new UserResponse(user));
  }

  async findOne(idOrName: string): Promise<ServiceResponse<UserResponse>> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ name: idOrName }, { id: idOrName }],
      },
    });

    if (!user) {
      this.logger.warn(`User not found: ${idOrName}`);
      throw new NotFoundException(errorResponse('User not found!'));
    }

    this.logger.log(`User fetched: ${user.id} (${user.name})`);
    return successResponse('User found successfully', new UserResponse(user));
  }

  async findAll(
    search?: string,
    page = 0,
    limit = 10,
  ): Promise<ServiceResponse<UserResponse[]>> {
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
    return successResponse(
      'Users fetched successfully',
      users.map((user) => new UserResponse(user)),
    );
  }

  async delete(idOrName: string): Promise<ServiceResponse<null>> {
    if (!idOrName) {
      throw new BadRequestException(errorResponse('ID is required!'));
    }

    const user = this.getUserOrThrow(await this.findOne(idOrName));

    this.logger.log(`User deleted: ${user.id} (${user.name})`);

    await this.prisma.user.delete({
      where: { id: user.id },
    });

    return successResponse('User deleted');
  }

  async hasRole(
    idOrName: string,
    rolesToCheck: Roles[],
  ): Promise<ServiceResponse<Record<string, boolean>>> {
    const user = this.getUserOrThrow(await this.findOne(idOrName));

    const result: Record<string, boolean> = {};
    rolesToCheck.forEach((role) => {
      result[role] = user.roles.includes(role);
    });

    return successResponse('Roles checked successfully', result);
  }

  async addRoles(
    idOrName: string,
    rolesToAdd: Roles[],
  ): Promise<ServiceResponse<UserResponse>> {
    const user = this.getUserOrThrow(await this.findOne(idOrName));

    const newRoles = rolesToAdd.filter((r) => !user.roles.includes(r));
    if (newRoles.length === 0) {
      throw new BadRequestException(
        errorResponse('User already has all these roles'),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { roles: [...user.roles, ...newRoles] },
    });

    return successResponse(
      'Roles update successfully',
      new UserResponse(updatedUser),
    );
  }

  async removeRoles(
    idOrName: string,
    rolesToRemove: Roles[],
  ): Promise<ServiceResponse<UserResponse>> {
    const user = this.getUserOrThrow(await this.findOne(idOrName));

    const remainingRoles = user.roles.filter((r) => !rolesToRemove.includes(r));
    if (remainingRoles.length === user.roles.length) {
      throw new BadRequestException('User does not have any of these roles');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { roles: remainingRoles },
    });

    return successResponse(
      'Roles update successfully',
      new UserResponse(updatedUser),
    );
  }
}
