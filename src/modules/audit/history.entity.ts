import { Model, Table, Column, DataType, ForeignKey, Index, BelongsTo } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from '../exam/exam.entity';

@Table
export class ExamHistory extends Model<ExamHistory> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4
  })
  id: string;
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  tableName: string;

  @Column({
    type: DataType.ENUM('INSERT','DELETE','UPDATE'),
    allowNull: false,
  })
  operation: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  recordId: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false
  })
  isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  centerAffected?: string;
 
  @ForeignKey(() => Exam) 
  @Index('examId_index')
  @Column({
    type: DataType.UUID
  })
  examId: string;

  @BelongsTo(() => Exam)
  exam: Exam;
}
