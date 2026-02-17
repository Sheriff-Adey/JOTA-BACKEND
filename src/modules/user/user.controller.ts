import {
    Body,
    Controller,
    Post,
    UsePipes,
    ValidationPipe,
    Get,
    Delete,
    Put,
    Param,
    Req,
    Session,
    Query,
    Res,
    UseGuards
  } from '@nestjs/common';
  import { ApiResponse } from '../../app.interface';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UserService } from './user.service';
  import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
  import { Request } from 'express';
import { LoginDto, SetPasswordDto } from './dto/login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ForgotPassDto } from './dto/forgot-pass.dto';
import { ChangePasswordDto, ResetPassDto } from './dto/reset-pass.dto';
import { CreateAdminDto, EditAdminDto } from './dto/create-admin.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';
require('dotenv').config();
  
  
  @Controller('account')
  @UsePipes(ValidationPipe)
  export class UserController {
    constructor(private readonly userService: UserService) {}
    private frontendUrl = `${process.env.FRONTEND_URL}`;
    private redirectUrl = `${process.env.VERIFICATION_REDIRECT_URL}`;

    @ApiTags("Onboarding")
    @Post('/create')
    @ApiOperation({ description: 'Create an account(super-admin)' })
    // create the params
    signUp(@Body() signUpDto: CreateUserDto): Promise<ApiResponse> {
      return this.userService.createUser(signUpDto);
    }
  
    @ApiTags("Onboarding")
    @Post('/login')
    @ApiOperation({ description: 'Login(admin and super-admin)' })
    async login(@Req() request,@Body() loginDto: LoginDto): Promise<ApiResponse> { 
     return await this.userService.login(loginDto);
    }

    @ApiTags("Onboarding")
    @Post('/verify-login-otp')
    @ApiOperation({ description: 'verify login OTP' })
    async verifyLoginOTP(@Body() otpCode: string): Promise<ApiResponse> { 
     return await this.userService.verifyLoginOTP(otpCode);
    }
    @ApiTags("Onboarding")
    @Post('/author-login')
    @ApiOperation({ description: 'Login(author)' })
    async authorLogin(@Body() loginDto: LoginDto): Promise<ApiResponse> { 
     return await this.userService.authorLogin(loginDto);
    }

    @ApiTags("Onboarding")
    @Post('/logout')
    @ApiBearerAuth('Authorization')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ description: 'Logout' })
    async logOut(@Req() req): Promise<ApiResponse> { 
      const token = req.headers['authorization'].split(' ')[1]; 

      if (!token) {
        return {
          status: 401,
          message:"Invalid Token",
          error: true
        }
      }
      return await this.userService.logOut(token);
    }


    @ApiTags("Onboarding")
    @Get('/list')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Setting)
    @ApiBearerAuth('Authorization')
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'List all users' })
    async getAllUsers(@Query('page') page: number = 1,   @Query('limit') limit: number = 10): Promise<ApiResponse> { 
     return await this.userService.getAllUsers(page,limit);
    }

    @ApiTags("Onboarding")
    @Post('refresh-token')
    async refresh(@Body() refreshDto: RefreshTokenDto): Promise<any> {
        return await this.userService.refreshTokens(refreshDto.refreshToken);
    }
  

    @ApiTags("Onboarding")
    @Post('forgot-pass')
    @ApiOperation({ description: 'Forgot password' })
    forgotPass(@Body() forgotPassDto: ForgotPassDto): Promise<ApiResponse> {
      return this.userService.forgotPassword(forgotPassDto);
    }
  
    @ApiTags("Onboarding")
    @Post('reset-pass')
    @ApiOperation({ description: 'Reset password' })
    resetPass( @Body() resetPassDto: ResetPassDto): Promise<ApiResponse> {
      return this.userService.resetPassword(resetPassDto);
    }
  
  

  
    @ApiTags("Onboarding")
    @Get('verify-email')
    @ApiOperation({ description: 'verify email' })
    async verifyEmail( @Query('token') verificationToken: string,  @Req() request) {
      
     return await this.userService.verifyEmailToken(verificationToken);
    
    }


    @ApiTags("Onboarding")
    @Post('/create-admin')
    @Roles('super-admin')
     @ApiBearerAuth('Authorization')
     @Permissions(DefinedPermissions.Setting, DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Create an admin' })
    createAdmin(@Body() createAdminDto: CreateAdminDto): Promise<ApiResponse> {
      return  this.userService.createAdmin(createAdminDto)
    }

    @ApiTags("Onboarding")
    @Post('/admin-password/create')
    @ApiOperation({ description: 'Create admin password' })
    createAdminPassword(@Body() createPassDto: SetPasswordDto): Promise<ApiResponse> {
      return  this.userService.createAdminPassword(createPassDto);
    }
   

    @ApiTags("Super-Admin Module")
    @Get('/view/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','admin')
    @Permissions(DefinedPermissions.Setting,DefinedPermissions.ProfileUpdate)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'view an account' })
    viewAccount(@Param('id') id: string): Promise<ApiResponse> {
        return this.userService.viewAccount(id);
    }
      
    @ApiTags("Super-Admin Module")
    @Put('/disable/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Disable an account' })
    disableAccount(@Param('id') id: string): Promise<ApiResponse> {
        return this.userService.disableAccount(id);
    }

    @ApiTags("Super-Admin Module")
    @Put('/enable/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Enable an account' })
    enableAccount(@Param('id') id: string): Promise<ApiResponse> {
        return this.userService.enableAccount(id);
    }

    @ApiTags("Super-Admin Module")
    @Delete('/delete/:id')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Delete an account' })
    deleteAccount(@Param('id') id): Promise<ApiResponse> {
        return  this.userService.deleteAccount(id);
    }

    @ApiTags("Super-Admin Module")
    @Get('/super-admin-dashboard/:userId')
    @ApiBearerAuth('Authorization')
    //@Roles('super-admin')
    @Permissions(DefinedPermissions.Setting,DefinedPermissions.ProfileUpdate,DefinedPermissions.Authoring,DefinedPermissions.Exam,DefinedPermissions.ItemBanks,DefinedPermissions.ProfileUpdate)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get super-admin dashboard statistics' })
    getSuperAdminDashboard(@Param('userId') userId: string): Promise<ApiResponse> {
        return this.userService.getSuperAdminDashboard(userId);
    }

    @ApiTags("Super-Admin Module")
    @Put('change-password')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','admin')
    @Permissions(DefinedPermissions.Setting,DefinedPermissions.ProfileUpdate)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Change password' })
    changePassword( @Body() changePassDto: ChangePasswordDto): Promise<ApiResponse> {
      return this.userService.changePassword(changePassDto);
    }

    @ApiTags("Super-Admin Module")
    @Put('update-details')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','admin')
    @Permissions(DefinedPermissions.Setting,DefinedPermissions.ProfileUpdate)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Update profile' })
    updateDetails( @Body() updateDto: UpdateProfileDto): Promise<ApiResponse> {
      return this.userService.updateProfile(updateDto);
    }


    @ApiTags("Super-Admin Module")
    @Put('update-admin/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Update admin details' })
    updateAdmin( @Req() req,@Param('id')  id:string, @Body() updateDto:EditAdminDto): Promise<ApiResponse> {
      return this.userService.updateAdmin(req.user,id, updateDto);
    }
  
    
    @ApiTags("Super-Admin Module")
    @Get('/activity-logs/:userId')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Setting,DefinedPermissions.ProfileUpdate)
    @ApiBearerAuth('Authorization')
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get activity logs for a user' })
    async getAllActivityLogs(@Param("userId") userId:string , @Query('page') page: number = 1,   @Query('limit') limit: number = 10): Promise<ApiResponse> { 
     return await this.userService.getAuditByUserId(userId);
    }
  }
  