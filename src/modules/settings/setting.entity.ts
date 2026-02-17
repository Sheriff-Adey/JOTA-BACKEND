import { Model, Table, Column, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';

@Table
export class Setting extends Model<Setting> {
  @Column({
    type: DataType.UUID, 
    allowNull: false,
    primaryKey: true, 
    defaultValue: DataType.UUIDV4,
    })
    id: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue:{
        allowAll:true,
        onInviteAcceptance: true,
        anHourToExam:true,
        onPushItem: true,
        atEODTrigger: true,
        forOnlineExamReg:true
    }
  })
  notificationPreferences: any;


  
  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue:{ 
      emailAuth: true,
      mobileAuth: true
    }
  })
 twoFactorSettings: any;

}

