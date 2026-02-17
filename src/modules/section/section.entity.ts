import { Model, Table, Column, DataType, BelongsTo, BelongsToMany, ForeignKey, Index } from 'sequelize-typescript';
import { Exam } from '../exam/exam.entity';
import { Item } from '../item/item.entity';
import { SectionItem } from './section-item.entity';

@Table
export class Section extends Model<Section> {
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
  title?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  instructions: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  timeLimit: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  randomizeItems: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  difficultyLevels: any;

  @ForeignKey(() => Exam) 
  @Index('examId_index')
  examId: string;
  @BelongsTo(() => Exam)
  exam: Exam;

  @BelongsToMany(() => Item, () => SectionItem)
  items: Item[];
}


