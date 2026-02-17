import { Model, Table, ForeignKey, Column, DataType } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Role } from './role.entity';


export class UserRole extends Model<UserRole> {
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        primaryKey: true, 
        defaultValue: DataType.UUIDV4,
      })
      id: string;
  @ForeignKey(() => User)
  userId: number;

  @ForeignKey(() => Role)
  roleId: number;
}


