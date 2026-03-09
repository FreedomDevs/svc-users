import { Controller, Logger, BadRequestException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from '../users.service';
import { Roles } from '@prisma/client';
import { UserResponse } from '../response';
import { efail } from '@common/response/response.helper';
import { UserCodes } from '../users.codes';

@Controller()
export class UsersGrpcController {
  private readonly logger = new Logger(UsersGrpcController.name);

  constructor(private readonly usersService: UsersService) {}

  /* Создание пользователя */
  @GrpcMethod('UsersService', 'CreateUser')
  async createUser(data: { name: string; password: string }) {
    if (!data?.name || !data?.password) {
      this.logger.warn('CreateUser called with invalid data', data);
      throw new BadRequestException(
        efail('Name and password are required', UserCodes.USER_INVALID_DATA),
      );
    }

    const res = await this.usersService.create(data);
    const user: UserResponse = res.data;

    return {
      id: user.id,
      name: user.name,
      roles: user.roles.map((r) => r.toString()),
    };
  }

  /* Получение пользователя */
  @GrpcMethod('UsersService', 'GetUser')
  async getUser(data: { idOrName: string; includePassword: boolean }) {
    if (!data?.idOrName) {
      this.logger.warn('GetUser called with empty idOrName');
      throw new BadRequestException(
        efail('idOrName must be provided', UserCodes.USER_INVALID_DATA),
      );
    }

    const res = await this.usersService.findOne(
      data.idOrName,
      data.includePassword,
    );
    const user: UserResponse = res.data;

    return {
      id: user.id,
      name: user.name,
      roles: user.roles.map((r) => r.toString()),
    };
  }

  /* Удаление пользователя */
  @GrpcMethod('UsersService', 'DeleteUser')
  async deleteUser(data: { idOrName: string }) {
    if (!data?.idOrName) {
      this.logger.warn('DeleteUser called with empty idOrName');
      throw new BadRequestException(
        efail('idOrName must be provided', UserCodes.USER_INVALID_DATA),
      );
    }

    await this.usersService.delete(data.idOrName);

    return { message: 'User deleted successfully' };
  }

  /* Добавление ролей */
  @GrpcMethod('UsersService', 'AddRoles')
  async addRoles(data: { idOrName: string; roles: Roles[] }) {
    if (!data?.idOrName || !Array.isArray(data.roles) || !data.roles.length) {
      this.logger.warn('AddRoles called with invalid data', data);
      throw new BadRequestException(
        efail(
          'idOrName and roles must be provided',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    const res = await this.usersService.addRoles(data.idOrName, data.roles);
    const user: UserResponse = res.data;

    return {
      id: user.id,
      name: user.name,
      roles: user.roles.map((r) => r.toString()),
    };
  }

  /* Удаление ролей */
  @GrpcMethod('UsersService', 'RemoveRoles')
  async removeRoles(data: { idOrName: string; roles: Roles[] }) {
    if (!data?.idOrName || !Array.isArray(data.roles) || !data.roles.length) {
      this.logger.warn('RemoveRoles called with invalid data', data);
      throw new BadRequestException(
        efail(
          'idOrName and roles must be provided',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    const res = await this.usersService.removeRoles(data.idOrName, data.roles);
    const user: UserResponse = res.data;

    return {
      id: user.id,
      name: user.name,
      roles: user.roles.map((r) => r.toString()),
    };
  }

  /* Проверка ролей */
  @GrpcMethod('UsersService', 'HasRoles')
  async hasRoles(data: { idOrName: string; roles: Roles[] }) {
    if (!data?.idOrName || !Array.isArray(data.roles) || !data.roles.length) {
      this.logger.warn('HasRoles called with invalid data', data);
      throw new BadRequestException(
        efail(
          'idOrName and roles must be provided',
          UserCodes.USER_INVALID_DATA,
        ),
      );
    }

    const res = await this.usersService.hasRole(data.idOrName, data.roles);
    return { result: res.data };
  }

  /* Список пользователей */
  @GrpcMethod('UsersService', 'ListUsers')
  async listUsers(data: { search?: string; page?: number; pageSize?: number }) {
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 10;

    if (page < 1 || pageSize < 1) {
      this.logger.warn('ListUsers called with invalid pagination', data);
      throw new BadRequestException(
        efail(
          'page and pageSize must be greater than 0',
          UserCodes.USER_INVALID_PAGINATION,
        ),
      );
    }

    const res = await this.usersService.findAll(data?.search, page, pageSize);

    const users: { id: string; name: string; roles: string[] }[] =
      res.data.users.map((user) => ({
        id: user.id,
        name: user.name,
        roles: user.roles.map((r) => r.toString()),
      }));

    const {
      page: pageNum,
      pageSize: pageSizeNum,
      total: totalNum,
      totalPages: totalPagesNum,
    } = res.data.pagination as {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };

    return {
      users,
      page: pageNum,
      pageSize: pageSizeNum,
      total: totalNum,
      totalPages: totalPagesNum,
    };
  }
}
