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

type GroupWithUsers = Prisma.GroupGetPayload<{
  include: {
    users: true;
  };
}>;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private async getGroupOrThrow(idOrName: string): Promise<GroupWithUsers> {
    const groups = await this.prisma.group.findMany({
      include: { users: true },
    });

    const target = this.normalize(idOrName);

    let group: GroupWithUsers | undefined;

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];

      if (
        this.normalize(g.id) === target ||
        this.normalize(g.name) === target
      ) {
        group = g;
        break;
      }
    }

    if (!group) {
      throw new NotFoundException(
        efail('Group not found', GroupCodes.GROUP_NOT_FOUND),
      );
    }

    return group;
  }

  async create(dto: CreateGroupDto) {
    const groups = await this.prisma.group.findMany();

    const name = this.normalize(dto.name);

    for (let i = 0; i < groups.length; i++) {
      if (this.normalize(groups[i].name) === name) {
        throw new BadRequestException(
          efail('Group already exists', GroupCodes.GROUP_ALREADY_EXISTS),
        );
      }
    }

    const created = await this.prisma.group.create({
      data: {
        name: dto.name.trim(),
      },
    });

    this.logger.log(`Group created: ${created.id}`);

    return ok(created, 'Group created', GroupCodes.GROUP_CREATED);
  }

  async findAll() {
    const groups = await this.prisma.group.findMany({
      include: { users: true },
    });

    return ok(groups, 'Groups fetched', GroupCodes.GROUP_FETCHED);
  }

  async addPermissions(idOrName: string, dto: UpdateGroupPermissionsDto) {
    const group = await this.getGroupOrThrow(idOrName);

    const uniquePermissions: string[] = [...new Set(dto.permissions)];

    const newPermissions: string[] = [];

    for (let i = 0; i < uniquePermissions.length; i++) {
      const perm = uniquePermissions[i];

      let exists = false;

      for (let j = 0; j < group.permissions.length; j++) {
        if (group.permissions[j] === perm) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        newPermissions.push(perm);
      }
    }

    if (newPermissions.length === 0) {
      throw new BadRequestException(
        efail('Permissions already exist', GroupCodes.GROUP_PERMISSION_EXISTS),
      );
    }

    const updated = await this.prisma.group.update({
      where: { id: group.id },
      data: {
        permissions: [...group.permissions, ...newPermissions],
      },
    });

    return ok(updated, 'Permissions added', GroupCodes.GROUP_UPDATED);
  }

  async removePermissions(idOrName: string, dto: UpdateGroupPermissionsDto) {
    const group = await this.getGroupOrThrow(idOrName);

    const removable: string[] = [];

    for (let i = 0; i < dto.permissions.length; i++) {
      const perm = dto.permissions[i];

      for (let j = 0; j < group.permissions.length; j++) {
        if (group.permissions[j] === perm) {
          removable.push(perm);
          break;
        }
      }
    }

    if (removable.length === 0) {
      throw new BadRequestException(
        efail('Permissions not found', GroupCodes.GROUP_PERMISSION_NOT_FOUND),
      );
    }

    const updated = await this.prisma.group.update({
      where: { id: group.id },
      data: {
        permissions: group.permissions.filter((p) => !removable.includes(p)),
      },
    });

    return ok(updated, 'Permissions removed', GroupCodes.GROUP_UPDATED);
  }

  async hasPermission(idOrName: string, permission: string) {
    const group = await this.getGroupOrThrow(idOrName);

    const target = permission.trim();

    for (let i = 0; i < group.permissions.length; i++) {
      if (group.permissions[i] === target) {
        return ok(true, 'Has permission', GroupCodes.GROUP_CHECK);
      }
    }

    return ok(false, 'No permission', GroupCodes.GROUP_CHECK);
  }

  async hasAnyPermissions(idOrName: string, dto: UpdateGroupPermissionsDto) {
    const group = await this.getGroupOrThrow(idOrName);

    const perms: string[] = dto.permissions;

    for (let i = 0; i < perms.length; i++) {
      const target = perms[i];

      for (let j = 0; j < group.permissions.length; j++) {
        if (group.permissions[j] === target) {
          return ok(true, 'Has any permission', GroupCodes.GROUP_CHECK);
        }
      }
    }

    return ok(false, 'No permissions match', GroupCodes.GROUP_CHECK);
  }

  async hasAllPermissions(idOrName: string, dto: UpdateGroupPermissionsDto) {
    const group = await this.getGroupOrThrow(idOrName);

    for (let i = 0; i < dto.permissions.length; i++) {
      let found = false;

      for (let j = 0; j < group.permissions.length; j++) {
        if (group.permissions[j] === dto.permissions[i]) {
          found = true;
          break;
        }
      }

      if (!found) {
        return ok(false, 'Missing permissions', GroupCodes.GROUP_CHECK);
      }
    }

    return ok(true, 'Has all permissions', GroupCodes.GROUP_CHECK);
  }

  async isUserInGroup(idOrName: string, userId: string) {
    const group = await this.getGroupOrThrow(idOrName);

    for (let i = 0; i < group.users.length; i++) {
      const user = group.users[i];

      if (user.id === userId) {
        return ok(true, 'User in group', GroupCodes.GROUP_CHECK);
      }
    }

    return ok(false, 'User not in group', GroupCodes.GROUP_CHECK);
  }

  async delete(idOrName: string) {
    const group = await this.getGroupOrThrow(idOrName);

    const deleted = await this.prisma.group.delete({
      where: { id: group.id },
    });

    this.logger.log(`Group deleted: ${deleted.id}`);

    return ok(deleted, 'Group deleted', GroupCodes.GROUP_DELETED);
  }
}
