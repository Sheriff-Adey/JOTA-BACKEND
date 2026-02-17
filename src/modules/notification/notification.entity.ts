import { Model, Table, Column, DataType, BelongsTo, BelongsToMany, ForeignKey, HasMany } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Tag } from '../tag/tag.entity';
import { Question } from '../question/question.entity';

@Table
export class Notification extends Model<Notification> {
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
  subject:string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  message:string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false,
  })
  read:boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false,
  })
  isScheduled:boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
   
  })
  sentOn:  any;

  @ForeignKey(() => User) 
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId:string;

  @BelongsTo(() => User)
  user: User;

}

