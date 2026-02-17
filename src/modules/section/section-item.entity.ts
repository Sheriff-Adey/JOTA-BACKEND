import { Model, Table, ForeignKey, DataType, Column, BelongsTo, Index } from 'sequelize-typescript';
import { Section } from './section.entity';
import { Item } from '../item/item.entity';

@Table
export class SectionItem extends Model<SectionItem> {

  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
  })
  id: string;

@ForeignKey(() => Section)
@Index('sectionId_index')
sectionId: string;
@BelongsTo(() => Section, { as: 'section' })
section: Section;

@ForeignKey(() => Item)
@Index('itemId_index')
itemId: string;

@BelongsTo(() => Item, { as: 'item' })
item: Item;



}


