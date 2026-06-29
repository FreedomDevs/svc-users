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
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserPermissionsDto } from './dto';
import { UserResponse } from './response';
import { efail } from '@common/response/response.helper';
import { UserCodes } from '@/api/users/users.codes';
import {
  ApiPaginationSuccessResponse,
  ApiSuccessResponse,
  EAuthType,
  PaginationResponse,
  UsersListResponse,
} from '@common/types';

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
    @Headers('eauth-type') eauth_type_raw?: string,
    @Headers('eauth-user-roles') eauth_roles?: string,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const includePassword = psw === 'true';

    const roles: string[] = eauth_roles?.trim().split(/\s+/) ?? [];

    const eauth_type: EAuthType | null =
      eauth_type_raw === undefined ? null : (eauth_type_raw as EAuthType);

    this.logger.log(
      `GET /users/${idOrName} -> includePassword=${includePassword}`,
    );

    return this.usersService.findOne(
      idOrName,
      includePassword,
      roles,
      eauth_type,
    );
  }

  /* Получить все права пользователя по serviceName */

  @Get(':idOrName/permissions')
  @HttpCode(HttpStatus.OK)
  async findOnePerms(
    @Param('idOrName') idOrName: string,
    @Query('servicename') serviceName?: string,
  ): Promise<ApiSuccessResponse<string[]>> {
    this.logger.log(`GET /users/${idOrName} -> servicename=${serviceName}`);
    return this.usersService.findOnePerms(idOrName, serviceName);
  }

  /* Me */

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  async me(
    @Headers('eauth-type') eauth_type: EAuthType,
    @Headers('eauth-user-id') userId: string,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    if (eauth_type != EAuthType.user) {
      throw new BadRequestException(
        efail('Only user', UserCodes.USER_INVALID_DATA),
      );
    }

    this.logger.log(`GET /users/me -> ${userId}`);
    return this.usersService.findOne(userId);
  }

  /* Получение списка пользователей */

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<
    ApiPaginationSuccessResponse<UsersListResponse, PaginationResponse>
  > {
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

  /* Обновление прав и групп*/

  @Put(':idOrName/permissions')
  @HttpCode(HttpStatus.OK)
  async updatePermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdateUserPermissionsDto,
  ) {
    this.logger.log(`PUT /users/${idOrName}/permissions`);

    return this.usersService.updatePermissions(idOrName, dto);
  }
}
