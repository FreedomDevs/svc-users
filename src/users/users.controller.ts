import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Logger,
  Query,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto';
import { ApiSuccessResponse } from '@common/types/api-response.type';
import { UserResponse } from './response';
import { Roles } from '@prisma/client';

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
    this.logger.log(`POST /users - body: ${JSON.stringify(createUserDto)}`);
    return this.usersService.create(createUserDto);
  }

  /* Для поиска/получения */

  @Get(':idOrName')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('idOrName') idOrName: string,
    @Query('psw') psw?: string,
  ): Promise<ApiSuccessResponse<UserResponse>> {
    const includePassword: boolean = psw === 'true';
    this.logger.log(
      `GET /users/${idOrName} - includePassword: ${includePassword}`,
    );

    return this.usersService.findOne(idOrName, includePassword);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ApiSuccessResponse<{ users: UserResponse[]; pagination: any }>> {
    const pageNum: number = parseInt(page, 10);
    const limitNum: number = parseInt(limit, 10);
    this.logger.log(
      `GET /users - search: ${search}, page: ${pageNum}, limit: ${limitNum}`,
    );
    return this.usersService.findAll(search, pageNum, limitNum);
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

  /* Для ролей */

  @Get(':idOrName/roles')
  @HttpCode(HttpStatus.OK)
  async hasRoles(
    @Param('idOrName') idOrName: string,
    @Query('roles') roles: string,
  ): Promise<ApiSuccessResponse<Record<string, boolean>>> {
    const rolesArray: Roles[] = roles?.split(',') as Roles[];
    this.logger.log(
      `GET /users/${idOrName}/roles - roles: ${JSON.stringify(rolesArray)}`,
    );
    return this.usersService.hasRole(idOrName, rolesArray);
  }

  @Put(':idOrName/roles/add')
  @HttpCode(HttpStatus.OK)
  async addRoles(
    @Param('idOrName') idOrName: string,
    @Body('roles') roles: Roles[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(
      `PUT /users/${idOrName}/roles/add - roles: ${JSON.stringify(roles)}`,
    );
    return this.usersService.addRoles(idOrName, roles);
  }

  @Put(':idOrName/roles/remove')
  @HttpCode(HttpStatus.OK)
  async removeRoles(
    @Param('idOrName') idOrName: string,
    @Body('roles') roles: Roles[],
  ): Promise<ApiSuccessResponse<UserResponse>> {
    this.logger.log(
      `PUT /users/${idOrName}/roles/remove - roles: ${JSON.stringify(roles)}`,
    );
    return this.usersService.removeRoles(idOrName, roles);
  }
}
