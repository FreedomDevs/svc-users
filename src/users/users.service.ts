import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto';
import { UserResponse } from './response';
import { Roles, User } from '@prisma/client';
import { ApiSuccessResponse } from '@common/types/api-response.type';
import { UserCodes } from './users.codes';
import { ok, efail } from '@common/response/response.helper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getUserOrThrow(idOrName: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: idOrName }, { name: idOrName }] },
    });

    if (!user) {
      throw new NotFoundException(
        efail('User not found', UserCodes.USER_NOT_FOUND),
      );
    }

    return user;
  }

  private validatePagination(page: number, pageSize: number) {
    if (page < 1 || pageSize < 1) {
      throw new BadRequestException(
        efail(
          'Page and pageSize must be greater than 0',
          UserCodes.USER_INVALID_PAGINATION,
        ),
      );
    }
  }

  private filterValidNewRoles(userRoles: Roles[], roles: Roles[]): Roles[] {
    const validRoles = Object.values(Roles);
    return roles.filter(
      (r) => validRoles.includes(r) && !userRoles.includes(r),
    );
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    if (!createUserDto.name || !createUserDto.password) {
      throw new BadRequestException(
        efail('Name and password are required', UserCodes.USER_INVALID_DATA),
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { name: createUserDto.name },
    });

    if (existingUser) {
      throw new BadRequestException(
        efail('User with this name already exists', UserCodes.USER_DUPLICATE),
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

    return ok(
      new UserResponse(user),
      'User created successfully',
      UserCodes.USER_CREATED,
    );
  }

  async findOne(
    idOrName: string,
    includePassword: boolean,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const user = await this.getUserOrThrow(idOrName);

    return ok(
      new UserResponse(user, includePassword),
      'User fetched successfully',
      UserCodes.USER_FETCHED_OK,
    );
  }

  async findAll(
    search?: string,
    page = 1,
    pageSize = 10,
  ): Promise<ApiSuccessResponse<{ users: UserResponse[]; pagination: any }>> {
    this.validatePagination(page, pageSize);

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {},
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {},
      }),
    ]);

    return ok(
      {
        users: users.map((u) => new UserResponse(u)),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      'Users list fetched successfully',
      UserCodes.USER_LIST_FETCHED,
    );
  }

  async delete(idOrName: string): Promise<ApiSuccessResponse<null>> {
    if (!idOrName) {
      throw new BadRequestException(
        efail('ID is required', UserCodes.USER_INVALID_DATA),
      );
    }

    const user = await this.getUserOrThrow(idOrName);

    await this.prisma.user.delete({ where: { id: user.id } });
    this.logger.log(`User deleted: ${user.id} (${user.name})`);

    return ok(null, 'User deleted successfully', UserCodes.USER_DELETED);
  }

  async hasRole(
    idOrName: string,
    rolesToCheck: Roles[],
  ): Promise<ApiSuccessResponse<Record<string, boolean>>> {
    const user = await this.getUserOrThrow(idOrName);

    const result: Record<string, boolean> = {};
    rolesToCheck.forEach((role) => (result[role] = user.roles.includes(role)));

    return ok(result, 'Roles checked successfully', UserCodes.ROLES_UPDATED);
  }

  async addRoles(
    idOrName: string,
    rolesToAdd: Roles[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const user = await this.getUserOrThrow(idOrName);

    const newRoles = this.filterValidNewRoles(user.roles, rolesToAdd);
    if (!newRoles.length) {
      throw new BadRequestException(
        efail(
          'User already has all these roles or invalid roles provided',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { roles: [...user.roles, ...newRoles] },
    });

    this.logger.log(`Roles added for user ${user.id}: ${newRoles.join(', ')}`);

    return ok(
      new UserResponse(updatedUser),
      'Roles updated successfully',
      UserCodes.ROLES_UPDATED,
    );
  }

  async removeRoles(
    idOrName: string,
    rolesToRemove: Roles[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const user = await this.getUserOrThrow(idOrName);

    const remainingRoles = user.roles.filter((r) => !rolesToRemove.includes(r));

    if (remainingRoles.length === user.roles.length) {
      throw new BadRequestException(
        efail(
          'User does not have any of these roles',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    if (!remainingRoles.length) {
      throw new BadRequestException(
        efail('User must have at least one role', UserCodes.USER_INVALID_DATA),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { roles: remainingRoles },
    });

    this.logger.log(
      `Roles removed for user ${user.id}: ${rolesToRemove.join(', ')}`,
    );

    return ok(
      new UserResponse(updatedUser),
      'Roles updated successfully',
      UserCodes.ROLES_UPDATED,
    );
  }
}
