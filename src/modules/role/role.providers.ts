
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';

export const rolesProviders = [
  {
    provide: 'ROLES_REPOSITORY',
    useValue: Role,
  },
  {
    provide: 'ROLEPERMISSIONS_REPOSITORY',
    useValue: RolePermission,
  },

  {
    provide: 'PERMISSIONS_REPOSITORY',
    useValue: Permission,
  },
];