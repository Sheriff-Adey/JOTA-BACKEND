import { Model, Table, Column, DataType, HasMany, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Item } from '../item/item.entity';
import { CandidateExam } from '../candidate-exam/candidate-exam.entity';
import { UserRole } from '../role/user-role.entity';
import { Role } from '../role/role.entity';
import { User } from './user.entity';

@Table
export class Token extends Model<Token> {
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
  token: string;

  @ForeignKey(() => User) 
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  ownerId: string;




 


}

