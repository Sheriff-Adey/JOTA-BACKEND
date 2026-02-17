import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsEnum, IsBoolean } from 'class-validator';


export class SetNotificationPrefDto {
    @ApiProperty()
    @IsBoolean()
    allowAll:boolean;
    @ApiProperty()
    @IsBoolean()
    onInviteAcceptance: boolean;
    @ApiProperty()
    @IsBoolean()
    anHourToExam:boolean;
    @ApiProperty()
    @IsBoolean()
    onPushItem: boolean;
    @ApiProperty()
    @IsBoolean()
    atEODTrigger: boolean;
    @ApiProperty()
    @IsBoolean()
    forOnlineExamReg:boolean
}




export class SetTwoFactorDto {
    @ApiProperty()
    @IsBoolean()
    emailAuth:boolean;
    @ApiProperty()
    @IsBoolean()
    mobileAuth: boolean;
 
}

