import { Table, Model, ForeignKey, BelongsTo, Column, DataType } from 'sequelize-typescript';
import { Item } from './item.entity';
import { Tag } from '../tag/tag.entity';

@Table
export class ItemTag extends Model<ItemTag> {
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        primaryKey: true, 
        defaultValue: DataType.UUIDV4,
      })
      id: string;
  @ForeignKey(() => Item)
  itemId: string;
  @BelongsTo(() => Item)
  item: Item;

  @ForeignKey(() => Tag)
  tagId: string;
  @BelongsTo(() => Tag)
  tag: Tag;
}
