import { Model, Table, Column, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from '../exam/exam.entity';
import { Candidate } from '../candidate/candidate.entity';

@Table
export class Grade extends Model<Grade> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
    id: string;

    @ForeignKey(() => Candidate) 
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        })
    candidateId: string;

    @BelongsTo(() => Candidate)
    candidate: Candidate;

    @ForeignKey(() => Exam) 
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        })
     examId: string;

     @BelongsTo(() => Exam)
     exam: Exam;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  essayGrade?: string;

  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  nonEssayGrade?:string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  totalNoOfQuestion?: number;
  
 

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  noOfAttemptedQuestions: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  sectionGrades: any;



}

