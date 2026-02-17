import { Model, Table, Column, DataType, ForeignKey, Index, BelongsTo, CreatedAt } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Exam } from '../exam/exam.entity';
import { Candidate } from '../candidate/candidate.entity';

@Table({
  tableName: 'violations',
  timestamps: true,
})
export class Violation extends Model<Violation> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @ForeignKey(() => Exam)
  @Index('examId_index')
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  examId: string;

  @BelongsTo(() => Exam)
  exam: Exam;

  @ForeignKey(() => Candidate)
  @Index('candidateId_index')
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  candidateId: string;

  @BelongsTo(() => Candidate)
  candidate: Candidate;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: 'Type of violation: fullscreen, tab_switch, window_exit, app_switching, inactivity, etc.',
  })
  violationType: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Detailed description of the violation',
  })
  violationReason: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: 'Additional metadata about the violation (browser info, screenshots, etc.)',
  })
  metadata: object;
}

