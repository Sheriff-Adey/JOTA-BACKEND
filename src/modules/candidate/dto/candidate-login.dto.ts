import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";



export class PasswordedExamLoginDto {
  
    @ApiProperty()
    @IsString()
    username: string;

     
    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty()
    @IsString()
    examId: string;
}



export class OpenExamLoginDto {
  
    @ApiProperty()
    @IsString()
    username: string;
    
    
    @ApiProperty()
    @IsString()
    examId

}