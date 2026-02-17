import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPassDto {
 
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;
}
