import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateGroupDto, UpdateGroupPermissionsDto } from '@/api/groups/dto';

import { ok, efail } from '@common/response/response.helper';
import { GroupCodes } from './groups.codes';
import { PermissionsUtil } from '@common/utils';

type GroupWithUsers = Prisma.GroupGetPayload<{
  include: {
    users: true;
  };
}>;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private isUUID(value: string): boolean {
    return /^[0-9a-fA-F-]{36}$/.test(value);
  }

  private async getGroupOrThrow(idOrName: string): Promise<GroupWithUsers> {
    if (!idOrName.trim()) {
      throw new NotFoundException(
        efail('Group not found', GroupCodes.GROUP_NOT_FOUND),
      );
    }

    const group = await this.prisma.group.findFirst({
      where: this.isUUID(idOrName)
        ? { id: idOrName }
        : { name: idOrName.trim() },
      include: {
        users: true,
      },
    });

    if (!group) {
      throw new NotFoundException(
        efail('Group not found', GroupCodes.GROUP_NOT_FOUND),
      );
    }

    return group;
  }

  private serializeGroup(group: GroupWithUsers) {
    return {
      id: group.id,
      name: group.name,
      permissions: PermissionsUtil.unflatten(group.permissions),
      users: group.users.map((user) => user.id),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  async create(dto: CreateGroupDto) {
    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException(
        efail('Group name is required', GroupCodes.GROUP_INVALID_DATA),
      );
    }

    const existing = await this.prisma.group.findUnique({
      where: {
        name,
      },
    });

    if (existing) {
      throw new BadRequestException(
        efail('Group already exists', GroupCodes.GROUP_ALREADY_EXISTS),
      );
    }

    const created = await this.prisma.group.create({
      data: {
        name,
      },
      include: {
        users: true,
      },
    });

    this.logger.log(`Group created: ${created.id} (${created.name})`);

    return ok(
      this.serializeGroup(created),
      'Group created',
      GroupCodes.GROUP_CREATED,
    );
  }

  async findAll() {
    const groups = await this.prisma.group.findMany({
      include: {
        users: true,
      },
    });

    return ok(
      groups.map((group) => this.serializeGroup(group)),
      'Groups fetched',
      GroupCodes.GROUP_FETCHED,
    );
  }

  async updatePermissions(idOrName: string, dto: UpdateGroupPermissionsDto) {
    const group = await this.getGroupOrThrow(idOrName);

    const flatPermissions = PermissionsUtil.flatten(dto.permissions);

    const updated = await this.prisma.group.update({
      where: {
        id: group.id,
      },
      data: {
        permissions: flatPermissions,
      },
      include: {
        users: true,
      },
    });

    this.logger.log(`Group permissions updated: ${updated.id}`);

    return ok(
      this.serializeGroup(updated),
      'Group permissions updated',
      GroupCodes.GROUP_PERMISSIONS_UPDATED,
    );
  }

  async delete(idOrName: string) {
    const group = await this.getGroupOrThrow(idOrName);

    await this.prisma.group.delete({
      where: {
        id: group.id,
      },
    });

    this.logger.log(`Group deleted: ${group.id} (${group.name})`);

    return ok(
      this.serializeGroup(group),
      'Group deleted',
      GroupCodes.GROUP_DELETED,
    );
  }
}
