import {
    Body,
    Controller,
    Post,
    UsePipes,
    ValidationPipe,
    Get,
    Param,
    Delete,
    Put,
    Req,
    Session,
    Query,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFile,
  } from '@nestjs/common';
import { ApiResponse } from '../../app.interface';
import {  ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { SetNotificationPrefDto, SetTwoFactorDto } from './dto/set-notification-pref.dto';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';


  
@Controller('notification')
@UsePipes(ValidationPipe)
export class NotificationController {
constructor(private readonly notificationService: NotificationService) {}

@ApiTags("Super-Admin Module")
    @Get('/get-by-user/:userId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting,DefinedPermissions.AuthorAccess,DefinedPermissions.LocalAdminAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'Get a user notifications' })
    getNotificationsByUserId(@Param('userId') userId: string, @Query('page') page: number = 1,   @Query('limit') limit: number = 10 ): Promise<ApiResponse> {
        return  this.notificationService.getNotificationsByuserId(userId)
    }

 
   
    @ApiTags("Super-Admin Module")
    @Get('/histories')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'Get  notification histories' })
    getNotificationHistories(): Promise<ApiResponse> {
        return  this.notificationService.getNotificationHistory();
    }

    @ApiTags("Super-Admin Module")
    @Get('/histories/clear')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'clear notification histories' })
    clearNotificationHistories(): Promise<ApiResponse> {
        return  this.notificationService.clearAllNotificationHistory();
    }

    
    @ApiTags("Super-Admin Module")
    @Put('/set-preferences/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'set notification preference' })
    setNotificationPreferences(@Body() dto:SetNotificationPrefDto): Promise<ApiResponse> {
        return  this.notificationService.setNotificationPreference(dto);
    }


    @ApiTags("Super-Admin Module")
    @Get('/preferences/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'get notification preferences' })
    getNotificationPreferences(): Promise<ApiResponse> {
        return  this.notificationService.getNotificationPreference();
    }

    @ApiTags("Super-Admin Module")
    @Put('/set-two-factor-settings/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'set two factor settings' })
    setTwoFactorSettings(@Body() dto:SetTwoFactorDto): Promise<ApiResponse> {
        return  this.notificationService.updateTwoFactorSettings(dto);
    }

    @ApiTags("Super-Admin Module")
    @Get('/two-factor-settings/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'get two-factor settings' })
    getTwoFactorSettings(): Promise<ApiResponse> {
        return  this.notificationService.getTwoFactorSettings();
    }

    @ApiTags("Super-Admin Module")
    @Get('/:Id')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'Get a notification' })
    getNotification(@Param('Id') Id: string): Promise<ApiResponse> {
        return  this.notificationService.getNotificationById(Id);
    }

   
    

}

