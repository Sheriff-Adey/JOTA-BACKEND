

import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from 'sequelize-typescript';
import { Exam } from './exam.entity';
import { Center } from './center.entity';
import { Subject } from './subject.entity';


@Table
export class ExamSubject extends Model<ExamSubject> {
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

  @ForeignKey(() => Subject)
   subjectId: string;
  @BelongsTo(() => Subject,{ as: 'subject' })
   subject: Subject;

}
