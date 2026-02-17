import { Model, Table, Column, DataType, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';


@Table({ tableName: 'Roles' })
export class Role extends Model<Role> {
  @Column({
      type: DataType.UUID, 
      allowNull: false,
      primaryKey: true, 
      defaultValue: DataType.UUIDV4,
    })
    id: string;
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  // Removed description field as per user request

  // @BelongsToMany(() => Permission, () => RolePermission)
  // permissions: Permission[];

  @BelongsToMany(() => Permission, () => RolePermission, 'roleId', 'permissionId')
  permissions: Permission[];
 
}


