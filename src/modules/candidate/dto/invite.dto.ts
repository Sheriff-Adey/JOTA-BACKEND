import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";



export class CancelInviteDto {
  
    @ApiProperty()
    @IsString()
    candidateIds: string[];

     
    @ApiProperty()
    @IsString()
    examId: string;
}



export class ResendInviteDto {
  
    @ApiProperty()
    @IsString()
    candidateIds: string[];

     
    @ApiProperty()
    @IsString()
    examId: string;
}

export class ReAssignSubjectDto {
  
    @ApiProperty()
    @IsString()
    candidateIds: string[];

     
    @ApiProperty()
    @IsString()
    examId: string;

    
}

