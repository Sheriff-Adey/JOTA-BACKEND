import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDate, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";


export enum DeliveryMode{
    ONLINE = "online",
    ONPREMISE = "on-premise"
}

export enum ExamType{
    OPEN = "open",
    PASSWORDED = "passworded",
    FINGERPRINT = "fingerprint"
}

export enum ResultType {
    Percentage = 'percentage',
    PassorFail = 'passorfail',
    Points='points'
  }

export class ExamSection {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  instructions: string;

  @ApiProperty()
  @IsString()
  timing: string;

  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty()
  @IsNumber()
  noOfQuestions: number;
 
  @ApiProperty()
  difficultyLevels: {
    easy: number;
    moderate: number;
    difficult: number;
  };

}
export class CreateExamDto {
   
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsDateString()
  startTime: Date;

  @ApiProperty()
  @IsDateString()
  endTime: Date;

  @ApiProperty()
  @IsEnum(DeliveryMode)
  deliveryMode: string;

  @ApiProperty()
  @IsEnum(ExamType)
  type: string;

  @ApiProperty()
  @IsBoolean()
  randomizePerSection: boolean;

  @ApiProperty()
  @IsBoolean()
  randomizeOverall: boolean;

  @ApiProperty()
  @IsBoolean()
  faceCaptureRequired: boolean;

  @ApiProperty()
  @IsBoolean()
  setOverallTimer: boolean;

  @ApiPropertyOptional({description:"00:00:00"})
  @IsOptional()
  timing?: string;
  
  @ApiProperty()
  @IsBoolean()
  setSectionTimer: boolean;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiPropertyOptional()
  showBreakdown?: boolean;
  
  @ApiPropertyOptional()
  showResult?: boolean;

 
  @ApiProperty({description:"[{instructions:'',timing:'00:00:00',itemId:'',sectionName:'',noOfQuestions:0}]"})
  @IsArray()
  sections: ExamSection[];

  @ApiProperty({description:"['centerId']"})
  @IsArray()
  centers: any[];

  @ApiProperty({
    enum: ResultType,
    enumName: 'ResultType',
    description: 'Result Type',
  })
  @IsOptional()
  @IsEnum(ResultType)
  resultType: string

  @ApiProperty()
  @IsBoolean()
  calculatorEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  lockedScreenEnabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lockedScreenPassword?: string;

  }



  export class EditExamDto {
   
    @ApiProperty()
    @IsString()
    title: string;
  
    @ApiProperty()
    @IsDateString()
    startTime: Date;
  
    @ApiProperty()
    @IsDateString()
    endTime: Date;
  
    @ApiProperty()
    @IsEnum(DeliveryMode)
    deliveryMode: string;
  
    @ApiProperty()
    @IsEnum(ExamType)
    type: string;
  
    @ApiProperty()
    @IsBoolean()
    randomizePerSection: boolean;
  
    @ApiProperty()
    @IsBoolean()
    randomizeOverall: boolean;
  
    @ApiProperty()
    @IsBoolean()
    faceCaptureRequired: boolean;
  
    @ApiProperty()
    @IsBoolean()
    setOverallTimer: boolean;
  
    @ApiPropertyOptional({description:"00:00:00"})
    @IsOptional()
    timing?: string;
    
    @ApiProperty()
    @IsBoolean()
    setSectionTimer: boolean;
  
    @ApiPropertyOptional()
    instructions?: string;
  
    @ApiPropertyOptional()
    showBreakdown?: boolean;
    
    @ApiPropertyOptional()
    showResult?: boolean;
  
   
    @ApiProperty({description:"[{id:'',instructions:'',timing:'00:00:00',itemId:'',sectionName:'',noOfQuestions:0, difficultyLevel:{}}]"})
    @IsArray()
    sections: any[];
  
    @ApiProperty({description:"['centerId']"})
    @IsArray()
    centers: any[];
  
  @ApiProperty({
    enum: ResultType,
    enumName: 'ResultType',
    description: 'Result Type',
  })
  @IsOptional()
  @IsEnum(ResultType)
  resultType: string

  @ApiProperty()
  @IsBoolean()
  calculatorEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  lockedScreenEnabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lockedScreenPassword?: string;

  }
    


    export class ResultTypeDto {
  
    
      @ApiProperty({
        enum: ResultType, 
        enumName: 'ResultType', 
        description: 'Result Type', 
      })
      @IsOptional()
      @IsEnum(ResultType)
      resultType: string
    
    
      }



      export class SetExamNotificationSettingsDto {
        @ApiProperty()
        @IsBoolean()
        updateOnExamTiming:boolean;
        @ApiProperty()
        @IsBoolean()
        updateOnGradedResponses: boolean;
        @ApiProperty()
        @IsBoolean()
        updateOnExtraTime:boolean;
        
    }


    
  export class SetExamReminderDto {
   
    @ApiProperty()
    @IsString()
    subject: string;

    @ApiProperty()
    @IsString()
    message: string;
  
    @ApiProperty({description:"YYYY-MM-DD HH:mm:ss"})
    @IsString()
    scheduledDate: string;
  
    }
    
    export class EditExamReminderDto {
   
      @ApiProperty()
      @IsString()
      id: string;
  
      @ApiProperty()
      @IsString()
      subject: string;
  
      @ApiProperty()
      @IsString()
      message: string;
    
      @ApiProperty({description:"YYYY-MM-DD HH:mm:ss"})
      @IsString()
      scheduledDate: string;
    
      }

      export class VerifyUnlockPasswordDto {
        @ApiProperty()
        @IsString()
        examId: string;

        @ApiProperty()
        @IsString()
        password: string;
      }
      