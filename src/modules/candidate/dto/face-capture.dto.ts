import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class FaceCaptureDto {
  
    @ApiProperty()
    @IsString()
    examId: string;

    @ApiPropertyOptional()
    centerId: string;

    @ApiProperty()
    @IsString()
    candidateId: string;

    @ApiProperty()
    @IsString()
    capturedFace: string;

}