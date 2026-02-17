

import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from 'sequelize-typescript';
import { Exam } from './exam.entity';
import { Item } from '../item/item.entity';


@Table
export class ExamItem extends Model<ExamItem> {
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        primaryKey: true, 
        defaultValue: DataType.UUIDV4,
      })
      id: string;

  @ForeignKey(() => Item)
  itemId: string;
  @BelongsTo(() => Item, { as: 'item' })
  item: Item;

  @ForeignKey(() => Exam)
  examId: string;
  @BelongsTo(() => Exam, { as: 'exam' })
  exam: Exam;

}
