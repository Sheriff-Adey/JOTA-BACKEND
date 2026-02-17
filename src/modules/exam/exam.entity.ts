import { Model, Table, Column, DataType, BelongsToMany, HasMany } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Section } from '../section/section.entity';
import { CandidateExam } from '../candidate-exam/candidate-exam.entity';
import { Item } from '../item/item.entity';
import { ExamItem } from './exam-items.entity';
import { Center } from './center.entity';
import { ExamCenter } from './exam-center.entity';
import { Candidate } from '../candidate/candidate.entity';
import { ResultType } from './dto/create-exam.dto';
import { Reminder } from '../notification/reminder.entity';

@Table
export class Exam extends Model<Exam> {
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
  title: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startTime: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  endTime: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  deliveryMode: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true, 
  })
  randomizePerSection: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true, 
  })
  randomizeOverall: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false, 
  })
  faceCaptureRequired: boolean;

  
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true, 
  })
  allowReLogin: boolean;

  
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false, 
  })
  allowComputerChange: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  setOverallTimer: boolean;

  @Column({
    type: DataType.STRING,
    allowNull:true,
  })
  timeLimit?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  setSectionTimer: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  regLink: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  showResult?: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  showBreakdown?: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue:ResultType.Percentage
  })
  resultType?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false
  })
  inviteSent: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  calculatorEnabled: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  lockedScreenEnabled: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  lockedScreenPassword?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  instructions?: string;

  
  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue:{
        updateOnExamTiming:true,
        updateOnGradedResponses: true,
        updateOnExtraTime:true
    }
  })
  notificationSettings: any;
 

  @BelongsToMany(() => Item, () => ExamItem)
  items: Item[];


  @HasMany(() => Section)
  sections?: Section[];

  @HasMany(() => Reminder)
  reminders?: Reminder[];

  @BelongsToMany(() => Candidate,()=>CandidateExam,'examId','candidateId')
  candidates?: Candidate[];
  
  @BelongsToMany(() => Center,()=>ExamCenter,'examId','centerId')
  centers?: Center[];

}


