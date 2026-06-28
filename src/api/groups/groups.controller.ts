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
} from '@nestjs/common';

import { GroupsService } from '@/api/groups/groups.service';
import { CreateGroupDto, UpdateGroupPermissionsDto } from '@/api/groups/dto';
import { ApiSuccessResponse } from '@common/types/api-response.type';

@Controller('groups')
export class GroupsController {
  private readonly logger = new Logger(GroupsController.name);

  constructor(private readonly groupsService: GroupsService) {}

  /* CREATE GROUP */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGroupDto): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`POST /groups -> ${dto.name}`);
    return this.groupsService.create(dto);
  }

  /* GET ALL GROUPS */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiSuccessResponse<any[]>> {
    this.logger.log('GET /groups');
    return this.groupsService.findAll();
  }

  /* UPDATE GROUP PERMISSIONS */
  @Put(':idOrName/permissions')
  @HttpCode(HttpStatus.OK)
  async updatePermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdateGroupPermissionsDto,
  ): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`PUT /groups/${idOrName}/permissions`);
    return this.groupsService.updatePermissions(idOrName, dto);
  }

  /* DELETE GROUP */
  @Delete(':idOrName')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('idOrName') idOrName: string,
  ): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`DELETE /groups/${idOrName}`);
    return this.groupsService.delete(idOrName);
  }
}
