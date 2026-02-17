import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class UpdateProfileDto {
   
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    userId: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;


  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  location: string;
  
}
