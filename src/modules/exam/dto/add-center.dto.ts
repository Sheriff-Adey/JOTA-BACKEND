import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";


export class  AddCenterDto {
   
    @ApiProperty()
    @IsString()
    name: string;
  
   
    @ApiProperty()
    @IsString()
    location: string;

  
  }

  export class  AllowReLoginDto {
   
   
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsBoolean()
    allow: boolean;

  
  }

  export class  UploadEssayGradeDto {
   
   
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty({ type: 'string', format: 'binary' })
    file?: any;

  
  }



  export class  SpecificCandidateExamDto {
   
   
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsString()
    candidateId: string;

  
  }