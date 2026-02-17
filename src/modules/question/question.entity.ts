import { Model, Table, Column, DataType, BelongsTo, BelongsToMany, ForeignKey, HasMany, Index } from 'sequelize-typescript';
import { Item } from '../item/item.entity';

@Table
export class Question extends Model<Question> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
    id: string;
  @Column(DataType.TEXT)
  content: string;

  @Column(DataType.TEXT)
  type: string;
 
  @Column(DataType.TEXT)
  score?: string;
   
  
  @Column({
    type: DataType.JSON,
    allowNull: true,
    
  })
  options?: any;

  @Column(DataType.STRING)
  correctOption?: string;

  @Column(DataType.JSON)  
  embeddedMedia?: string[];

  @Column(DataType.TEXT)  
  translations?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  difficultyLevel?:string;

  @Column({
    type: DataType.NUMBER,
    allowNull: true
  })
  questionIndex:number;

  @ForeignKey(() => Item)
  @Index('itemId_index')
  @Column({
    type: DataType.UUID, 
    allowNull: false
    })
  itemId: string;

  @BelongsTo(() => Item, 'itemId')
  item: Item;
}

