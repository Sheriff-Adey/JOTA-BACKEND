

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean } from 'class-validator';

export enum QuestionType{
      MultipleChoice= 'MultipleChoice',
      Essay ='Essay',
      YesNo = 'YesNo',
      FillInTheGap = 'FillInTheGap',
       TrueOrFalse = 'TrueOrFalse',
       QuestionsWithMedia = 'QuestionsWithMedia',
       QuestionsWithMultipleLanguage = 'QuestionsWithMultipleLanguage'
}


export enum DifficultyLevel{
      Difficult= 'Difficult',
      Easy ='Easy',
      Moderate = 'Moderate',

}
export class Option {
      @ApiProperty()
      @IsString()
      text: string;
    
 
      @ApiProperty()
      @IsBoolean()
      isCorrect: boolean;

      @ApiPropertyOptional({description:"data url for the file"})
      file?: string;
      

}

export class CreateQuestionDto {
      @ApiProperty()
      @IsString()
      content: string;

      @ApiProperty({
      enum: QuestionType, 
      enumName: 'QuestionType', 
      description: 'Question Type', 
      })
      @IsNotEmpty()
      @IsEnum(QuestionType)
      @IsString()
      questionType: string
      
      @ApiPropertyOptional()
      score?: string;
      
      @ApiPropertyOptional({
      type: [Option], 
      description: 'list of options',
      })
      options?: Option[];

    
      @ApiPropertyOptional({description:"data url for the file"})
      embeddedMedia?: string[];
 
      @ApiPropertyOptional()
      translations?:string;

      @ApiProperty({
            enum: DifficultyLevel, 
            enumName: 'DifficultyLevel', 
            description: 'Difficulty Level', 
      })
      @IsNotEmpty()
      @IsEnum(DifficultyLevel)
      @IsString()
      difficultyLevel: string

      @ApiProperty()
      itemId: string;

}


