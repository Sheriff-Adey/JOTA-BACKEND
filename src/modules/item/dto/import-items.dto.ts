import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean } from 'class-validator';
import { QuestionType } from 'src/modules/question/dto/create-question.dto';

export class ImportItemDto {
  @ApiProperty({
    enum: QuestionType, 
    enumName: 'QuestionType', 
    description: 'Question Type', 
  })
  @IsNotEmpty()
  @IsEnum(QuestionType)
  @IsString()
  questionType: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  questionTopic: string;


  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  difficultyLevel: string;

  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  itemBankId: string;
  

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  authorId: string;
  
  @ApiProperty({ type: 'string', format: 'binary' })
  //@IsNotEmpty()
   file?: any;

}
