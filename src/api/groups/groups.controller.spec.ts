import { Test, TestingModule } from '@nestjs/testing';

import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

import { CreateGroupDto, UpdateGroupPermissionsDto } from './dto';

import { GroupCodes } from './groups.codes';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: jest.Mocked<Partial<GroupsService>>;

  const mockGroup = {
    id: 'group-id',
    name: 'Admin',
    permissions: {
      users: ['read', 'write'],
    },
    users: ['user-id'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue({
        data: mockGroup,
        meta: {
          code: GroupCodes.GROUP_CREATED,
        },
      }),

      findAll: jest.fn().mockResolvedValue({
        data: [mockGroup],
        meta: {
          code: GroupCodes.GROUP_FETCHED,
        },
      }),

      updatePermissions: jest.fn().mockResolvedValue({
        data: mockGroup,
        meta: {
          code: GroupCodes.GROUP_PERMISSIONS_UPDATED,
        },
      }),

      delete: jest.fn().mockResolvedValue({
        data: mockGroup,
        meta: {
          code: GroupCodes.GROUP_DELETED,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(GroupsController);
  });

  describe('create', () => {
    it('should create group', async () => {
      const dto: CreateGroupDto = {
        name: 'Admin',
      };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.meta.code).toBe(GroupCodes.GROUP_CREATED);
      expect(result.data.name).toBe('Admin');
    });
  });

  describe('findAll', () => {
    it('should return all groups', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result.meta.code).toBe(GroupCodes.GROUP_FETCHED);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions', async () => {
      const dto: UpdateGroupPermissionsDto = {
        permissions: {
          users: ['read', 'write'],
        },
      };

      const result = await controller.updatePermissions('group-id', dto);

      expect(service.updatePermissions).toHaveBeenCalledWith('group-id', dto);

      expect(result.meta.code).toBe(GroupCodes.GROUP_PERMISSIONS_UPDATED);
    });
  });

  describe('delete', () => {
    it('should delete group', async () => {
      const result = await controller.delete('group-id');

      expect(service.delete).toHaveBeenCalledWith('group-id');
      expect(result.meta.code).toBe(GroupCodes.GROUP_DELETED);
      expect(result.data.id).toBe(mockGroup.id);
    });
  });
});
