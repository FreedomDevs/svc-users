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
import { Group } from '@prisma/client';
import { ApiSuccessResponse } from '@common/types/api-response.type';

@Controller('groups')
export class GroupsController {
  private readonly logger = new Logger(GroupsController.name);

  constructor(private readonly groupsService: GroupsService) {}

  /* CREATE GROUP */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateGroupDto,
  ): Promise<ApiSuccessResponse<Group>> {
    this.logger.log(`POST /groups -> ${dto.name}`);
    return this.groupsService.create(dto);
  }

  /* GET ALL GROUPS */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiSuccessResponse<Group[]>> {
    this.logger.log('GET /groups');
    return this.groupsService.findAll();
  }

  /* DELETE GROUP */
  @Delete(':idOrName')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('idOrName') idOrName: string,
  ): Promise<ApiSuccessResponse<Group>> {
    this.logger.log(`DELETE /groups/${idOrName}`);
    return this.groupsService.delete(idOrName);
  }

  /* ADD PERMISSIONS */
  @Put(':idOrName/permissions/add')
  @HttpCode(HttpStatus.OK)
  async addPermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdateGroupPermissionsDto,
  ): Promise<ApiSuccessResponse<Group>> {
    this.logger.log(`PUT /groups/${idOrName}/permissions/add`);

    return this.groupsService.addPermissions(idOrName, dto);
  }

  /* REMOVE PERMISSIONS */
  @Put(':idOrName/permissions/remove')
  @HttpCode(HttpStatus.OK)
  async removePermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdateGroupPermissionsDto,
  ): Promise<ApiSuccessResponse<Group>> {
    this.logger.log(`PUT /groups/${idOrName}/permissions/remove`);

    return this.groupsService.removePermissions(idOrName, dto);
  }

  /* HAS PERMISSION */
  @Get(':idOrName/permissions/:permission')
  @HttpCode(HttpStatus.OK)
  async hasPermission(
    @Param('idOrName') idOrName: string,
    @Param('permission') permission: string,
  ): Promise<ApiSuccessResponse<boolean>> {
    this.logger.log(`GET /groups/${idOrName}/permissions/${permission}`);

    return this.groupsService.hasPermission(idOrName, permission);
  }

  /* HAS ANY PERMISSIONS */
  @Post(':idOrName/permissions/any')
  @HttpCode(HttpStatus.OK)
  async hasAnyPermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdateGroupPermissionsDto,
  ): Promise<ApiSuccessResponse<boolean>> {
    this.logger.log(`POST /groups/${idOrName}/permissions/any`);

    return this.groupsService.hasAnyPermissions(idOrName, dto);
  }

  /* HAS ALL PERMISSIONS */
  @Post(':idOrName/permissions/all')
  @HttpCode(HttpStatus.OK)
  async hasAllPermissions(
    @Param('idOrName') idOrName: string,
    @Body() dto: UpdateGroupPermissionsDto,
  ): Promise<ApiSuccessResponse<boolean>> {
    this.logger.log(`POST /groups/${idOrName}/permissions/all`);

    return this.groupsService.hasAllPermissions(idOrName, dto);
  }

  /* CHECK USER IN GROUP */
  @Get(':idOrName/users/:userId')
  @HttpCode(HttpStatus.OK)
  async isUserInGroup(
    @Param('idOrName') idOrName: string,
    @Param('userId') userId: string,
  ): Promise<ApiSuccessResponse<boolean>> {
    this.logger.log(`GET /groups/${idOrName}/users/${userId}`);

    return this.groupsService.isUserInGroup(idOrName, userId);
  }
}
