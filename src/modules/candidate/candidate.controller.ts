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
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
import { ApiResponse } from '../../app.interface';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CandidateService } from './candidate.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportCandidateDto, InviteCandidateDto } from './dto/import-candidate.dto';
import { diskStorage, File} from 'multer';
import { extname } from 'path';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as util from 'util';
import { ReassignSubjectDto, ReassignToCenterDto, RegisterCandidateForOnlineDto, RegisterCandidateForPremiseDto } from './dto/register-candidate.dto';
import { CancelInviteDto, ResendInviteDto } from './dto/invite.dto';
import { OpenExamLoginDto, PasswordedExamLoginDto } from './dto/candidate-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { FaceCaptureDto } from './dto/face-capture.dto';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';
require('dotenv').config();

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
  

@ApiTags("Candidate") 
@Controller('candidate')
@UsePipes(ValidationPipe)
export class CandidateController {
constructor(private readonly candidateService: CandidateService) {}
   private candidateUrl = process.env.CANDIDATE_URL

   @Put('/update-password/:candidateId')
   @ApiBearerAuth('Authorization')
   @Roles('admin','super-admin')
   @Permissions(DefinedPermissions.Exam)
   @UseGuards(AuthenticationGuard,RoleGuard)
   @ApiOperation({ description: 'Update candidate password' })
   async updateCandidatePassword(
     @Param('candidateId') candidateId: string,
     @Body('password') password: string
   ) {
     return await this.candidateService.updateCandidatePassword(candidateId, password);
   }

    @Get('/download-template/')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download candidates template' })
   async downloadCandidateTemplate(@Res() res  ) {
        const excelFile = await this.candidateService.downloadCandidateTemplate()
        res.setHeader('Content-Disposition', 'attachment; filename=candidates.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await excelFile.xlsx.write(res);
        res.end();
    }

    @Post('/import')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'import candidates with csv' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { storage }))
    async importCandidate(@Body() importCandidateDto:ImportCandidateDto, @UploadedFile() file: File) {
     
      const workbook = new ExcelJS.Workbook();
      const stream = fs.createReadStream(file.path);
      
      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        workbook.xlsx.read(stream).then(resolve).catch(reject);
      });
     
      const worksheet = workbook.worksheets[0];
     // const rows = worksheet.getSheetValues();
      const result = await this.candidateService.importCandidates(importCandidateDto, worksheet);
      
      const unlinkAsync = util.promisify(fs.unlink);
      await unlinkAsync(file.path);

      return result;
    }
  
    @Post('/invite')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'invite candidates' })
    async inviteCandidate(@Body() inviteDto:InviteCandidateDto) {
  
     return await this.candidateService.inviteCandidates(inviteDto);
    
    }
  

    
    @Post('/register-onpremise')
   
    // @UseGuards(JwtAuthGuard)
    @ApiOperation({ description: 'Register candidate for On-premise exam' })
    registerOnPremise(@Body() createDto: RegisterCandidateForPremiseDto): Promise<ApiResponse> {
      return  this.candidateService.registerCandidateForOnPremise(createDto);
    }

    @Post('/reassign-to-center')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam, DefinedPermissions.ProfileUpdate, DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Reassign candidates to center' })
    reassignCandidatesToCenter(@Body() dto:ReassignToCenterDto): Promise<ApiResponse> {
      return  this.candidateService.reAssignCandidateToCenter(dto)
    }

    @Post('/reassign-subjects')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam, DefinedPermissions.ProfileUpdate, DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Reassign  subjects to candidates' })
    reassignSubject(@Body() dto:ReassignSubjectDto): Promise<ApiResponse> {
      return  this.candidateService.reAssignSubjectToCandidate(dto);
    }

    @Post('/register-online')

    // @Roles('admin','super-admin')
    // @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Register candidate for Online exam' })
    registerOnline(@Body() createDto: RegisterCandidateForOnlineDto): Promise<ApiResponse> {
      return  this.candidateService.registerCandidateForOnline(createDto)
    }

    @Get('/imported-online/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get candidates imported for online exam' })
   async getOnlineImportedCandidates(@Param('examId') examId: string,@Query('page') page:number, @Query('limit') limit:number) {
       return await this.candidateService.getOnlineImportedCandidates(examId,page,limit);
    }

    @Get('/online-registrations/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"username|email|firstName|lastName", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username|email|firstName|lastName", type: String })
    @ApiOperation({ description: 'get candidates registered for online exam(not imported)' })
   async getOnlineRegisteredCandidates(
    @Param('examId') examId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('filter') filter?: string,
    @Query('searchValue') searchValue?: string,
    @Query('sortBy') sortBy?: string,
    ) {
       return await this.candidateService.getOnlineRegisteredCandidates(examId,page,limit,sortBy,filter, searchValue)
    }

    @Get('/imported-onpremise/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get candidates imported for onpremise exam' })
   async getImportedOnPremiseCandidates(@Param('examId') examId: string,@Query('page') page:number, @Query('limit') limit:number) {
       return await this.candidateService.getOnPremiseImportedCandidates(examId,page,limit)
    }

    @Get('/all-imported-candidates/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get all candidates imported' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"username|email|firstName|lastName", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username|email|firstName|lastName", type: String })
   async getImportedCandidates(
    @Param('examId') examId: string,
   @Query('page') page?: number,
   @Query('limit') limit?: number,
   @Query('filter') filter?: string,
   @Query('searchValue') searchValue?: string,
   @Query('sortBy') sortBy?: string
   )
    {
       return await this.candidateService.getAllImportedCandidates(examId,page,limit,sortBy,filter,searchValue);
    }

    @Get('/all-candidates-paginated/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin', 'local-admin')
    @Permissions(DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get all candidates (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"username|email|firstName|lastName", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username|email|firstName|lastName", type: String })

   async getAllCandidates(
    @Param('examId') examId: string,
    @Query('page') page:number, 
    @Query('limit') limit:number,
    @Query('filter') filter?: string,
    @Query('searchValue') searchValue?: string,
    @Query('sortBy') sortBy?: string
    ) {
       return await this.candidateService.getAllCandidates(examId,page,limit,sortBy,filter,searchValue);
    }

    @Get('/all-candidates/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin', 'local-admin')
    @Permissions(DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get all candidates (non-paginated)' })
    @ApiQuery({ name: 'filter', required: false,description:"username|email|firstName|lastName", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username|email|firstName|lastName", type: String })
   async getAllCandidatesWithoutPagination(
    @Param('examId') examId: string,
    @Query('filter') filter?: string,
    @Query('searchValue') searchValue?: string,
    @Query('sortBy') sortBy?: string
    ) {
       return await this.candidateService.getCandidatesWithoutPagination(examId,sortBy,filter,searchValue);
    }

    @Get('/accept-invite')
    @ApiOperation({ description: 'accept invite' })
   async acceptInvite(@Res() res,@Query('username') username:string, @Query('token') token:string) {
       const response = await this.candidateService.acceptInvite(username,token);
       if(response.status == 200){
         res.redirect(`${this.candidateUrl}`)
       }
      res.send(response);
      
    }

    
    @Get('/decline-invite')
    @ApiOperation({ description: 'decline invite' })
   async declineInvite(@Res() res, @Query('username') username:string, @Query('token') token:string) {
      const response = await this.candidateService.acceptInvite(username,token);
      if(response.status == 200){
        res.redirect(`${this.candidateUrl}`)
      }
      res.send(response);
    }

    @Get('/cancel-invite')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'cancel invite' })
   async cancelInvite(cancelDto: CancelInviteDto) {
      return await this.candidateService.cancelInvite(cancelDto);
      
    }


    @Get('/view/:candidateId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get candidate' })
   async getCandidate(@Param('candidateId') candidateId: string) {
       return await this.candidateService.viewDetails(candidateId)
    }


    @Delete('/delete/:candidateId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'delete candidate' })
   async deleteCandidate(@Param('candidateId') candidateId: string) {
       return await this.candidateService.deleteCandidate(candidateId)
    }

    @Post('/passworded-exam/login')
    @ApiOperation({ description: 'Login for passworded exam' })
    passwordedExamLogin(@Body() loginDto: PasswordedExamLoginDto): Promise<ApiResponse> {
      return  this.candidateService.passwordedExamLogin(loginDto);
    }

    @Post('/open-exam/login')
    @ApiOperation({ description: 'Login for open exam' })
    openExamLogin(@Body() loginDto: OpenExamLoginDto): Promise<ApiResponse> {
      return  this.candidateService.openExamLogin(loginDto);
    }

    @Post('/fingerprint-exam/login')
    @ApiOperation({ description: 'Login for fingerprint exam' })
    fingerprintExamLogin(@Body() loginDto: { examId: string; credentialId: string; authenticatorData: string; clientDataJSON: string; signature: string }): Promise<ApiResponse> {
      return this.candidateService.fingerprintExamLogin(loginDto);
    }

    @Get('/fingerprint-challenge/:examId')
    @ApiOperation({ description: 'Get fingerprint challenge for exam' })
    getFingerprintChallenge(@Param('examId') examId: string): Promise<ApiResponse> {
      return this.candidateService.getFingerprintChallenge(examId);
    }

    @Post('/resend-invite')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Resend invite to candidates' })
    resendInvite(@Body() resendDto: ResendInviteDto): Promise<ApiResponse> {
      return  this.candidateService.resendInvite(resendDto);
    }

    @ApiTags("Local-admin Module")
    @Post('/capture-face')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess,DefinedPermissions.CandidateAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'capture candidates faces' })
    captureFace( @Req() req, @Body() faceDto: FaceCaptureDto): Promise<ApiResponse> {
      return  this.candidateService.faceCapturing(req.user, faceDto);
    }

    @Post('/:candidateId/fingerprint/register')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Register fingerprint for candidate' })
    async registerFingerprint(
      @Param('candidateId') candidateId: string,
      @Body() body: { credentialId: string; publicKey: string }
    ): Promise<ApiResponse> {
      return await this.candidateService.registerFingerprint(candidateId, body.credentialId, body.publicKey);
    }

    @Delete('/:candidateId/fingerprint/remove')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Remove fingerprint registration for candidate' })
    async removeFingerprint(@Param('candidateId') candidateId: string): Promise<ApiResponse> {
      return await this.candidateService.removeFingerprint(candidateId);
    }

    @Post('/:candidateId/fingerprint/save-image')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Save fingerprint image for candidate' })
    async saveFingerprintImage(
      @Param('candidateId') candidateId: string,
      @Body() body: { fingerprintImage: string }
    ): Promise<ApiResponse> {
      return await this.candidateService.saveFingerprintImage(candidateId, body.fingerprintImage);
    }

}

