import { Model, Table, Column, DataType, BelongsTo, ForeignKey, Index } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from '../exam/exam.entity';
import { Candidate } from '../candidate/candidate.entity';

@Table
export class CandidateProgress extends Model<CandidateProgress> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
    id: string;

    @ForeignKey(() => Candidate) 
    @Index('candidateId_index')
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        })
    candidateId: string;

    @BelongsTo(() => Candidate)
    candidate: Candidate;

    @ForeignKey(() => Exam) 
    @Index('examId_index')
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
  currentSectionId: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue:{}
  })
  questionStatus: any;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue:{}
  })
  sectionStatus: any;


  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1
  })
 loginAttempts: number;

 @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  networkFailures: number;


  @Column({
    type: DataType.DATE,
    allowNull: false,
   
  })
  lastLogin:  any;

 



}

