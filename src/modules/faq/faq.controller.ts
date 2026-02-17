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
  import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';

  
  
  
  @Controller('faqs')
  @UsePipes(ValidationPipe)
  export class FaqController {
    constructor(private readonly faqService: FaqService) {}
  
    @ApiTags("Super-Admin Module")
    @Post('/create')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Create an faq' })
    createRole(@Body() createDto: CreateFaqDto): Promise<ApiResponse> {
      return  this.faqService.createFaq(createDto);
    }
  
  

    @ApiTags("Super-Admin Module")
    @Get('/')
    @ApiOperation({ description: 'List all faq' })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    async getAllFaqs(@Query('searchValue') searchvalue?:string): Promise<ApiResponse> { 
     return await this.faqService.getAllFaqs(searchvalue);
    }

    @ApiTags("Super-Admin Module")
    @Delete('/delete/:id')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Delete a faq' })
    deleteItemBank(@Param('id') id:string): Promise<ApiResponse> {
        return  this.faqService.deleteFaq(id);
    }

    @ApiTags("Super-Admin Module")
    @Put('/edit/:id')
    @ApiBearerAuth('Authorization')
    @Roles('super-admin')
    @Permissions(DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Edit a faq' })
    editRole(@Param('id') id: string,@Body() editDto:CreateFaqDto): Promise<ApiResponse> {
        return  this.faqService.editFaq(id,editDto)
    }
  

    @ApiTags("Super-Admin Module")
    @Get('/:id')
    @ApiOperation({ description: 'get a faq' })
    getRole(@Param('id') id: string): Promise<ApiResponse> {
        return this.faqService.findFaqById(id);
    }
  
  }
  