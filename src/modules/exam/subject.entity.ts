import { Model, Table, Column, DataType, BelongsToMany, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from './exam.entity';
import { ExamCenter } from './exam-center.entity';
import { ExamSubject } from './exam-subject.entity';


@Table
export class Subject extends Model<Subject> {
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
  name: string;


  
  @BelongsToMany(() => Exam, () => ExamSubject, 'examId', 'subjectId')
  exams?: Exam[];
  
 

}


