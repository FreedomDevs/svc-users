import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserPermissionsDto } from './dto';
import { UserResponse } from './response';
import {
  ApiPaginationSuccessResponse,
  ApiSuccessResponse,
  PaginationResponse,
  UsersListResponse,
} from '@common/types/api-response.type';
import { UserCodes } from './users.codes';
import { efail, ok } from '@common/response/response.helper';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EAuthType } from '@common/types';
import { PermissionsUtil } from '@common/utils';

type UserWithGroups = Prisma.UserGetPayload<{
  include: {
    groups: true;
  };
}>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private isUUID(value: string): boolean {
    return /^[0-9a-fA-F-]{36}$/.test(value);
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

  async findOnePerms(
    idOrName: string,
    serviceName: string | undefined,
  ): Promise<ApiSuccessResponse<string[]>> {
    if (!idOrName || !serviceName) {
      throw new BadRequestException(
        efail(
          'service name and user id is required',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    const resultPermissions: string[] = [];
    const resultSortedPerms: string[] = [];
    const user = await this.getUserOrThrow(idOrName);
    const getUserGroups = user.groups;

    for (const group of getUserGroups) {
      for (const perm of group.permissions) {
        resultPermissions.push(perm);
      }
    }

    for (const perm of user.permissions) {
      resultPermissions.push(perm);
    }

    for (const perm of resultPermissions) {
      const res: string[] = perm.split(':');
      if (!res[0] || !res[1]) continue;

      const service: string = res[0].toLocaleLowerCase().replace(/\s/g, '');
      const action: string = res[1].toLocaleLowerCase().replace(/\s/g, '');

      const isValidAction: boolean = /^[a-z][a-z0-9_-]*$/i.test(action);
      if (!isValidAction) continue;

      const isTrash: boolean = ['null', 'undefined', 'nan'].includes(action);
      if (isTrash) continue;

      if (service === serviceName.toLocaleLowerCase()) {
        let exists: boolean = false;

        for (const existing of resultSortedPerms) {
          if (existing.toLocaleLowerCase() === action) {
            exists = true;
            break;
          } else {
            exists = false;
          }
        }

        if (!exists) {
          if (action === '') continue;
          resultSortedPerms.push(res[1]);
        }
      }
    }

    return ok(
      resultSortedPerms,
      'User perms fetched successful',
      UserCodes.USER_FETCHED_OK,
    );
  }

  async findAll(
    search?: string,
    page = 1,
    pageSize = 10,
  ): Promise<
    ApiPaginationSuccessResponse<UsersListResponse, PaginationResponse>
  > {
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
      },
      'Users list fetched successfully',
      UserCodes.USER_LIST_FETCHED,
      {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
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

  async updatePermissions(idOrName: string, dto: UpdateUserPermissionsDto) {
    const user = await this.getUserOrThrow(idOrName);

    let groupConnect:
      | {
          set: { id: string }[];
        }
      | undefined;

    if (dto.groups) {
      const groups = await this.prisma.group.findMany({
        where: {
          id: {
            in: dto.groups,
          },
        },
      });

      if (groups.length !== dto.groups.length) {
        throw new NotFoundException(
          efail('One or more groups not found', UserCodes.USER_INVALID_DATA),
        );
      }

      groupConnect = {
        set: dto.groups.map((id) => ({ id })),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        permissions: PermissionsUtil.flatten(dto.permissions),
        ...(groupConnect ? { groups: groupConnect } : {}),
      },
      include: {
        groups: true,
      },
    });

    return ok(
      {
        groups: updated.groups.map((g) => g.name),
        permissions: PermissionsUtil.unflatten(updated.permissions),
      },
      'Permissions updated',
      UserCodes.PERMISSIONS_UPDATED,
    );
  }

  async updatePassword(
    idOrName: string,
    newPassword: string,
  ): Promise<ApiSuccessResponse<{ password: string }>> {
    if (!newPassword || !idOrName) {
      throw new BadRequestException(
        efail(
          'newPassword and user id is required',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    const user = await this.getUserOrThrow(idOrName);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword,
      },
    });

    return ok(
      {
        password: updated.password,
      },
      'Password updated',
      UserCodes.PASSWORD_UPDATED,
    );
  }

  async updateName(
    idOrName: string,
    newName: string,
  ): Promise<ApiSuccessResponse<{ name: string }>> {
    if (!newName || !idOrName) {
      throw new BadRequestException(
        efail('name and user id is required', UserCodes.USER_INVALID_DATA),
      );
    }

    const user = await this.getUserOrThrow(idOrName);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: newName,
      },
    });

    return ok(
      {
        name: updated.name,
      },
      'Name updated',
      UserCodes.NAME_UPDATED,
    );
  }
}
