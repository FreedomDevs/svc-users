import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserResponse } from './response';
import { UserCodes } from './users.codes';

import {
  CreateUserDto,
  UpdateNameDto,
  UpdatePasswordDto,
  UpdateUserPermissionsDto,
} from './dto';

import { EAuthType } from '@common/types';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<Partial<UsersService>>;

  const mockUser = {
    id: 'uuid-1234',
    name: 'testuser',
    password: 'password',
    permissions: [],
    groups: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue({
        data: new UserResponse(mockUser),
        meta: { code: UserCodes.USER_CREATED },
      }),

      findOne: jest.fn().mockResolvedValue({
        data: new UserResponse(mockUser),
        meta: { code: UserCodes.USER_FETCHED_OK },
      }),

      findOnePerms: jest.fn().mockResolvedValue({
        data: ['read', 'write'],
        meta: { code: UserCodes.USER_FETCHED_OK },
      }),

      findAll: jest.fn().mockResolvedValue({
        data: {
          users: [new UserResponse(mockUser)],
        },
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
        meta: {
          code: UserCodes.USER_LIST_FETCHED,
        },
      }),

      delete: jest.fn().mockResolvedValue({
        data: null,
        meta: {
          code: UserCodes.USER_DELETED,
        },
      }),

      updateName: jest.fn().mockResolvedValue({
        data: {
          name: 'newName',
        },
        meta: {
          code: UserCodes.NAME_UPDATED,
        },
      }),

      updatePassword: jest.fn().mockResolvedValue({
        data: {
          password: 'newPassword',
        },
        meta: {
          code: UserCodes.PASSWORD_UPDATED,
        },
      }),

      updatePermissions: jest.fn().mockResolvedValue({
        data: {
          groups: ['Admin'],
          permissions: {
            users: ['read', 'write'],
          },
        },
        meta: {
          code: UserCodes.PERMISSIONS_UPDATED,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  describe('create', () => {
    it('should create user', async () => {
      const dto: CreateUserDto = {
        name: 'testuser',
        password: 'password',
      };

      const res = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(res.data).toBeInstanceOf(UserResponse);
      expect(res.meta.code).toBe(UserCodes.USER_CREATED);
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      const res = await controller.me(EAuthType.user, 'uuid-1234');

      expect(service.findOne).toHaveBeenCalledWith('uuid-1234');
      expect(res.data).toBeInstanceOf(UserResponse);
    });

    it('should reject service auth', async () => {
      await expect(controller.me(EAuthType.server, 'uuid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should find user without password', async () => {
      await controller.findOne('uuid');

      expect(service.findOne).toHaveBeenCalledWith('uuid', false, [], null);
    });

    it('should include password', async () => {
      await controller.findOne(
        'uuid',
        'true',
        EAuthType.user,
        'read_password users:read',
      );

      expect(service.findOne).toHaveBeenCalledWith(
        'uuid',
        true,
        ['read_password', 'users:read'],
        EAuthType.user,
      );
    });
  });

  describe('findOnePerms', () => {
    it('should return permissions', async () => {
      const res = await controller.findOnePerms('uuid', 'users');

      expect(service.findOnePerms).toHaveBeenCalledWith('uuid', 'users');

      expect(res.data).toEqual(['read', 'write']);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const res = await controller.findAll('search', '1', '10');

      expect(service.findAll).toHaveBeenCalledWith('search', 1, 10);

      expect(res.data.users).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const res = await controller.delete('uuid');

      expect(service.delete).toHaveBeenCalledWith('uuid');
      expect(res.meta.code).toBe(UserCodes.USER_DELETED);
    });
  });

  describe('updateName', () => {
    it('should update name', async () => {
      const dto: UpdateNameDto = {
        name: 'newName',
      };

      const res = await controller.updateName('uuid', dto);

      expect(service.updateName).toHaveBeenCalledWith('uuid', 'newName');

      expect(res.data.name).toBe('newName');
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      const dto: UpdatePasswordDto = {
        password: 'newPassword',
      };

      const res = await controller.updatePassword('uuid', dto);

      expect(service.updatePassword).toHaveBeenCalledWith(
        'uuid',
        'newPassword',
      );

      expect(res.data.password).toBe('newPassword');
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions', async () => {
      const dto: UpdateUserPermissionsDto = {
        permissions: {
          users: ['read', 'write'],
        },
        groups: ['group-id'],
      };

      const res = await controller.updatePermissions('uuid', dto);

      expect(service.updatePermissions).toHaveBeenCalledWith('uuid', dto);

      expect(res.meta.code).toBe(UserCodes.PERMISSIONS_UPDATED);
    });
  });
});
