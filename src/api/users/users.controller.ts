import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { CreateUserDto } from './dto';
import { UserResponse } from './response';

import { ApiSuccessResponse } from '@common/types/api-response.type';

import { UpdatePermissionsDto } from './dto';
import { AssignGroupsDto } from '@/api/groups/dto';

type PaginationResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type UsersListResponse = {
  users: UserResponse[];
  pagination: PaginationResponse;
};

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /* Создание пользователя */

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(
      `POST /users -> ${JSON.stringify({
        name: createUserDto.name,
      })}`,
    );

    return this.usersService.create(createUserDto);
  }

  /* Получение одного пользователя */

  @Get(':idOrName')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('idOrName') idOrName: string,
    @Query('psw') psw?: string,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const includePassword = psw === 'true';

    this.logger.log(
      `GET /users/${idOrName} -> includePassword=${includePassword}`,
    );

    return this.usersService.findOne(idOrName, includePassword);
  }

  /* Получение списка пользователей */

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ApiSuccessResponse<UsersListResponse>> {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    this.logger.log(
      `GET /users -> search=${search ?? '-'} page=${pageNumber} limit=${limitNumber}`,
    );

    return this.usersService.findAll(search, pageNumber, limitNumber);
  }

  /* Удаление пользователя */

  @Delete(':idOrName')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('idOrName') idOrName: string,
  ): Promise<ApiSuccessResponse<null>> {
    this.logger.log(`DELETE /users/${idOrName}`);

    return this.usersService.delete(idOrName);
  }

  /* Добавить permissions */

  @Put(':idOrName/permissions/add')
  @HttpCode(HttpStatus.OK)
  async addPermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdatePermissionsDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(`PUT /users/${idOrName}/permissions/add`);

    return this.usersService.addPermissions(idOrName, dto.permissions);
  }

  /* Удалить permissions */

  @Put(':idOrName/permissions/remove')
  @HttpCode(HttpStatus.OK)
  async removePermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdatePermissionsDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(`PUT /users/${idOrName}/permissions/remove`);

    return this.usersService.removePermissions(idOrName, dto.permissions);
  }

  /* Назначить группы */

  @Put(':idOrName/groups/assign')
  @HttpCode(HttpStatus.OK)
  async assignGroups(
    @Param('idOrName') idOrName: string,
    @Body() dto: AssignGroupsDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(`PUT /users/${idOrName}/groups/assign`);

    return this.usersService.assignGroups(idOrName, dto.groupIds);
  }

  /* Удалить группы */

  @Put(':idOrName/groups/remove')
  @HttpCode(HttpStatus.OK)
  async removeGroups(
    @Param('idOrName') idOrName: string,
    @Body() dto: AssignGroupsDto,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(`PUT /users/${idOrName}/groups/remove`);

    return this.usersService.removeGroups(idOrName, dto.groupIds);
  }
}
