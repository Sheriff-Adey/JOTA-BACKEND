import { Model, Table, Column, DataType, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Item } from './item.entity';

@Table
export class ItemFolder extends Model<ItemFolder> {
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
  description: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID, 
    allowNull: false,
  })
  ownerId: string;

  @BelongsTo(() => User)
  owner: User;

  @HasMany(() => Item)
  items: Item[];
}


