import { Model, Table, Column, DataType, HasMany, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Item } from '../item/item.entity';
import { CandidateExam } from '../candidate-exam/candidate-exam.entity';
import { UserRole } from '../role/user-role.entity';
import { Role } from '../role/role.entity';
import { Exam } from '../exam/exam.entity';
import { Center } from '../exam/center.entity';

@Table
export class Candidate extends Model<Candidate> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
  })
  id: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  plainPassword?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  firstName: string;

  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  lastName: string;



  @BelongsToMany(() => Exam,() => CandidateExam,'candidateId','examId') 
  exams: Exam;
 

  @Column({
    type: DataType.STRING, 
    allowNull: false, 
  })
  status: string;
  

  
  @Column({
    type: DataType.STRING, 
    allowNull: false, 
  })
  assignedSubjects: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phoneNo?: string;

  
  @Column({
    type: DataType.STRING, 
    unique: true,
    allowNull: true, 
  })
  token?: string;
  
  
  @Column({
    type: DataType.TEXT, 
    allowNull: true, 
  })
  picture?: string;



  @Column({
    type: DataType.BOOLEAN, 
    allowNull: false, 
    defaultValue:false
  })
  imported: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue:false
  })
  isDeleted: boolean;

  // Add fingerprint credential fields
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fingerprintCredentialId?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  fingerprintPublicKey?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  fingerprintImage?: string;

  @ForeignKey(() => Center)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  centerId?: string;

  @BelongsTo(() => Center) 
  center?: Center;


  @HasMany(() => CandidateExam) // Use HasMany for the association
  exam: CandidateExam[];
 
}

