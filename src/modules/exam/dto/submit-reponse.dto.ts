import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";


export class PreviousQuestionDto {
   
 
  @ApiProperty()
  @IsString()
  examId: string;

 
  @ApiProperty()
  @IsString()
  candidateId: string;

  @ApiProperty()
  @IsString()
  sectionId: string;

  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsString()
  answer: string;


}

export class SubmitResponseDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsString()
    candidateId: string;
  
    @ApiProperty()
    @IsString()
    sectionId: string;

    @ApiProperty()
    @IsString()
    questionId: string;
  

    @ApiProperty()
    @IsString()
    answer: string;

    @ApiProperty()
    @IsNumber()
    noOfRetries: number;
  
  }
    

  export class SubmitExamDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsString()
    candidateId: string;

    @ApiProperty({ required: false })
    @IsString()
    submissionType?: string;

    @ApiProperty({ required: false })
    @IsString()
    submissionReason?: string;
  
  
  }
    

  
  export class SubmitSectionDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsString()
    candidateId: string;

    @ApiProperty()
    @IsString()
    sectionId: string;
  
  
  
  }
