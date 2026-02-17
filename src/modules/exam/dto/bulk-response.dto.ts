import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsString, ValidateNested } from "class-validator";

 class Option {
    @ApiProperty()
    @IsString()
    file: string | null;
    @ApiProperty()
    @IsString()
    text: string;
  }
  
  class Question {
    @ApiProperty()
    @IsString()
    id: string;
    @ApiProperty()
    @IsString()
    content: string;
    @ApiProperty()
    @IsString()
    type: string;
    @ApiProperty()
    @ValidateNested()
    @Type(() => Option)
    options: Option[];
    @ApiProperty()
    @IsString()
    embeddedMedia: string | null;
  }
  
  class QuestionDto {
    @ApiProperty()
    @IsNumber()
    questionNum: number;
    @ApiProperty()
    @ValidateNested()
    @Type(() => Question)
    question: Question;
    @ApiProperty()
    @IsBoolean()
    attempted: boolean;
    @ApiProperty()
    @IsString()
    sectionId: string;
    @ApiProperty()
    @IsString()
    response: string | null;
    @ApiProperty()
    @IsBoolean()
    firstExamQuestion: boolean;
    @ApiProperty()
    @IsBoolean()
    lastExamQuestion: boolean;
    @ApiProperty()
    @IsBoolean()
    current: boolean;
    @ApiProperty()
    @IsNumber()
    totalQuestionsInSection: number;
  }
  

  class SectionStatus {
    @ApiProperty()
    @IsString()
    sectionId: string;
    @ApiProperty()
    @IsBoolean()
    completed: boolean;
    @ApiProperty()
    @IsNumber()
    noOfQuestions: number;
    @ApiProperty()
    @IsString()
    subject: string;
    @ApiProperty()
    @IsString()
    startTime: string;
    @ApiProperty()
    @IsString()
    endTime: string;
  }
  



  export class BulkResponseDto {
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsString()
    candidateId: string;

    @ApiProperty()
    @IsString()
    currentSectionId: string;
    
    @ApiProperty()
    @IsNumber()
    loginAttempts:number;

    @ApiProperty()
    @IsString()
    lastLogin:string;

    @ApiProperty()
    @IsNumber()
    networkFailures:number;

    @ApiProperty()
    // @ValidateNested({ each: true })
    // @Type(() => QuestionDto)
    questionStatus: QuestionDto[];
    

    @ApiProperty()
    // @ValidateNested({ each: true })
    // @Type(() => SectionStatus)
    sectionStatus: SectionStatus[];
  }