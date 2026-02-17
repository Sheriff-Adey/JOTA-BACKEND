import { Model, Table, Column, DataType, BelongsTo, ForeignKey, Index } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from '../exam/exam.entity';
import { Candidate } from '../candidate/candidate.entity';

@Table
export class CandidateExam extends Model<CandidateExam> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
    id: string;
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  startTime: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  endTime: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isSubmitted: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isOnline: boolean;


  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  faceCaptured: string;
 

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  score: number;

  @ForeignKey(() => Candidate) 
  @Index('candidateId_index')
  @Column
  candidateId: string;

  @BelongsTo(() => Candidate)
  candidate: Candidate;

  @ForeignKey(() => Exam) 
  @Index('examId_index')
  @Column
  examId: string;

  @BelongsTo(() => Exam)
  exam: Exam;

  @Column
  assignedSubjects?:string;

  @Column
  timer?:string;

  
  @Column
  centerId?:string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue:false
  })
  isLoggedIn: boolean;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'How the exam was submitted: manual, timeout, inactivity, fullscreen_exit, window_exit, app_switching'
  })
  submissionType: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Detailed reason for submission if auto-submitted'
  })
  submissionReason: string;

}
