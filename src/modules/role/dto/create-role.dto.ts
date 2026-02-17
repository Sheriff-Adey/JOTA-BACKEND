import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean } from 'class-validator';
import { IsArray } from 'sequelize-typescript';
import { QuestionType } from 'src/modules/question/dto/create-question.dto';

export class CreateRoleDto {

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
 description: string;

  @ApiProperty()
  @IsNotEmpty()
  priviledges: string[];


}
