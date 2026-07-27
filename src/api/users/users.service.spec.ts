import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserResponse } from './response';
import { UserCodes } from './users.codes';
import { CreateUserDto, UpdateUserPermissionsDto } from './dto';
import { EAuthType } from '@common/types';

type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };

  group: {
    findMany: jest.Mock;
  };

  $transaction: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;

  const mockGroup = {
    id: 'group-id',
    name: 'Admin',
    permissions: ['users:read'],
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'uuid-1234',
    name: 'testuser',
    password: 'password',
    permissions: ['users:write'],
    groups: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },

      group: {
        findMany: jest.fn(),
      },

      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'testuser',
        password: 'password',
      } as CreateUserDto);

      expect(result.data).toBeInstanceOf(UserResponse);
      expect(result.meta.code).toBe(UserCodes.USER_CREATED);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'testuser',
          password: 'password',
        },
      });
    });

    it('should trim username', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      await service.create({
        name: '  testuser  ',
        password: 'password',
      } as CreateUserDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          name: 'testuser',
        },
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'testuser',
          password: 'password',
        },
      });
    });

    it('should throw if user exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'testuser',
          password: 'password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if name missing', async () => {
      await expect(
        service.create({
          name: '',
          password: 'password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if password missing', async () => {
      await expect(
        service.create({
          name: 'user',
          password: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return user', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      const result = await service.findOne('uuid');

      expect(result.data).toBeInstanceOf(UserResponse);
      expect(result.data.password).toBeUndefined();
      expect(result.meta.code).toBe(UserCodes.USER_FETCHED_OK);
    });

    it('should include password for service auth', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      const result = await service.findOne(
        'uuid',
        true,
        null,
        EAuthType.server,
      );

      expect(result.data.password).toBe('password');
    });

    it('should include password when user has permission', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      const result = await service.findOne(
        'uuid',
        true,
        ['read_password'],
        EAuthType.user,
      );

      expect(result.data.password).toBe('password');
    });

    it('should forbid reading password', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      await expect(
        service.findOne('uuid', true, ['users:read'], EAuthType.user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if identifier empty', async () => {
      await expect(service.findOne('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      prisma.$transaction.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll(undefined, 1, 10);

      expect(result.data.users).toHaveLength(1);
      expect(result.data.users[0]).toBeInstanceOf(UserResponse);

      expect(result.meta.code).toBe(UserCodes.USER_LIST_FETCHED);
    });

    it('should search by name', async () => {
      prisma.$transaction.mockResolvedValue([[mockUser], 1]);

      await service.findAll('test', 1, 10);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reject invalid page', async () => {
      await expect(service.findAll(undefined, 0, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid page size', async () => {
      await expect(service.findAll(undefined, 1, 0)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.delete('uuid');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
      });

      expect(result.meta.code).toBe(UserCodes.USER_DELETED);
    });
  });

  describe('updateName', () => {
    it('should update name', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'newName',
      });

      const result = await service.updateName('uuid', 'newName');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          name: 'newName',
        },
      });

      expect(result.data.name).toBe('newName');
      expect(result.meta.code).toBe(UserCodes.NAME_UPDATED);
    });

    it('should throw when name is empty', async () => {
      await expect(service.updateName('uuid', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when id is empty', async () => {
      await expect(service.updateName('', 'newName')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        password: 'newPassword',
      });

      const result = await service.updatePassword('uuid', 'newPassword');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          password: 'newPassword',
        },
      });

      expect(result.data.password).toBe('newPassword');
      expect(result.meta.code).toBe(UserCodes.PASSWORD_UPDATED);
    });

    it('should throw when password is empty', async () => {
      await expect(service.updatePassword('uuid', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when id is empty', async () => {
      await expect(service.updatePassword('', 'password')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions and groups', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      prisma.group.findMany.mockResolvedValue([mockGroup]);

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        permissions: ['users:read', 'users:write'],
        groups: [mockGroup],
      });

      const dto: UpdateUserPermissionsDto = {
        permissions: {
          users: ['read', 'write'],
        },
        groups: [mockGroup.id],
      };

      const result = await service.updatePermissions('uuid', dto);

      expect(prisma.group.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [mockGroup.id],
          },
        },
      });

      expect(prisma.user.update).toHaveBeenCalled();

      expect(result.meta.code).toBe(UserCodes.PERMISSIONS_UPDATED);

      expect(result.data.groups).toEqual(['Admin']);

      expect(result.data.permissions).toEqual({
        users: ['read', 'write'],
      });
    });

    it('should update only permissions when groups are omitted', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      prisma.user.update.mockResolvedValue({
        ...mockUser,
        permissions: ['users:read'],
        groups: [],
      });

      await service.updatePermissions('uuid', {
        permissions: {
          users: ['read'],
        },
      });

      expect(prisma.group.findMany).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw if one group does not exist', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      prisma.group.findMany.mockResolvedValue([]);

      await expect(
        service.updatePermissions('uuid', {
          permissions: {},
          groups: ['missing-group'],
        }),
      ).rejects.toThrow();
    });
  });

  describe('findOnePerms', () => {
    it('should return merged permissions', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue({
        ...mockUser,
        permissions: ['users:write', 'users:read'],
        groups: [
          {
            ...mockGroup,
            permissions: ['users:read', 'users:delete', 'other:test'],
          },
        ],
      });

      const result = await service.findOnePerms('uuid', 'users');

      expect(result.meta.code).toBe(UserCodes.USER_FETCHED_OK);

      expect(result.data).toEqual(
        expect.arrayContaining(['read', 'write', 'delete']),
      );

      expect(result.data).toHaveLength(3);
    });

    it('should return empty array when service has no permissions', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue({
        ...mockUser,
        permissions: ['users:read'],
        groups: [],
      });

      const result = await service.findOnePerms('uuid', 'billing');

      expect(result.data).toEqual([]);
    });

    it('should throw when service name is missing', async () => {
      await expect(service.findOnePerms('uuid', undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when user id is missing', async () => {
      await expect(service.findOnePerms('', 'users')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should ignore invalid permissions', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue({
        ...mockUser,
        permissions: [
          '',
          'users:',
          ':read',
          'users:read',
          'users:   ',
          'users:write',
          'users:undefined',
          'users:null',
        ],
        groups: [],
      });

      const result = await service.findOnePerms('uuid', 'users');

      expect(result.data).toEqual(expect.arrayContaining(['read', 'write']));

      expect(result.data).not.toContain('null');
      expect(result.data).not.toContain('undefined');
    });
  });
});
