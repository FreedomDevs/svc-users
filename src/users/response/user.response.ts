import { Roles, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponse implements Omit<User, 'password'> {
  id: string;
  name: string;
  password?: string; // optional!
  roles: Roles[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>, includePassword = false) {
    this.id = partial.id!;
    this.name = partial.name!;
    this.roles = partial.roles!;
    this.createdAt = partial.createdAt!;
    this.updatedAt = partial.updatedAt!;

    if (includePassword) {
      this.password = partial.password;
    }
  }
}
