import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@prisma/prisma.service';
import Redis, { ChainableCommander } from 'ioredis';
import { BadRequestException } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserResponse } from './response';
import { UserCodes } from './users.codes';
import { CreateUserDto } from './dto';

type MockPrisma = Partial<PrismaService> & {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;
  let redis: Redis;

  const mockUser = {
    id: 'uuid-1234',
    name: 'testuser',
    password: 'password',
    roles: ['USER'] as Roles[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Мокируем только используемые методы
    const mockUserDelegate = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    };

    // Преобразуем через 'unknown' к UserDelegate, чтобы TS не ругался
    prisma = {
      user: mockUserDelegate as unknown as (typeof prisma)['user'],
      $transaction: jest.fn(),
    };

    const pipelineMock: Partial<ChainableCommander> = {
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      pipeline: jest.fn().mockReturnValue(pipelineMock as ChainableCommander),
    } as unknown as Redis;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'testuser',
        password: 'password',
      } as CreateUserDto);

      expect(result.data).toBeInstanceOf(UserResponse);
      expect(result.meta.code).toBe(UserCodes.USER_CREATED);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { name: 'testuser', password: 'password', roles: ['USER'] },
      });
    });

    it('should throw if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'testuser',
          password: 'password',
        } as CreateUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if name or password missing', async () => {
      await expect(
        service.create({ name: '', password: '' } as CreateUserDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);

      const res = await service.findOne('uuid-1234', false);
      expect(res.data).toBeInstanceOf(UserResponse);
      expect(res.meta.code).toBe(UserCodes.USER_FETCHED_OK);
    });

    it('should throw if idOrName not provided', async () => {
      await expect(service.findOne('', false)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return a list of users with pagination', async () => {
      prisma.$transaction.mockResolvedValue([[mockUser], 1]);

      const res = await service.findAll(undefined, 1, 10);
      expect(res.data.users[0]).toBeInstanceOf(UserResponse);
      expect(res.data.pagination.total).toBe(1);
      expect(res.meta.code).toBe(UserCodes.USER_LIST_FETCHED);
    });

    it('should throw if invalid pagination', async () => {
      await expect(service.findAll(undefined, 0, 0)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      const res = await service.delete('uuid-1234');
      expect(res.meta.code).toBe(UserCodes.USER_DELETED);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });
  });

  describe('hasRole', () => {
    it('should return role status', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);
      const res = await service.hasRole('uuid-1234', ['USER', 'ADMIN']);
      expect(res.data['USER']).toBe(true);
      expect(res.data['ADMIN']).toBe(false);
    });
  });

  describe('addRoles', () => {
    it('should add new roles', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        roles: ['USER', 'ADMIN'],
      });

      const res = await service.addRoles('uuid-1234', ['ADMIN']);
      expect(res.data.roles).toContain('ADMIN');
      expect(res.meta.code).toBe(UserCodes.ROLES_UPDATED);
    });

    it('should throw if all roles already exist', async () => {
      jest.spyOn(service as any, 'getUserOrThrow').mockResolvedValue(mockUser);
      await expect(service.addRoles('uuid-1234', ['USER'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeRoles', () => {
    it('should remove roles', async () => {
      jest
        .spyOn(service as any, 'getUserOrThrow')
        .mockResolvedValue({ ...mockUser, roles: ['USER', 'ADMIN'] });
      prisma.user.update.mockResolvedValue({ ...mockUser, roles: ['USER'] });

      const res = await service.removeRoles('uuid-1234', ['ADMIN']);
      expect(res.data.roles).not.toContain('ADMIN');
      expect(res.meta.code).toBe(UserCodes.ROLES_UPDATED);
    });

    it('should throw if trying to remove all roles', async () => {
      jest
        .spyOn(service as any, 'getUserOrThrow')
        .mockResolvedValue({ ...mockUser, roles: ['USER'] });
      await expect(service.removeRoles('uuid-1234', ['USER'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
