import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class IncreaseTimeDto {
    
    @ApiProperty()
    @IsArray()
    candidateIds: string[];
   
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty({description:"00:00:00"})
    @IsString()
    time: string;

  }


  export class IncreaseSectionTimingDto {
    
    @ApiProperty()
    @IsArray()
    candidateIds: string[];
   
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty({description:"[{sectionId:'tth56', time:'00:00:00'},{sectionId:'tth57', time:'00:00:00'}]"})
    sectionTimers: any;

  }