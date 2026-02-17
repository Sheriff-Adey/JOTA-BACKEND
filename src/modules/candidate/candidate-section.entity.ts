import { Model, Table, Column, DataType, BelongsTo, ForeignKey, Index } from 'sequelize-typescript';
import { Candidate } from '../candidate/candidate.entity';
import { Section } from '../section/section.entity';

@Table
export class CandidateSection extends Model<CandidateSection> {
   @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
    id: string;

    @ForeignKey(() => Candidate) 
    @Index('candidateId_index')
    @Column({
        type: DataType.UUID, 
        allowNull: false
    })
    candidateId: string;

    @BelongsTo(() => Candidate)
    candidate: Candidate;

    @ForeignKey(() => Section) 
    @Index('sectionId_index')
    @Column({
        type: DataType.UUID, 
        allowNull: false,
        })
     sectionId: string;

     @BelongsTo(() => Section)
     section: Section;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    timer?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
      })
    endTime: string;


}

