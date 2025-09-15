import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get(':idOrName')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('idOrName') idOrName: string) {
    return await this.usersService.findOne(idOrName);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return await this.usersService.findAll();
  }

  @Delete(':idOrName')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('idOrName') idOrName: string) {
    return await this.usersService.delete(idOrName);
  }
}
