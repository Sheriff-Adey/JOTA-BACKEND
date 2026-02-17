import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
  
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
  RoleId:string;

}


export class EditAdminDto {
  
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
  RoleId:string;

}

export class AddLocalAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
  
  @ApiProperty()
  @IsNotEmpty()
  firstName: string;
  
    
  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  examId:string;
    
  @ApiProperty()
  @IsNotEmpty()
  centerId:string;

}


export class LocalAdminLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;
  
  @ApiProperty()
  @IsNotEmpty()
  password: string;

}