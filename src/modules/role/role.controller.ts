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
  import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleService } from './role.service';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { DefinedPermissions } from './dto/defined-permission.constant';

  
  
  
  @Controller('roles')
  @UsePipes(ValidationPipe)
  export class RoleController {
    constructor(private readonly roleService: RoleService) {}
  
    @ApiTags("Super-Admin Module")
    @Post('/create')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Create a role' })
    createRole(@Body() createDto: CreateRoleDto): Promise<ApiResponse> {
      return  this.roleService.createRole(createDto);
    }
  
    @ApiTags("Super-Admin Module")
    @Get('/all-permissions')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get all permissions' })
    async getAllPermissions(): Promise<ApiResponse> { 
     return await this.roleService.getAllPermissions();
    }

 
   

  
  

    @ApiTags("Super-Admin Module")
    @Get('/')
    @ApiBearerAuth('Authorization')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'List all roles' })
    async getAllRoles(): Promise<ApiResponse> { 
     return await this.roleService.getAllRoles();
    }

    @ApiTags("Super-Admin Module")
    @Delete('/delete/:id')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Delete a role' })
    deleteItemBank(@Param('id') id:string): Promise<ApiResponse> {
        return  this.roleService.deleteRole(id);
    }

    @ApiTags("Super-Admin Module")
    @Put('/edit/:id')
    @Permissions(DefinedPermissions.Setting)
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Edit a role' })
    editRole(@Param('id') id: string,@Body() editDto:CreateRoleDto): Promise<ApiResponse> {
        return  this.roleService.editRole(id,editDto);
    }
  

    @ApiTags("Super-Admin Module")
    @Get('/:id')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get a role' })
    getRole(@Param('id') id: string): Promise<ApiResponse> {
        return this.roleService.findRoleById(id);
    }
  
  }
  