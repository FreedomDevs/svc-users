import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { GroupsService } from './groups.service';
import { PrismaService } from '@prisma/prisma.service';
import { GroupCodes } from './groups.codes';

import { CreateGroupDto, UpdateGroupPermissionsDto } from './dto';

type MockPrisma = {
  group: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: MockPrisma;

  const mockGroup = {
    id: 'group-id',
    name: 'Admin',
    permissions: ['users:read', 'users:write'],
    users: [
      {
        id: 'user-id',
        name: 'test',
        password: 'password',
        permissions: [],
        groups: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      group: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: prisma as unknown as PrismaService,
        },
      ],
    }).compile();

    service = module.get(GroupsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create group', async () => {
      prisma.group.findUnique.mockResolvedValue(null);
      prisma.group.create.mockResolvedValue(mockGroup);

      const dto: CreateGroupDto = {
        name: 'Admin',
      };

      const result = await service.create(dto);

      expect(prisma.group.findUnique).toHaveBeenCalledWith({
        where: {
          name: 'Admin',
        },
      });

      expect(prisma.group.create).toHaveBeenCalled();

      expect(result.meta.code).toBe(GroupCodes.GROUP_CREATED);
      expect(result.data.name).toBe('Admin');
    });

    it('should trim group name', async () => {
      prisma.group.findUnique.mockResolvedValue(null);
      prisma.group.create.mockResolvedValue(mockGroup);

      await service.create({
        name: '  Admin  ',
      });

      expect(prisma.group.findUnique).toHaveBeenCalledWith({
        where: {
          name: 'Admin',
        },
      });
    });

    it('should throw when name is empty', async () => {
      await expect(
        service.create({
          name: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when group already exists', async () => {
      prisma.group.findUnique.mockResolvedValue(mockGroup);

      await expect(
        service.create({
          name: 'Admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all groups', async () => {
      prisma.group.findMany.mockResolvedValue([mockGroup]);

      const result = await service.findAll();

      expect(prisma.group.findMany).toHaveBeenCalledWith({
        include: {
          users: true,
        },
      });

      expect(result.meta.code).toBe(GroupCodes.GROUP_FETCHED);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Admin');
    });

    it('should return empty array', async () => {
      prisma.group.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result.data).toEqual([]);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions', async () => {
      jest
        .spyOn(service as any, 'getGroupOrThrow')
        .mockResolvedValue(mockGroup);

      prisma.group.update.mockResolvedValue(mockGroup);

      const dto: UpdateGroupPermissionsDto = {
        permissions: {
          users: ['read', 'write'],
        },
      };

      const result = await service.updatePermissions('group-id', dto);

      expect(prisma.group.update).toHaveBeenCalledWith({
        where: {
          id: mockGroup.id,
        },
        data: {
          permissions: ['users:read', 'users:write'],
        },
        include: {
          users: true,
        },
      });

      expect(result.meta.code).toBe(GroupCodes.GROUP_PERMISSIONS_UPDATED);
    });

    it('should allow empty permissions', async () => {
      jest
        .spyOn(service as any, 'getGroupOrThrow')
        .mockResolvedValue(mockGroup);

      prisma.group.update.mockResolvedValue({
        ...mockGroup,
        permissions: [],
      });

      await service.updatePermissions('group-id', {
        permissions: {},
      });

      expect(prisma.group.update).toHaveBeenCalledWith({
        where: {
          id: mockGroup.id,
        },
        data: {
          permissions: [],
        },
        include: {
          users: true,
        },
      });
    });

    it('should throw if group does not exist', async () => {
      jest
        .spyOn(service as any, 'getGroupOrThrow')
        .mockRejectedValue(new NotFoundException());

      await expect(
        service.updatePermissions('missing', {
          permissions: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete group', async () => {
      jest
        .spyOn(service as any, 'getGroupOrThrow')
        .mockResolvedValue(mockGroup);

      prisma.group.delete.mockResolvedValue(mockGroup);

      const result = await service.delete('group-id');

      expect(prisma.group.delete).toHaveBeenCalledWith({
        where: {
          id: mockGroup.id,
        },
      });

      expect(result.meta.code).toBe(GroupCodes.GROUP_DELETED);
      expect(result.data.id).toBe(mockGroup.id);
    });

    it('should throw when group is missing', async () => {
      jest
        .spyOn(service as any, 'getGroupOrThrow')
        .mockRejectedValue(new NotFoundException());

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGroupOrThrow', () => {
    it('should find group by id', async () => {
      prisma.group.findFirst.mockResolvedValue(mockGroup);

      const group = (await (service as any).getGroupOrThrow(
        '550e8400-e29b-41d4-a716-446655440000',
      )) as typeof mockGroup;

      expect(group.id).toBe(mockGroup.id);
    });

    it('should find group by name', async () => {
      prisma.group.findFirst.mockResolvedValue(mockGroup);

      await (service as any).getGroupOrThrow('Admin');

      expect(prisma.group.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'Admin',
        },
        include: {
          users: true,
        },
      });
    });

    it('should throw when name is empty', async () => {
      await expect((service as any).getGroupOrThrow('')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when group is not found', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect((service as any).getGroupOrThrow('Admin')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
