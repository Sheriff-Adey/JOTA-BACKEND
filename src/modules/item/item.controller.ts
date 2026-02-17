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
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateItemBankDto } from './dto/create-Itembank.dto';
import { ItemService } from './item.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditItemBankDto } from './dto/edit-item-bank.dto';
import { ImportItemDto } from './dto/import-items.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, File} from 'multer';
import { extname } from 'path';
import { Express } from 'express'; 
import { EditItemDto } from './dto/edit-item.dto';
import { ManualAuthoringDto } from './dto/manual-authoring.dto';
import { AddMultipleItemToBankDto } from './dto/add-multiple-items.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import { pushItemToWebDto, syncItemToWebDto } from './dto/create-item.dto';
import { TriggerEndOfDayDto } from '../exam/dto/start-exam.dto';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';

const storage = diskStorage({
    destination: './uploads', 
    filename: (req, file, callback) => {
      const name = file.originalname.split('.')[0];
      const fileExtName = extname(file.originalname);
      const randomName = Array(4)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      callback(null, `${name}-${randomName}${fileExtName}`);
    }
  });
  
  
@Controller('item')
@UsePipes(ValidationPipe)
export class ItemController {
constructor(private readonly itemService: ItemService) {}

    @ApiTags("Authoring Module")
    @Post('/create-item-bank')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Create an item bank' })
    createItemBank(@Body() createDto: CreateItemBankDto): Promise<ApiResponse> {
        return  this.itemService.createItemBank(createDto);
    }

    
    @ApiTags("Authoring Module")
    @Put('/edit-item-bank/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Edit an item bank' })
    editItemBank(@Param('id') itemBankId: string,@Body() editDto: EditItemBankDto): Promise<ApiResponse> {
        return  this.itemService.editItemBank(itemBankId,editDto);
    }

    @ApiTags("Authoring Module")
    @Delete('/delete-item-bank/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Delete an item bank' })
    deleteItemBank(@Param('id') itemBankId: string): Promise<ApiResponse> {
        return  this.itemService.deleteItemBank(itemBankId);
    }


    @ApiTags("Authoring Module")
@Get('/get-all-item-bank/')
@ApiBearerAuth('Authorization')
// @Roles('super-admin','author','admin')
@Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.AuthorAccess,DefinedPermissions.ItemBanks)
@UseGuards(AuthenticationGuard,RoleGuard)
@ApiOperation({ description: 'Get all item bank' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'filter', required: false,description:"author|name|description", type: String })
@ApiQuery({ name: 'searchValue', required: false, type: String })
@ApiQuery({ name: 'sortBy', required: false,description:"name|createdAt", type: String })

getAllItemBank(
  @Req() req,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('filter') filter?: string,
  @Query('searchValue') searchValue?: string,
  @Query('sortBy') sortBy?: string,
): Promise<ApiResponse> {
  return this.itemService.getAllItemBanks( req.user,page || 1, limit || 1, filter, searchValue,sortBy);
}

    @ApiTags("Authoring Module")
    @Get('/get-items-by-bankId/:itemBankId')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.AuthorAccess,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all items in an item bank' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"name|topic|type(e.g MultipleChoice,Essay)", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"name|createdAt", type: String })

    getAllItemInBank(
    @Req() req,
    @Param('itemBankId') itemBankId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('filter') filter?: string,
    @Query('searchValue') searchValue?: string,
    @Query('sortBy') sortBy?: string, ): Promise<ApiResponse> {
        return  this.itemService.getItemsByItemBank(req.user, itemBankId,page,limit,filter,searchValue, sortBy)
    }

   


   @ApiTags("Authoring Module")
    @Put('/edit/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @UseGuards(AuthenticationGuard,RoleGuard)
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.AuthorAccess,DefinedPermissions.ItemBanks)
    @ApiOperation({ description: 'Edit an item' })
    editItem(@Param('id') itemId: string,@Body() editDto: EditItemDto): Promise<ApiResponse> {
        return  this.itemService.editItem(itemId,editDto);
    }


    @ApiTags("Authoring Module")
    @Get('/authoring-stats/')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @UseGuards(AuthenticationGuard,RoleGuard)
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @ApiOperation({ description: 'Get authoring stat' })
    getAuthoringStat(@Req() req): Promise<ApiResponse> {
        return  this.itemService.getAuthoringStat(req.user);
    }

    
  
    
  
    
    @ApiTags("Authoring Module")
    @Delete('/delete/:id')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Delete an item bank' })
    deleteItem(@Param('id') itemId: string): Promise<ApiResponse> {
        return  this.itemService.deleteItem(itemId)
    }

    @ApiTags("Authoring Module")
    @Post('/manual-creation')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Author item manually' })
    createItemManually(@Body() createDto: ManualAuthoringDto): Promise<ApiResponse> {
        return  this.itemService.manualItemCreation(createDto);
    }

    @ApiTags("Authoring Module")
    @Post('/add-to-bank')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Add multiple items to a bank' })
    AddMultipleItemsToBank(@Body() addMultiple: AddMultipleItemToBankDto): Promise<ApiResponse> {
        return  this.itemService.addMultipleItemToBank(addMultiple);
    }
    
    @ApiTags("Authoring Module")
    @Get('/locally-authored/')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.Authoring, DefinedPermissions.AuthorAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all locally authored items' })
    @ApiQuery({ name: 'filter', required: false,description:"name|topic|type(e.g MultipleChoice,Essay)", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"name|createdAt", type: String })

    getLocalItems(
    @Req() req,
    @Query('page') page: number = 1,  
     @Query('limit') limit: number = 10, 
    @Query('filter') filter?: string,
    @Query('searchValue') searchValue?: string,
    @Query('sortBy') sortBy?: string, ): Promise<ApiResponse> {
        return  this.itemService.getLocallyAuthoredItems(req.user, page,limit,filter,searchValue,sortBy);
    }


    @ApiTags("Authoring Module")
    @Get('/web-authored/')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.Authoring,DefinedPermissions.AuthorAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all web authored items' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"name|topic|type(e.g MultipleChoice,Essay)", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"name|createdAt", type: String })
    getWebItems(
    @Req() req,
    @Query('page') page: number = 1, 
    @Query('limit') limit: number = 10,  
    @Query('filter') filter?: string,
    @Query('searchValue') searchValue?: string,
    @Query('sortBy') sortBy?: string, ): Promise<ApiResponse> {
        return  this.itemService.getWebAuthoredItems(req.user, page,limit,filter,searchValue,sortBy)
    }

    @ApiTags("Authoring Module")
    @Get('/download-csv-template/')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download item CSV template' })
   async downloadItemCSVTemplate(@Res() res  ) {
        const excelFile = await this.itemService.downloadItemCSVTemplate()
        res.setHeader('Content-Disposition', 'attachment; filename=item.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await excelFile.xlsx.write(res);
        res.end();
    }
    

    
    @ApiTags("Authoring Module")
    @Get('/download-word-template/')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download item Word template' })
    downloadItemWordTemplate(@Res() res) {
        const templateFilePath = path.join(__dirname, '../../../../uploads/jotaitemwordtemplate.docx');
      res.sendFile(templateFilePath, {
          headers: {
            'Content-Disposition': 'attachment; filename=jotaitemwordtemplate.docx'
          }
        });
      }

      @ApiTags("Authoring Module")
      @Get('/download-notepad-template/')
      @ApiBearerAuth('Authorization')
      @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
      @UseGuards(AuthenticationGuard,RoleGuard)
      @ApiOperation({ description: 'download item Notepad template' })
     async downloadItemNotepadTemplate(@Res() res  ) {
        const templateContent = await this.itemService.downloadItemNotepadTemplate()
        res.setHeader('Content-Disposition', 'attachment; filename=items-template.txt');
        res.setHeader('Content-Type', 'text/plain');
        res.send(templateContent);
    }
      
      @ApiTags("Authoring Module")
      @Post('/import-from-word/')
      @ApiBearerAuth('Authorization')
      // @Roles('super-admin','author','admin')
      @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
      @UseGuards(AuthenticationGuard,RoleGuard)
      @ApiOperation({ description: 'import items' })
      @ApiConsumes('multipart/form-data')
      @UseInterceptors(FileInterceptor('file', { storage }))
      @ApiOperation({ summary: 'import items from word document' })
      async importItemFromWord( @UploadedFile() file: File,@Body() importItemDto: ImportItemDto){
          
      const allowedExtensions = ['.docx', '.doc'];
      console.log("file", file)
      if(!file){
        return{
          statusCode: 400,
          message: `File is required`,
          error: true
        }
      }
      const fileExtName = extname(file.originalname);
      if (! allowedExtensions.includes(fileExtName.toLowerCase())) {
         return {
           statusCode: 405,
           message: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
           error: true
         }
      }
  
      importItemDto.file = `./uploads/${file.filename}`;
      return await this.itemService.importItemFromWord(importItemDto);
     }

    @ApiTags("Authoring Module")
    @Post('/import-from-csv/')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'import items with csv' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { storage }))
    async importItemFromCsv(@Req() req,@Body() importItemDto:ImportItemDto, @UploadedFile() file: File) {

      console.log("file", file)
      if(!file){
        return{
          statusCode: 400,
          message: `File is required`,
          error: true
        }
      }
      const workbook = new ExcelJS.Workbook();
      const stream = fs.createReadStream(file.path);

      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        workbook.xlsx.read(stream).then(resolve).catch(reject);
      });

      const worksheet = workbook.worksheets[0];
      const unlinkAsync = util.promisify(fs.unlink);
      await unlinkAsync(file.path);
      const result = await this.itemService.importItemsFromCSV(importItemDto, worksheet);
      return result;
    }

    @ApiTags("Authoring Module")
    @Post('/import-from-notepad/')
    @ApiBearerAuth('Authorization')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'import items from notepad' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { storage }))
    async importItemFromNotepad(@UploadedFile() file: File, @Body() importItemDto: ImportItemDto) {

      const allowedExtensions = ['.txt'];
      console.log("file", file)
      if(!file){
        return{
          statusCode: 400,
          message: `File is required`,
          error: true
        }
      }
      const fileExtName = extname(file.originalname);
      if (! allowedExtensions.includes(fileExtName.toLowerCase())) {
         return {
           statusCode: 405,
           message: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
           error: true
         }
      }

      importItemDto.file = `./uploads/${file.filename}`;
      return await this.itemService.importItemFromNotepad(importItemDto);
     }
  



    @ApiTags("Authoring Module")
    @Get('/:itemId')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring,DefinedPermissions.ItemBanks)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get an item' })
    getItem(@Param('itemId') itemId: string): Promise<ApiResponse> {
        return  this.itemService.getItem(itemId);
    }
 

    
    @ApiTags("Authoring Module")
    @Post('/push-item-to-web')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Push item to web' })
    pushItemToWeb(@Req() req, @Body() createDto: pushItemToWebDto): Promise<ApiResponse> {
         console.log(req.body)
        return  this.itemService.pushItemToWeb(req.user, createDto);
    }


    @ApiTags("Authoring Module")
    @Post('/sync-item')
    @ApiBearerAuth('Authorization')
    // @Roles('super-admin','author','admin')
    @Permissions(DefinedPermissions.AuthorAccess,DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'sync item' })
    syncItem(@Req() req, @Body() createDto: syncItemToWebDto): Promise<ApiResponse> {
        return  this.itemService.syncItems(req.user, createDto);
    }
    

   

}

