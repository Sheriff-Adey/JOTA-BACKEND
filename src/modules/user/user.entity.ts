import { Model, Table, Column, DataType, HasMany, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';

import { Role } from '../role/role.entity';

// @Table(({ tableName: 'users' }))
@Table
export class User extends Model<User> {
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
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  firstName: string;

  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  lastName: string;

   
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  username?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location?: string;

  @ForeignKey(() => Role) 
  @Column({
    type: DataType.UUID, 
    allowNull: false,
  })
  roleId: string;

  @BelongsTo(() => Role) 
  role: Role;
  @Column({
    type: DataType.STRING, 
    allowNull: true, 
  })
  activationToken: string;

  @Column({
    type: DataType.BOOLEAN, 
    allowNull: false, 
    defaultValue:false
  })
  isActive: boolean;
  

}

