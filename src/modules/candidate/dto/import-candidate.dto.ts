import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";


export enum CandidateStatus{
    PENDING='pending',
    INVITED='invited',
    ACCEPTED='accepted',
    DECLINED='declined'
}

export enum InviteMethod{
    EMAIL="email",
    SMS="sms",
    BOTH="both"
}

export class  ImportCandidateDto {
   
    @ApiProperty()
    @IsString()
    examId: string;

     
    @ApiPropertyOptional()
    centerId?: string;


    @ApiProperty({ type: 'string', format: 'binary' })
     file?: any;

  }


  export class  InviteCandidateDto {
   
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiProperty()
    @IsEnum(InviteMethod)
    method: string;

  }