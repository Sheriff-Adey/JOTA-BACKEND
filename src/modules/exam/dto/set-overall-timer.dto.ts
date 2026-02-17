import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class  SetOverallTimerDto {
   

    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty({description:"00:00:00"})
    @IsString()
    time: string;
  
  }


  export class  SetSectionTimerDto {
   
    @ApiProperty()
    @IsString()
    sectionId: string;

    @ApiProperty({description:"00:00:00"})
    @IsString()
    time: string;
  
  }


  export class GetRemainingSectionTimeDto {
    
    @ApiProperty()
    @IsString()
    candidateId: string;
   
    @ApiProperty()
    @IsString()
    sectionId: string;

  }


  export class GetRemainingExamTimeDto {
    
    @ApiProperty()
    @IsString()
    candidateId: string;
   
    @ApiProperty()
    @IsString()
   examId: string;

  }