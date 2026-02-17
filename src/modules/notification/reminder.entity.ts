import { Model, Table, Column, DataType, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { Exam } from '../exam/exam.entity';


@Table
export class Reminder extends Model<Reminder> {
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
    type: DataType.TEXT,
    allowNull: false,
  })
  message:string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue:false,
  })
  scheduledDate:string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false,
  })
  isSent:boolean;

 

  @ForeignKey(() => Exam) 
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  examId?:string;

  @BelongsTo(() => Exam)
  exam: Exam;

}

