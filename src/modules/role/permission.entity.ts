import { Model, Table, Column, DataType, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { RolePermission } from './role-permission.entity';
import {Role} from './role.entity';

@Table
export class Permission extends Model<Permission> {
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
    unique: true
  })
  name: string;

  // Removed description column as it does not exist in the database schema
  // @Column({
  //   type: DataType.STRING,
  //   allowNull: true,
  // })
  // description?: string;

//   @BelongsToMany(() => Role, () => RolePermission, 'permissionId', 'roleId')
// roles: Role[];

@BelongsToMany(() => Role, () => RolePermission, 'permissionId', 'roleId')
role: Role[];

 
}


