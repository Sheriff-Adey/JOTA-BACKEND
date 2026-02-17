import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { QuestionType } from 'src/modules/question/dto/create-question.dto';

export class CreateItemDto {
  name?: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(QuestionType)
  questionType?: string;
  

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  difficultyLevel: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  questionSubject: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  questionTopic?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  itemBankId?: string;

  @ApiPropertyOptional()
  @IsString()
  authorId: string;
}



export class pushItemToWebDto {
 

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  itemIds: string[];

}


export class syncItemToWebDto {
 
  items: any[];

}
