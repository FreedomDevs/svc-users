import { Test, TestingModule } from '@nestjs/testing';
import { UsersGrpcController } from './users.grpc.controller';
import { UsersService } from '../users.service';
import { Roles } from '@prisma/client';
import { UserResponse } from '../response';
import { BadRequestException } from '@nestjs/common';

describe('UsersGrpcController', () => {
  let controller: UsersGrpcController;

  let usersService: {
    create: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    addRoles: jest.Mock;
    removeRoles: jest.Mock;
    hasRole: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      addRoles: jest.fn(),
      removeRoles: jest.fn(),
      hasRole: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersGrpcController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersGrpcController>(UsersGrpcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ------------------ CreateUser ------------------ */
  it('createUser should serialize roles', async () => {
    const mockUser = new UserResponse({
      id: '1',
      name: 'Alice',
      roles: [Roles.USER, Roles.ADMIN],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    usersService.create.mockResolvedValue({ data: mockUser });

    const result = await controller.createUser({
      name: 'Alice',
      password: 'pass',
    });

    expect(result).toEqual({
      id: '1',
      name: 'Alice',
      roles: ['USER', 'ADMIN'],
    });
  });

  it('createUser should throw BadRequestException for missing fields', async () => {
    await expect(
      controller.createUser({ name: '', password: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  /* ------------------ GetUser ------------------ */
  it('getUser should return serialized user', async () => {
    const mockUser = new UserResponse({
      id: '1',
      name: 'Alice',
      roles: [Roles.USER],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    usersService.findOne.mockResolvedValue({ data: mockUser });

    const result = await controller.getUser({
      idOrName: '1',
      includePassword: false,
    });
    expect(result.roles).toEqual(['USER']);
  });

  it('getUser should throw BadRequestException for missing idOrName', async () => {
    await expect(
      controller.getUser({ idOrName: '', includePassword: false }),
    ).rejects.toThrow(BadRequestException);
  });

  /* ------------------ DeleteUser ------------------ */
  it('deleteUser should return success message', async () => {
    usersService.delete.mockResolvedValue({});
    const result = await controller.deleteUser({ idOrName: '1' });
    expect(result).toEqual({ message: 'User deleted successfully' });
  });

  it('deleteUser should throw BadRequestException for missing idOrName', async () => {
    await expect(controller.deleteUser({ idOrName: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  /* ------------------ AddRoles ------------------ */
  it('addRoles should return user with new roles', async () => {
    const mockUser = new UserResponse({
      id: '1',
      name: 'Alice',
      roles: [Roles.USER, Roles.ADMIN],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    usersService.addRoles.mockResolvedValue({ data: mockUser });

    const result = await controller.addRoles({
      idOrName: '1',
      roles: [Roles.ADMIN],
    });
    expect(result.roles).toEqual(['USER', 'ADMIN']);
  });

  it('addRoles should throw BadRequestException for missing roles', async () => {
    await expect(
      controller.addRoles({ idOrName: '1', roles: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  /* ------------------ RemoveRoles ------------------ */
  it('removeRoles should return user with remaining roles', async () => {
    const mockUser = new UserResponse({
      id: '1',
      name: 'Alice',
      roles: [Roles.USER],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    usersService.removeRoles.mockResolvedValue({ data: mockUser });

    const result = await controller.removeRoles({
      idOrName: '1',
      roles: [Roles.ADMIN],
    });
    expect(result.roles).toEqual(['USER']);
  });

  it('removeRoles should throw BadRequestException for missing roles', async () => {
    await expect(
      controller.removeRoles({ idOrName: '1', roles: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  /* ------------------ HasRoles ------------------ */
  it('hasRoles should return record of roles', async () => {
    usersService.hasRole.mockResolvedValue({
      data: { USER: true, ADMIN: false },
    });
    const result = await controller.hasRoles({
      idOrName: '1',
      roles: [Roles.USER, Roles.ADMIN],
    });
    expect(result).toEqual({ result: { USER: true, ADMIN: false } });
  });

  it('hasRoles should throw BadRequestException for missing roles', async () => {
    await expect(
      controller.hasRoles({ idOrName: '1', roles: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  /* ------------------ ListUsers ------------------ */
  it('listUsers should return paginated users with roles serialized', async () => {
    const mockUser = new UserResponse({
      id: '1',
      name: 'Alice',
      roles: [Roles.USER, Roles.ADMIN],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    usersService.findAll.mockResolvedValue({
      data: {
        users: [mockUser],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      },
    });

    const result = await controller.listUsers({
      search: '',
      page: 1,
      pageSize: 10,
    });

    expect(result).toEqual({
      users: [{ id: '1', name: 'Alice', roles: ['USER', 'ADMIN'] }],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('listUsers should throw BadRequestException for invalid pagination', async () => {
    await expect(
      controller.listUsers({ page: 0, pageSize: 10 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.listUsers({ page: 1, pageSize: 0 }),
    ).rejects.toThrow(BadRequestException);
  });
});
