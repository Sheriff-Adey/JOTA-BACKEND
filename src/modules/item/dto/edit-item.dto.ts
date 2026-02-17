import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum } from 'class-validator';
import { QuestionType } from 'src/modules/question/dto/create-question.dto';

export class EditItemDto {

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(QuestionType)
  questionType: string;
  

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
  questionTopic: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  itemBankId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  authorId: string;
}
