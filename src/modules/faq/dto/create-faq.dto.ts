import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';


export class CreateFaqDto {

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
 description: string;

  @ApiPropertyOptional()
  @IsOptional()
  image?: string;


}
