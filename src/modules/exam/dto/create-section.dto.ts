import { ApiProperty } from "@nestjs/swagger";
import {  IsString } from "class-validator";






export class  CreateSectionDto {
   
 
  @ApiProperty()
  @IsString()
  examId: string;

 
  @ApiProperty()
  @IsString()
  itemId: string;

}
  