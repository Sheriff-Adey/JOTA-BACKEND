import { Model, Table, Column, DataType, BelongsToMany, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from './exam.entity';
import { ExamCenter } from './exam-center.entity';
import { Candidate } from '../candidate/candidate.entity';
import { Question } from '../question/question.entity';


@Table
export class CandidateResponse extends Model<CandidateResponse> {
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        primaryKey: true, 
        defaultValue: DataType.UUIDV4, 
      })
      id: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue:{}
  })
  responses: any;

  @ForeignKey(() => Exam)
  @Column({
    type: DataType.UUID, 
    allowNull: false
    })
   examId: string;

  @BelongsTo(() => Exam, 'examId')
  exam: Exam;

  @ForeignKey(() => Candidate)
  @Column({
    type: DataType.UUID, 
    allowNull: false
    })
   candidateId: string;

    @BelongsTo(() => Candidate, 'candidateId')
    candidate: Candidate;
    
  
}


