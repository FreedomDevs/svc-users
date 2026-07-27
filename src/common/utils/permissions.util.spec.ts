import { PermissionsUtil } from './permissions.util';

describe('PermissionsUtil', () => {
  describe('flatten', () => {
    it('should flatten permissions', () => {
      expect(
        PermissionsUtil.flatten({
          users: ['read', 'write'],
          admin: ['delete'],
        }),
      ).toEqual(['users:read', 'users:write', 'admin:delete']);
    });

    it('should return empty array for empty object', () => {
      expect(PermissionsUtil.flatten({})).toEqual([]);
    });

    it('should return empty array for null', () => {
      expect(PermissionsUtil.flatten(null as any)).toEqual([]);
    });

    it('should trim whitespace', () => {
      expect(
        PermissionsUtil.flatten({
          ' users ': [' read ', ' write '],
        }),
      ).toEqual(['users:read', 'users:write']);
    });

    it('should ignore empty service names', () => {
      expect(
        PermissionsUtil.flatten({
          '': ['read'],
          '   ': ['write'],
          users: ['read'],
        }),
      ).toEqual(['users:read']);
    });

    it('should ignore empty actions', () => {
      expect(
        PermissionsUtil.flatten({
          users: ['read', '', '   ', 'write'],
        }),
      ).toEqual(['users:read', 'users:write']);
    });

    it('should ignore non-array values', () => {
      expect(
        PermissionsUtil.flatten({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          users: 'read' as any,
          admin: ['delete'],
        }),
      ).toEqual(['admin:delete']);
    });

    it('should remove duplicates', () => {
      expect(
        PermissionsUtil.flatten({
          users: ['read', 'read', 'write', 'write'],
        }),
      ).toEqual(['users:read', 'users:write']);
    });
  });

  describe('unflatten', () => {
    it('should unflatten permissions', () => {
      expect(
        PermissionsUtil.unflatten([
          'users:read',
          'users:write',
          'admin:delete',
        ]),
      ).toEqual({
        users: ['read', 'write'],
        admin: ['delete'],
      });
    });

    it('should return empty object for empty array', () => {
      expect(PermissionsUtil.unflatten([])).toEqual({});
    });

    it('should return empty object for null', () => {
      expect(PermissionsUtil.unflatten(null as any)).toEqual({});
    });

    it('should trim whitespace', () => {
      expect(
        PermissionsUtil.unflatten([' users : read ', ' users : write ']),
      ).toEqual({
        users: ['read', 'write'],
      });
    });

    it('should ignore invalid permissions', () => {
      expect(
        PermissionsUtil.unflatten(['', 'abc', ':read', 'users:', 'users:read']),
      ).toEqual({
        users: ['read'],
      });
    });

    it('should remove duplicates', () => {
      expect(
        PermissionsUtil.unflatten([
          'users:read',
          'users:read',
          'users:write',
          'users:write',
        ]),
      ).toEqual({
        users: ['read', 'write'],
      });
    });

    it('should group permissions by service', () => {
      expect(
        PermissionsUtil.unflatten([
          'users:read',
          'admin:delete',
          'users:write',
          'admin:create',
        ]),
      ).toEqual({
        users: ['read', 'write'],
        admin: ['delete', 'create'],
      });
    });
  });

  describe('round-trip', () => {
    it('should preserve permissions after flatten -> unflatten', () => {
      const input = {
        users: ['read', 'write'],
        admin: ['delete'],
      };

      expect(PermissionsUtil.unflatten(PermissionsUtil.flatten(input))).toEqual(
        input,
      );
    });

    it('should preserve permissions after unflatten -> flatten', () => {
      const input = ['users:read', 'users:write', 'admin:delete'];

      expect(PermissionsUtil.flatten(PermissionsUtil.unflatten(input))).toEqual(
        input,
      );
    });
  });
});
