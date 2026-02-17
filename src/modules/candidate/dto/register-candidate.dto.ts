import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsString, isArray } from "class-validator";


export enum CandidateStatus{
    PENDING='pending',
    ACCEPTED='accepted',
    DECLINED='declined'
}

export class  RegisterCandidateForPremiseDto {

    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    centerId: string;

    @ApiProperty()
    @IsString()
    firstName: string;


    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    candidateId?: string;

    @ApiProperty()
    @IsString()
    plainPassword?: string;

    @ApiPropertyOptional()
    @IsString()
    email?: string;

    @ApiProperty()
    @IsArray()
    subject: string[];
    

    
    @ApiProperty()
    @IsString()
    photo: string;
  }

  export class  ReassignToCenterDto {
   
    @ApiProperty()
    @IsString()
    examId: string;
     
    @ApiProperty()
    centerId: string;

    @ApiProperty()
    @IsString()
    candidateId: string;

    
  
  }

  export class  ReassignSubjectDto {
   
    @ApiProperty()
    @IsString()
    examId: string;
     
    @ApiProperty()
    @IsString()
    candidateId: string;

    @ApiProperty()
    @IsArray()
    subjects: string[];

    
  
  }
  export class  RegisterCandidateForOnlineDto {

    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsString()
    firstName: string;


    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    candidateId?: string;

    @ApiProperty()
    @IsString()
    plainPassword?: string;

    @ApiPropertyOptional()
    @IsString()
    email?: string;

    @ApiProperty()
    @IsArray()
    subject: string[];

    @ApiProperty()
    @IsString()
    photo: string;
    
  }
