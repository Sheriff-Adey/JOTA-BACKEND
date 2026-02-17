import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum } from 'class-validator';


export class CreateNotificationDto {
  

  subject: string;

  message: string;
 
  isScheduled: boolean;

  userId?: string;

  sentOn: string;

}
