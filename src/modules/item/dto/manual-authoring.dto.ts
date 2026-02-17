

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean } from 'class-validator';
import { QuestionType } from 'src/modules/question/dto/create-question.dto';

export class ManualAuthoringDto {


  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

    
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  topic: string;


  @ApiPropertyOptional()
  difficultyLevel: string;


  @ApiPropertyOptional()
  @IsString()
  authorId: string;
}
