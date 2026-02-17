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
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';

  
@Controller('questions')
@UsePipes(ValidationPipe)
export class QuestionController {
constructor(private readonly questionService: QuestionService) {}


    @ApiTags("Authoring Module")
    @Get('/get-by-itemId/:itemId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","author","admin")
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get questions by itemId' })
    getQuestionsByItemId(@Param('itemId') itemId: string, @Query('page') page: number = 1,   @Query('limit') limit: number = 10 ): Promise<ApiResponse> {
        return  this.questionService.getQuestionsByItem(itemId,page,limit);
    }

    @ApiTags("Authoring Module")
    @Get('/get-by-itemId-nonpaginated/:itemId')
    @ApiBearerAuth('Authorization')
    //@Roles("super-admin","author","admin")
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get questions by itemId(non-paginated)' })
    getQuestionsByItemIdNonPaginated(@Param('itemId') itemId: string ): Promise<ApiResponse> {
        return  this.questionService.getQuestionsByItemNonPaginated(itemId);
    }

    @ApiTags("Authoring Module")
    @Post('/create')
    @ApiBearerAuth('Authorization')
   // @Roles("super-admin","author","admin")
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'creating questions manually' })
    createQuestionManually(@Body() createDto: CreateQuestionDto): Promise<ApiResponse> {
        return  this.questionService.createQuestionsManually(createDto);
    }

    @ApiTags("Authoring Module")
    @Put('/edit/:id')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","author","admin")
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'edit questions manually' })
    editQuestions(@Param('id') id:string, @Body() createDto: CreateQuestionDto): Promise<ApiResponse> {
        return  this.questionService.editQuestions(id, createDto);
    }


    @ApiTags("Authoring Module")
    @Delete('/delete/:id')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","author","admin")
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'delete a  question ' })
    deleteQuestions(@Param('id') id:string): Promise<ApiResponse> {
        return  this.questionService.deleteQuestions(id);
    }

    
    @ApiTags("Authoring Module")
    @Get('/view/:id')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","author","admin")
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get a  question ' })
    getQuestions(@Param('id') id:string): Promise<ApiResponse> {
        return  this.questionService.getQuestions(id);
    }
   

}

