import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { QuestionType } from 'src/modules/question/dto/create-question.dto';

export class AddMultipleItemToBankDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    itemIds: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  itemBankId?: string;


  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isLocalAuthoring: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}
