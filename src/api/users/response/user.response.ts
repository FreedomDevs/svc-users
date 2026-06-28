import { Group, Prisma } from '@prisma/client';
import { PermissionsUtil } from '@common/utils/';

type UserWithGroups = Prisma.UserGetPayload<{
  include: { groups: true };
}>;

export class UserResponse
  implements Omit<UserWithGroups, 'password' | 'permissions'>
{
  id: string;
  name: string;

  permissions: Record<string, string[]>;
  groups: Group[];

  password?: string;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserWithGroups>, includePassword = false) {
    this.id = partial.id!;
    this.name = partial.name!;

    this.permissions = PermissionsUtil.unflatten(partial.permissions ?? []);
    this.groups = partial.groups ?? [];

    this.createdAt = partial.createdAt!;
    this.updatedAt = partial.updatedAt!;

    if (includePassword) {
      this.password = partial.password;
    }
  }
}
