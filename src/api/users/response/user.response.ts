import { Group, Prisma } from '@prisma/client';

type UserWithGroups = Prisma.UserGetPayload<{
  include: { groups: true };
}>;

export class UserResponse implements Omit<UserWithGroups, 'password'> {
  id: string;
  name: string;

  permissions: string[];
  groups: Group[];

  password?: string; // optional!

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserWithGroups>, includePassword = false) {
    this.id = partial.id!;
    this.name = partial.name!;

    this.permissions = partial.permissions ?? [];
    this.groups = partial.groups ?? [];

    this.createdAt = partial.createdAt!;
    this.updatedAt = partial.updatedAt!;

    if (includePassword) {
      this.password = partial.password;
    }
  }
}
