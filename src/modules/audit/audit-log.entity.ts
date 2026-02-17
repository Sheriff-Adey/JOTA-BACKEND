import { Model, Table, Column, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from '../user/user.entity';

@Table
export class AuditLog extends Model<AuditLog> {
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
  action: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

}
