import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateUserDto } from './dto';
import { UserResponse } from './response';
import { Roles } from '@prisma/client';
import { ApiSuccessResponse } from '../common/types/api-response.type';
import { UserCodes } from './users.codes';
import { ok } from '../common/response/response.helper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getUserOrThrow(resp: ApiSuccessResponse<UserResponse>): UserResponse {
    if (!resp?.data) {
      throw new NotFoundException(
        fail({ message: 'User not found', code: UserCodes.USER_NOT_FOUND }),
      );
    }
    return resp.data;
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    if (!createUserDto.name || !createUserDto.password) {
      throw new BadRequestException(
        fail({
          message: 'Name and password are required',
          code: UserCodes.USER_INVALID_DATA,
        }),
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

  async findOne(idOrName: string): Promise<ApiSuccessResponse<UserResponse>> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
    });

    if (!user) {
      throw new NotFoundException(
        fail({ message: 'User not found', code: UserCodes.USER_NOT_FOUND }),
      );
    }

    return ok(
      new UserResponse(user),
      'User fetched successfully',
      UserCodes.USER_FETCHED_OK,
    );
  }

  async findAll(
    search?: string,
    page = 1,
    pageSize = 10,
  ): Promise<ApiSuccessResponse<{ users: UserResponse[]; pagination: any }>> {
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
        fail({ message: 'ID is required', code: UserCodes.USER_INVALID_DATA }),
      );
    }

    const user = this.getUserOrThrow(await this.findOne(idOrName));

    await this.prisma.user.delete({ where: { id: user.id } });

    this.logger.log(`User deleted: ${user.id} (${user.name})`);

    return ok(null, 'User deleted successfully', UserCodes.USER_DELETED);
  }

  async hasRole(
    idOrName: string,
    rolesToCheck: Roles[],
  ): Promise<ApiSuccessResponse<Record<string, boolean>>> {
    const user = this.getUserOrThrow(await this.findOne(idOrName));

    const result: Record<string, boolean> = {};
    rolesToCheck.forEach((role) => {
      result[role] = user.roles.includes(role);
    });

    return ok(result, 'Roles checked successfully', UserCodes.ROLES_UPDATED);
  }

  async addRoles(
    idOrName: string,
    rolesToAdd: Roles[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const user = this.getUserOrThrow(await this.findOne(idOrName));

    const newRoles = rolesToAdd.filter((r) => !user.roles.includes(r));
    if (newRoles.length === 0) {
      throw new BadRequestException(
        fail({
          message: 'User already has all these roles',
          code: UserCodes.USER_INVALID_DATA,
        }),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { roles: [...user.roles, ...newRoles] },
    });

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
    const user = this.getUserOrThrow(await this.findOne(idOrName));

    const remainingRoles = user.roles.filter((r) => !rolesToRemove.includes(r));
    if (remainingRoles.length === user.roles.length) {
      throw new BadRequestException(
        fail({
          message: 'User does not have any of these roles',
          code: UserCodes.USER_INVALID_DATA,
        }),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { roles: remainingRoles },
    });

    return ok(
      new UserResponse(updatedUser),
      'Roles updated successfully',
      UserCodes.ROLES_UPDATED,
    );
  }
}
