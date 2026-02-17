import { ApiProperty } from "@nestjs/swagger";
import {  IsString } from "class-validator";
import { IsArray } from 'class-validator';





export class  AddItemsToExamDto {
   
 
  @ApiProperty()
  @IsString()
  examId: string;

 
  @ApiProperty()
  @IsArray()
  itemIds: string[]

}
  