import { ApiProperty } from "@nestjs/swagger";
import {  IsString } from "class-validator";
import { IsArray } from 'class-validator';





export class  AddInstructionsToSectionDto {
   
  @ApiProperty()
  @IsString()
  sectionId: string;

 
  @ApiProperty()
  @IsArray()
  instructions: string[]

}
  