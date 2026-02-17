import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from 'sequelize-typescript';
import { Exam } from './exam.entity';
import { Center } from './center.entity';
import { User } from '../user/user.entity';


@Table
export class ExamCenter extends Model<ExamCenter> {
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        primaryKey: true, 
        defaultValue: DataType.UUIDV4,
      })
      id: string;

  @ForeignKey(() => Exam)
  examId: string;
  @BelongsTo(() => Exam, { as: 'exam' })
  exam: Exam;



  @ForeignKey(() => Center)
   centerId: string;
  @BelongsTo(() => Center,{ as: 'center' })
   center: Center;

   @ForeignKey(() => User)
   adminId: string;
  @BelongsTo(() => User,{ as: 'user' })
   admin: User;


   @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false
  })
  isDownloaded?:boolean

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false
  })
  isSynced?:boolean
}
