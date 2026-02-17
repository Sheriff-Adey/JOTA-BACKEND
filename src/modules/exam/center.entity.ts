import { Model, Table, Column, DataType, BelongsToMany, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from './exam.entity';
import { ExamCenter } from './exam-center.entity';
import { Candidate } from '../candidate/candidate.entity';


@Table
export class Center extends Model<Center> {
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

  

    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    location: string;

    @ForeignKey(() => User)
    adminId: string;
    @BelongsTo(() => User, { as: 'admin' })
    admin: User;
  
    @BelongsToMany(() => Exam, () => ExamCenter, 'centerId', 'examId')
    exams?: Exam[];
    
    
    @HasMany(() => Candidate)
    candidates?: Candidate[];


}


