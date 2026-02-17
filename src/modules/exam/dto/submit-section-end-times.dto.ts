import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SectionEndTimeDto {
  @IsString()
  sectionId: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  completed: boolean;
}

export class SubmitSectionEndTimesDto {
  @IsString()
  examId: string;

  @IsString()
  candidateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionEndTimeDto)
  sectionEndTimes: SectionEndTimeDto[];
}

