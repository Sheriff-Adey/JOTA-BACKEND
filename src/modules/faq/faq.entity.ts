import { Model, Table, Column, DataType, BelongsToMany } from 'sequelize-typescript';


@Table
export class Faq extends Model<Faq> {
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
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string


  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image?: string

}


