import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserResponse } from './response';
import { UserCodes } from './users.codes';
import { Roles } from '@prisma/client';
import { CreateUserDto } from './dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Partial<Record<keyof UsersService, jest.Mock>>;

  const mockUserResponse = {
    id: 'uuid-1234',
    name: 'testuser',
    roles: ['USER'] as Roles[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue({
        data: new UserResponse(mockUserResponse),
        meta: { code: UserCodes.USER_CREATED },
      }),
      findOne: jest.fn().mockResolvedValue({
        data: new UserResponse(mockUserResponse),
        meta: { code: UserCodes.USER_FETCHED_OK },
      }),
      findAll: jest.fn().mockResolvedValue({
        data: {
          users: [new UserResponse(mockUserResponse)],
          pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
        },
        meta: { code: UserCodes.USER_LIST_FETCHED },
      }),
      delete: jest.fn().mockResolvedValue({
        data: null,
        meta: { code: UserCodes.USER_DELETED },
      }),
      hasRole: jest.fn().mockResolvedValue({
        data: { USER: true, ADMIN: false },
        meta: { code: UserCodes.ROLES_UPDATED },
      }),
      addRoles: jest.fn().mockResolvedValue({
        data: new UserResponse({
          ...mockUserResponse,
          roles: ['USER', 'ADMIN'],
        }),
        meta: { code: UserCodes.ROLES_UPDATED },
      }),
      removeRoles: jest.fn().mockResolvedValue({
        data: new UserResponse({ ...mockUserResponse, roles: ['USER'] }),
        meta: { code: UserCodes.ROLES_UPDATED },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should create a user', async () => {
    const dto: CreateUserDto = { name: 'testuser', password: 'password' };
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res.data).toBeInstanceOf(UserResponse);
    expect(res.meta.code).toBe(UserCodes.USER_CREATED);
  });

  it('should find one user', async () => {
    const res = await controller.findOne('uuid-1234', 'true');
    expect(service.findOne).toHaveBeenCalledWith('uuid-1234', true);
    expect(res.data).toBeInstanceOf(UserResponse);
  });

  it('should find all users with pagination', async () => {
    const res = await controller.findAll('search', '1', '10');
    expect(service.findAll).toHaveBeenCalledWith('search', 1, 10);
    expect(res.data.users[0]).toBeInstanceOf(UserResponse);
  });

  it('should delete a user', async () => {
    const res = await controller.delete('uuid-1234');
    expect(service.delete).toHaveBeenCalledWith('uuid-1234');
    expect(res.meta.code).toBe(UserCodes.USER_DELETED);
  });

  it('should check roles', async () => {
    const res = await controller.hasRoles('uuid-1234', 'USER,ADMIN');
    expect(service.hasRole).toHaveBeenCalledWith('uuid-1234', [
      'USER',
      'ADMIN',
    ]);
    expect(res.data['USER']).toBe(true);
    expect(res.data['ADMIN']).toBe(false);
  });

  it('should add roles', async () => {
    const res = await controller.addRoles('uuid-1234', ['ADMIN']);
    expect(service.addRoles).toHaveBeenCalledWith('uuid-1234', ['ADMIN']);
    expect(res.data.roles).toContain('ADMIN');
  });

  it('should remove roles', async () => {
    const res = await controller.removeRoles('uuid-1234', ['ADMIN']);
    expect(service.removeRoles).toHaveBeenCalledWith('uuid-1234', ['ADMIN']);
    expect(res.data.roles).not.toContain('ADMIN');
  });
});
