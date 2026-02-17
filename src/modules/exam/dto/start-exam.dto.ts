import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";


export class StartExamDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsString()
    candidateId: string;
  
    @ApiProperty()
    @IsString()
    sectionId?: string;
  
  }
    
  export class RestartExamAllDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsArray()
    candidateIds: string[];
  
  
  }


  export class LogOutCandidateDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsArray()
    candidateIds: string[]; 
  
  
  }
    

  
  export class DownloadExamDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsString()
    centerId: string; 
  
  
  }

   
  export class SyncExamDto {
   
    centerId: string;
    
    exam: any;
  

    responses: any[]; 


    progresses:any[];

    grades:any[];
    
    candidateExams:any[]
  
  
  }

  export class SyncProgressDto {
   
    centerId: string;
    
    exam: any;
  
    progresses:any[];
  }
 
  export class SyncResponseDto {
   
    centerId: string;
    
    exam: any;
  
    responses:any[];
  }
 
  export class SyncGradeDto {
   
    centerId: string;
    
    exam: any;
  
    grades:any[];
  }
 
  export class SyncCandidateExamDto {
   
    centerId: string;
    
    exam: any;
  
    candidateExams:any[];

    candidateSections:any[];
  }
 
  export class SyncCandidateSectionDto {
   
    centerId: string;
    
    exam: any;
  
    candidateSections:any[];
  }


  export class TriggerEndOfDayDto {
   
 
    @ApiProperty()
    @IsString()
    examId: string;
  
   
    @ApiProperty()
    @IsString()
    centerId: string; 
  
  
  }

  export class FileUploadDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    file: any;
  }