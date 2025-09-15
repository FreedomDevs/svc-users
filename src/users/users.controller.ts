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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`POST /users - body: ${JSON.stringify(createUserDto)}`);
    return await this.usersService.create(createUserDto);
  }

  @Get(':idOrName')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('idOrName') idOrName: string) {
    this.logger.log(`GET /users/${idOrName}`);
    return await this.usersService.findOne(idOrName);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    this.logger.log(
      `GET /users - search: ${search}, page: ${pageNum}, limit: ${limitNum}`,
    );

    return this.usersService.findAll(search, pageNum, limitNum);
  }

  @Delete(':idOrName')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('idOrName') idOrName: string) {
    this.logger.log(`DELETE /users/${idOrName}`);
    return await this.usersService.delete(idOrName);
  }
}
