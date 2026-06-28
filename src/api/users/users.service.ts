import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto';
import { UserResponse } from './response';
import { ApiSuccessResponse } from '@common/types/api-response.type';
import { UserCodes } from './users.codes';
import { efail, ok } from '@common/response/response.helper';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EAuthType } from '@common/types';

type UserWithGroups = Prisma.UserGetPayload<{
  include: {
    groups: true;
  };
}>;

type UsersListResponse = {
  users: UserResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private isUUID(value: string): boolean {
    return /^[0-9a-fA-F-]{36}$/.test(value);
  }

  private validateArray(values: readonly unknown[], field: string): void {
    if (!Array.isArray(values) || values.length === 0) {
      throw new BadRequestException(
        efail(
          `${field} must be a non-empty array`,
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }
  }

  private validatePagination(page: number, pageSize: number): void {
    if (page < 1 || pageSize < 1) {
      throw new BadRequestException(
        efail(
          'Page and pageSize must be greater than 0',
          UserCodes.USER_INVALID_PAGINATION,
        ),
      );
    }
  }

  private async getUserOrThrow(idOrName: string): Promise<UserWithGroups> {
    if (!idOrName.trim()) {
      throw new BadRequestException(
        efail('User identifier is required', UserCodes.USER_INVALID_DATA),
      );
    }

    const user = await this.prisma.user.findFirst({
      where: this.isUUID(idOrName) ? { id: idOrName } : { name: idOrName },
      include: {
        groups: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        efail('User not found', UserCodes.USER_NOT_FOUND),
      );
    }

    return user;
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const { name, password } = createUserDto;

    if (!name.trim() || !password.trim()) {
      throw new BadRequestException(
        efail('Name and password are required', UserCodes.USER_INVALID_DATA),
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        efail('User with this name already exists', UserCodes.USER_DUPLICATE),
      );
    }

    const user = await this.prisma.user.create({
      data: {
        name: name.trim(),
        password,
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
    includePassword = false,
    eauth_user_roles: string[] | null = null,
    eauth_type: EAuthType | null = EAuthType.user,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const user = await this.getUserOrThrow(idOrName);

    if (includePassword) {
      if (eauth_type !== null) {
        if (eauth_type === EAuthType.user) {
          let hasPermission: boolean = false;

          for (const role of eauth_user_roles ?? []) {
            if (role === 'read_password') {
              hasPermission = true;
            }
          }

          if (!hasPermission) {
            throw new ForbiddenException(
              efail(
                'You do not have permission to read password',
                UserCodes.USER_FORBIDDEN,
              ),
            );
          }
        }
      }
    }

    try {
      const response = new UserResponse(user, includePassword);

      return ok(
        response,
        'User fetched successfully',
        UserCodes.USER_FETCHED_OK,
      );
    } catch (error: unknown) {
      this.logger.error('Failed to get user', error);

      throw new InternalServerErrorException(
        efail('Failed to get user', UserCodes.USER_INTERNAL_ERROR),
      );
    }
  }

  async findAll(
    search?: string,
    page = 1,
    pageSize = 10,
  ): Promise<ApiSuccessResponse<UsersListResponse>> {
    this.validatePagination(page, pageSize);

    const where: Prisma.UserWhereInput = search?.trim()
      ? {
          name: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        }
      : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          groups: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return ok(
      {
        users: users.map((user) => new UserResponse(user)),
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
    const user = await this.getUserOrThrow(idOrName);

    await this.prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    this.logger.log(`User deleted: ${user.id} (${user.name})`);

    return ok(null, 'User deleted successfully', UserCodes.USER_DELETED);
  }

  async addPermissions(
    idOrName: string,
    permissions: string[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.validateArray(permissions, 'permissions');

    const user = await this.getUserOrThrow(idOrName);

    const uniquePermissions = [...new Set(permissions)];

    const newPermissions = uniquePermissions.filter(
      (permission) => !user.permissions.includes(permission),
    );

    if (!newPermissions.length) {
      throw new BadRequestException(
        efail('Permissions already assigned', UserCodes.PERMISSIONS_UPDATED),
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        permissions: [...user.permissions, ...newPermissions],
      },
      include: {
        groups: true,
      },
    });

    return ok(
      new UserResponse(updated),
      'Permissions added',
      UserCodes.PERMISSIONS_UPDATED,
    );
  }

  async removePermissions(
    idOrName: string,
    permissions: string[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.validateArray(permissions, 'permissions');

    const user = await this.getUserOrThrow(idOrName);

    const removablePermissions = permissions.filter((permission) =>
      user.permissions.includes(permission),
    );

    if (!removablePermissions.length) {
      throw new BadRequestException(
        efail('Permissions not found', UserCodes.PERMISSIONS_UPDATED),
      );
    }

    const updated = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        permissions: user.permissions.filter(
          (permission) => !removablePermissions.includes(permission),
        ),
      },
      include: {
        groups: true,
      },
    });

    return ok(
      new UserResponse(updated),
      'Permissions removed',
      UserCodes.PERMISSIONS_UPDATED,
    );
  }

  async assignGroups(
    idOrName: string,
    groupIds: string[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.validateArray(groupIds, 'groupIds');

    const user = await this.getUserOrThrow(idOrName);

    const uniqueGroupIds = [...new Set(groupIds)];

    const existingGroups = await this.prisma.group.findMany({
      where: {
        id: {
          in: uniqueGroupIds,
        },
      },
    });

    if (existingGroups.length !== uniqueGroupIds.length) {
      throw new NotFoundException(
        efail('One or more groups not found', UserCodes.USER_INVALID_DATA),
      );
    }

    const assignedGroupIds = user.groups.map((group) => group.id);

    const groupsToAssign = uniqueGroupIds.filter(
      (groupId) => !assignedGroupIds.includes(groupId),
    );

    if (!groupsToAssign.length) {
      throw new BadRequestException(
        efail('Groups already assigned', UserCodes.GROUPS_UPDATED),
      );
    }

    const updated = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        groups: {
          connect: groupsToAssign.map((id) => ({ id })),
        },
      },
      include: {
        groups: true,
      },
    });

    return ok(
      new UserResponse(updated),
      'Groups assigned',
      UserCodes.GROUPS_UPDATED,
    );
  }

  async removeGroups(
    idOrName: string,
    groupIds: string[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.validateArray(groupIds, 'groupIds');

    const user = await this.getUserOrThrow(idOrName);

    const assignedGroupIds = user.groups.map((group) => group.id);

    const groupsToRemove = groupIds.filter((groupId) =>
      assignedGroupIds.includes(groupId),
    );

    if (!groupsToRemove.length) {
      throw new BadRequestException(
        efail('Groups are not assigned to this user', UserCodes.GROUPS_UPDATED),
      );
    }

    const updated = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        groups: {
          disconnect: groupsToRemove.map((id) => ({ id })),
        },
      },
      include: {
        groups: true,
      },
    });

    return ok(
      new UserResponse(updated),
      'Groups removed',
      UserCodes.GROUPS_UPDATED,
    );
  }
}
