import { Model, Table, Column, DataType, BelongsToMany } from 'sequelize-typescript';
import { Item } from '../item/item.entity';
import { ItemTag } from '../item/item-tag.entity';

@Table
export class Tag extends Model<Tag> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  // Relationships
  @BelongsToMany(() => Item, () => ItemTag)
  items: Item[];
}


