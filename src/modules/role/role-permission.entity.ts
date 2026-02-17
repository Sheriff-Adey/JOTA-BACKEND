import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from 'sequelize-typescript';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Table
export class RolePermission extends Model<RolePermission> {
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        primaryKey: true, 
        defaultValue: DataType.UUIDV4,
      })
      id: string;

  @ForeignKey(() => Role)
  roleId: string;
  @BelongsTo(() => Role, { as: 'role' })
  role: Role;

  @ForeignKey(() => Permission)
  permissionId: string;
  @BelongsTo(() => Permission,{ as: 'permission' })
  permission: Permission;

}
