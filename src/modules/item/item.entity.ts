import { Model, Table, Column, DataType, BelongsTo, BelongsToMany, ForeignKey, HasMany } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Tag } from '../tag/tag.entity';
import { ItemTag } from './item-tag.entity';
import { ItemFolder } from './item-folder.entity';
import { Question } from '../question/question.entity';
import { ExamItem } from '../exam/exam-items.entity';
import { Exam } from '../exam/exam.entity';

@Table
export class Item extends Model<Item> {
@Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
  id: string;
 
  
  @Column({
    type:DataType.ENUM('MultipleChoice', 'Essay', 'YesNo', 'FillInTheGap',"TrueOrFalse","QuestionsWithMedia","QuestionsWithMultipleLanguage"),
    allowNull: true,
  })
  questionType?:string;
  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?:string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false
  })
  isLocalAuthoring:boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true
  })
  isSynced:boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  difficultyLevel:string;
  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  language?:string;
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  questionSubject:string;
  
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  questionTopic:string;
  
  @ForeignKey(() => ItemFolder) // Specify the referenced model
  @Column({
    type: DataType.UUID, 
    allowNull: true,
  })
  folderId?:string;

  // Relationships
  @BelongsTo(() => ItemFolder)
  folder?: ItemFolder;

  @ForeignKey(() => User) 
  @Column({
    type: DataType.UUID, 
    allowNull: true,
  })
  authorId?:string;

  // Relationships
  @BelongsTo(() => User)
  author: User;

  @BelongsToMany(() => Exam, () => ExamItem)
  exams: Exam[];

  @BelongsToMany(() => Tag, () => ItemTag)
  tags: Tag[];

  @HasMany(() => Question, 'itemId')
  questions: Question[];
}

