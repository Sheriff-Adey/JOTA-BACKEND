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
import { ExamService } from './exam.service';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { CreateExamDto, EditExamDto, EditExamReminderDto, ResultTypeDto, SetExamNotificationSettingsDto, SetExamReminderDto, VerifyUnlockPasswordDto } from './dto/create-exam.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Permissions } from 'src/shared/decorators/permissions.decorator';
import { AddItemsToExamDto } from './dto/add-item-to-exam.dto';
import { AddInstructionsToSectionDto } from './dto/add-instructions.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { AddCenterDto, AllowReLoginDto, SpecificCandidateExamDto, UploadEssayGradeDto } from './dto/add-center.dto';
import { SetOverallTimerDto, SetSectionTimerDto } from './dto/set-overall-timer.dto';
import { DownloadExamDto, FileUploadDto, LogOutCandidateDto, RestartExamAllDto, StartExamDto, SyncCandidateExamDto, SyncGradeDto, SyncProgressDto, TriggerEndOfDayDto } from './dto/start-exam.dto';
import { AddLocalAdminDto, LocalAdminLoginDto } from '../user/dto/create-admin.dto';
import { IncreaseSectionTimingDto, IncreaseTimeDto } from './dto/increase-time.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, File} from 'multer';
import { extname } from 'path';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as util from 'util';
import { DefinedPermissions } from '../role/dto/defined-permission.constant';
import { SubmitExamDto, SubmitSectionDto } from './dto/submit-reponse.dto';
import { BulkResponseDto } from './dto/bulk-response.dto';
import { SubmitSectionEndTimesDto } from './dto/submit-section-end-times.dto';

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
  
@ApiTags("Exam Module") 
@Controller('exam')
@UsePipes(ValidationPipe)
export class ExamController {
constructor(
    private readonly examService: ExamService
    ) {}

  @Delete('/section/:id')
  @ApiBearerAuth('Authorization')
  @Roles('admin', 'super-admin', 'local-admin')
  @Permissions(DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
  @UseGuards(AuthenticationGuard, RoleGuard)
  @ApiOperation({ description: 'Delete a section by ID' })
  deleteSection(@Param('id') id: string): Promise<ApiResponse> {
    return this.examService.deleteSectionById(id);
  }

  @Delete('/:id')
  @ApiBearerAuth('Authorization')
  @Roles('admin', 'super-admin')
  @Permissions(DefinedPermissions.Exam)
  @UseGuards(AuthenticationGuard, RoleGuard)
  @ApiOperation({ description: 'Delete an exam by ID' })
  deleteExam(@Param('id') id: string): Promise<ApiResponse> {
    return this.examService.deleteExamById(id);
  }

  @Post('/terminate/:examId')
  @ApiBearerAuth('Authorization')
  @Roles('admin', 'super-admin', 'local-admin')
  @Permissions(DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
  @UseGuards(AuthenticationGuard, RoleGuard)
  @ApiOperation({ description: 'Terminate an exam and log out all candidates' })
  terminateExam(@Req() req, @Param('examId') examId: string): Promise<ApiResponse> {
    return this.examService.terminateExam(req.user, examId);
  }

  @Post('/reset-login-attempts')
  @ApiBearerAuth('Authorization')
  @Roles('admin', 'super-admin', 'local-admin')
  @Permissions(DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
  @UseGuards(AuthenticationGuard, RoleGuard)
  @ApiOperation({ description: 'Reset login attempts for candidates in an exam' })
  resetLoginAttempts(@Body() body: { examId: string; candidateIds?: string[] }): Promise<ApiResponse> {
    return this.examService.resetLoginAttemptsForCandidates(body.examId, body.candidateIds);
  }

  @Post('/reset-is-logged-in')
  @ApiBearerAuth('Authorization')
  @Roles('admin', 'super-admin', 'local-admin')
  @Permissions(DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
  @UseGuards(AuthenticationGuard, RoleGuard)
  @ApiOperation({ description: 'Reset IsLoggedIn flag for candidates in an exam' })
  resetIsLoggedIn(@Body() body: { examId: string; candidateIds?: string[] }): Promise<ApiResponse> {
    return this.examService.resetIsLoggedInForCandidates(body.examId, body.candidateIds);
  }

   
    @Post('/create')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Create an exam' })
    createExam(@Body() createDto: CreateExamDto): Promise<ApiResponse> {
        return  this.examService.createExam(createDto);
    }


    @Put('/update/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Update an exam' })
    updateExam(@Param('examId') examId:string, @Body() editDto: EditExamDto): Promise<ApiResponse> {
        return  this.examService.updateExam(examId,editDto);
    }


    @Put('/notification-settings/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Update an exam' })
    updateExamNotificationSettings(@Param('examId') examId:string, @Body() editDto: SetExamNotificationSettingsDto) {
        return this.examService.updateExamNotificationSettings(examId, editDto);
    }

    @Post('/set-reminder/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'set exam reminder' })
    setExamReminder(@Param('examId') examId:string, @Body() dto:SetExamReminderDto): Promise<ApiResponse> {
        return  this.examService.setExamReminder(examId, dto);
    }


    @Post('/edit-reminder/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'edit exam reminder' })
    editExamReminder(@Param('examId') examId:string, @Body() dto:EditExamReminderDto): Promise<ApiResponse> {
        return  this.examService.editExamReminder(examId, dto);
    }


    @Post('/add-item')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin', 'author')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Add items to an exam' })
    addItemToExam(@Body() addItemDto:AddItemsToExamDto): Promise<ApiResponse> {
        return  this.examService.addItemsToExam(addItemDto);
    }


    @Post('/add-instructions')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','author')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Add instructions to section' })
    addInstructions(@Body() addInstructionsDto:AddInstructionsToSectionDto): Promise<ApiResponse> {
        return  this.examService.addInstructionsToSection(addInstructionsDto);
    }


   
 
    @Get('/items/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ description: 'Get exam items' })
    getExamItems(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getExamItems(examId)
    }

  

    @Get('/centers/:examId')
    @ApiBearerAuth('Authorization')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({ description: 'get exam centers' })
    getExamCenters(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getExamCenters(examId);
    }

 
        

  
    @Get('/questions/:sectionId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin", "candidate","admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get section questions' })
    getSectionQuestions(@Param('sectionId') sectionId: string,@Query('page') page: number = 1,   @Query('limit') limit: number = 10 ): Promise<ApiResponse> {
        return  this.examService.getSectionQuestions(sectionId);
    }

    @Post('/sections/create')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'create a section' })
    createSections(@Body()  createSectionDto: CreateSectionDto): Promise<ApiResponse> {
        return  this.examService.createSection(createSectionDto);
    }
   
    
    @Put('/sections/set-timer')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'set section timer' })
    setSectionTimers(@Body() setTimer: SetSectionTimerDto): Promise<ApiResponse> {
        return  this.examService.setSectionTimer(setTimer);
    }
   
    @Put('/set-timer')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'set overall exam timer' })
    setOverallTimer(@Body() setTimer: SetOverallTimerDto): Promise<ApiResponse> {
        return  this.examService.setOverallTimer(setTimer);
    }
    
    @Get('/subjects/:examId')
    // @ApiBearerAuth('Authorization')
    // @UseGuards(JwtAuthGuard)
    @ApiOperation({ description: 'Get Exam Subjects' })
    getExamSubjects(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getExamSubjects(examId)
    }

    @Get('/sections/:examId')
    // @Roles('admin','super-admin','local-admin','candidate')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @ApiOperation({ description: 'Get Exam Sections' })
    getExamSections(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getExamSections(examId);
    }
    
    
    @Post('/restart')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' restart exam' })
    restartExam(@Req() req, @Body()  restartDto:RestartExamAllDto): Promise<ApiResponse> {
        return  this.examService.restartExams(req.user,restartDto)
    }
   
    @Post('/logout-candidates')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' logout one or multiple candidates' })
    logoutCandidate(@Req() req, @Body()  logoutDto:LogOutCandidateDto): Promise<ApiResponse> {
        return  this.examService.logOutCandidates(req.user, logoutDto)
    }

     
    @Post('/logout-all-candidates/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' logout all candidates in an exam' })
    logoutAllCandidate(@Req() req, @Param("examId") examId: string): Promise<ApiResponse> {
        return  this.examService.logOutAllCandidates(req.user, examId);
    }

    @Post('/restart-for-all/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' restart exam for all candidates in an exam' })
    restartForAll(@Req() req, @Param("examId") examId: string): Promise<ApiResponse> {
        return  this.examService.restartExamsForAll(req.user, examId);
    }


    @Post('/add-local-admin')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' add local admin to exam' })
    addLocalAdmin(@Req() req, @Body() addDto: AddLocalAdminDto): Promise<ApiResponse> {
        return  this.examService.createLocalAdmin(req.user, addDto);
    }
    
    
    @Post('/mark-as-downloaded')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin', 'local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.Setting,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'mark exam as downloaded(from local server' })
    markAsDownloaded(@Body() dto:DownloadExamDto): Promise<ApiResponse> {
        return  this.examService.markAsDownloaded(dto);
    }

    @Post('/local-admin/login')
    @ApiBearerAuth('Authorization')
    @ApiOperation({ description: 'login local admin' })
    loginLocalAdmin(@Body() loginDto: LocalAdminLoginDto): Promise<ApiResponse> {
        return  this.examService.localAdminLogin(loginDto)
    }
   
    @Get('/center-exams/:centerId')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin', 'local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.Setting,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get Center Exams' })
    getCenterExams(@Req() req, @Param('centerId') centerId: string ): Promise<ApiResponse> {
        const currentUser = req.user
        console.log(req.user);
        return  this.examService.getCenterExams(currentUser, centerId)
    }


    @Get('/local-candidate-exams/')
    @ApiBearerAuth('Authorization')
    @ApiOperation({ description: 'Get Local Exams' })
    getCandidateLocalExams( ): Promise<ApiResponse> {
    
        return  this.examService.getAllLocalExams();
    }
    
    // @Post('/add-exam-center')
    // @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    // @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    // @UseGuards(AuthenticationGuard,RoleGuard)
    // @ApiOperation({ description: ' add exam center' })
    // addExamCenter(@Req() req, @Body() addDto: AddCenterDto): Promise<ApiResponse> {
    //     return  this.examService.addExamCenter(addDto);
    // }
   
    @Post('/center/create')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' add center' })
    addExamCenter(@Req() req, @Body() addDto: AddCenterDto): Promise<ApiResponse> {
        return  this.examService.addCenter(addDto);
    }

    @ApiTags("Super-Admin Module")
    @Get('/local-admin/:id')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get a local-admin' })
    getLocalAdmin(@Param('id') id: string): Promise<ApiResponse> {
        return  this.examService.getLocalAdmin(id);
    }
    
    @Get('/online-exams/all')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","author")
    @Permissions(DefinedPermissions.Exam, DefinedPermissions.Authoring)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all online exams' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"type|title", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|title", type: String })
    getAllOnlineExams(
        @Query('page') page: number = 1, 
        @Query('limit') limit: number = 10, 
        @Query('sortBy')  sortBy?:string,
        @Query('filter') filter?: string,
        @Query('searchValue') searchValue?: string
        ): Promise<ApiResponse> {
     
        return  this.examService.getAllOnlineExams(page,limit,sortBy, filter, searchValue );
    }

    @Get('/onpremise-exams/all')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin")
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all on-premise exams' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"type|title", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|title", type: String })
    getAllOnpremisexams(
        @Query('page') page: number = 1, 
        @Query('limit') limit: number = 10, 
        @Query('sortBy')  sortBy?:string,
        @Query('filter') filter?: string,
        @Query('searchValue') searchValue?: string
          ): Promise<ApiResponse> {
       
        return  this.examService.getAllOnPremiseExams(page,limit,sortBy, filter, searchValue);
    }
  

    @Post('/extend-time')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' extend time for all or one candidates' })
    increaseTiming(@Req() req, @Body() addDto: IncreaseTimeDto): Promise<ApiResponse> {
        const currentUser = req.user
        return  this.examService.increaseExamTiming(currentUser,addDto)
    }

    @Post('/extend-per-section')
    @ApiBearerAuth('Authorization')
    // @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' extend time for all or one candidates' })
    increaseSectionTiming(@Req() req, @Body() addDto: IncreaseSectionTimingDto): Promise<ApiResponse> {
        const currentUser = req.user
        return  this.examService.increaseSectionTimingExam(currentUser, addDto);
    }
  

  

@Get('/monitoring-stat/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get exam monitoring statistics' })
    getExamMonitoring(@Req() req, @Param("examId") examId:string ): Promise<ApiResponse> {
      
        return this.examService.examMonitoringStat(examId);
    }

    @Get('/submission-statistics/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get submission statistics breakdown by type' })
    getSubmissionStatistics(@Param("examId") examId:string ): Promise<ApiResponse> {
        return this.examService.getSubmissionStatistics(examId);
    }

    @Get('/violation-candidates/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get candidates who violated exam rules' })
    getViolationCandidates(@Param("examId") examId:string ): Promise<ApiResponse> {
        return this.examService.getViolationCandidates(examId);
    }

    @Get('/candidates-submission-details/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all candidates with their submission details for analysis report' })
    getCandidatesSubmissionDetails(@Param("examId") examId:string ): Promise<ApiResponse> {
        return this.examService.getCandidatesSubmissionDetails(examId);
    }

    @Get('/candidates-progresses/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all candidates progress' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"username", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|title", type: String })
    getAllCandidateProgresses(
        @Param("examId") examId:string,
         @Query('page') page: number = 1,   
         @Query('limit') limit: number = 10,
         @Query('filter') filter?: string,
         @Query('searchValue') searchValue?: string,
         @Query('sortBy') sortBy?: string,
        ): Promise<ApiResponse> {
     
        return this.examService.getAllCandidatesProgresses(examId, page, limit,filter,searchValue,sortBy)
    }


    
    @Get('/performance-breakdown/view')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin","candidate")
        @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'show performance breakdown' })
    performanceBreakdown(@Query('examId') examId:string ,@Query('candidateId') candidateId:string ): Promise<ApiResponse> {
        return  this.examService.getPerformanceBreakdown({examId,candidateId});
    }

    @Get('/answered-questions')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'show performance breakdown' })
    getAnsweredQuestions(@Query('examId') examId:string ,@Query('candidateId') candidateId:string ): Promise<ApiResponse> {
        return  this.examService.getAnsweredQuestions({examId,candidateId});
    }

    @Get('/candidate-progress-questionIds')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess, DefinedPermissions.CandidateAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get candidate questionIds and sectionIds' })
    getCandidateExamQuestions(@Query('examId') examId:string ,@Query('candidateId') candidateId:string ): Promise<ApiResponse> {
        return  this.examService.getCandidateProgressQuestionIds({examId,candidateId});
    }

    @Get('/view-result/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'view candidate' })
    viewResult(@Query('examId') examId:string ,@Query('candidateId') candidateId:string ): Promise<ApiResponse> {
        return  this.examService.viewResult({examId,candidateId});
    }
   


    @Get('/exam-report-dashboard/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Exam report statistics' })
    getExamReportDashboard(@Param("examId") examId:string): Promise<ApiResponse> {
     
        return this.examService.examReportDashboard(examId);
    }


    @Get('/candidate-exam-reports/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'list of candidates (under exam report)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"username", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username", type: String })
    getCandidateExamReports(
        @Param("examId") examId:string,
        @Query('page') page: number = 1,  
        @Query('limit') limit: number = 10,
        @Query('filter') filter?: string,
        @Query('searchValue') searchValue?: string,
        @Query('sortBy') sortBy?: string
        ): Promise<ApiResponse> {
      
        return this.examService.getAllCandidatesExamReports(examId,page,limit,filter,searchValue, sortBy);
    }


    
    @Get('/candidate-exam-reports-pdf/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'list of candidates(non-paginated) ' })
    @ApiQuery({ name: 'filter', required: false,description:"username", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username", type: String })
    getCandidateExamReportsPdf(
        @Param("examId") examId:string,
        @Query('filter') filter?: string,
        @Query('searchValue') searchValue?: string,
        @Query('sortBy') sortBy?: string
        ): Promise<ApiResponse> {
      
        return this.examService.getAllCandidatesExamReportsNonPaginated(examId,filter,searchValue, sortBy);
    }


    @Get('/individual-exam-report/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'individual exam report' })
    getCandidateExamReport(@Query("examId") examId:string, @Query('candidateId') candidateId: string): Promise<ApiResponse> {
     
        return this.examService.getCandidateExamReport(examId, candidateId);
    }

    @Get('/individual-score-analysis/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'individual score analysis' })
    getCandidateScoreAnalysis(@Query("examId") examId:string, @Query('candidateId') candidateId: string): Promise<ApiResponse> {
     
        return this.examService.getSingleCandidateScoreAnalysis(examId, candidateId);
    }

    @Get('/candidate-exams/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get exams for a candidate' })
    getCandidateExams(@Req() req, @Query('candidateId') candidateId: string): Promise<ApiResponse> {
        console.log(req.user)
        return this.examService.getCandidateExams( req.user, candidateId);
    }

    @Post('/candidate-exam-details/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get exams for a candidate' })
    getCandidateExamInfo( @Body() dto:SpecificCandidateExamDto): Promise<ApiResponse> {
     
        return this.examService.getSpecificCandidateExam(dto)
    }
    
    @Get('/populate-resources/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","candidate")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'populate exam resources' })
    populateExamResources( @Query() dto:SpecificCandidateExamDto): Promise<ApiResponse> {
     
        return this.examService.populateExamResources(dto);
    }

    @Get('/candidate-reports-preview/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'list of candidates(under grades & report)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'filter', required: false,description:"username", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt", type: String })
    getCandidateExamReportSummary(
        @Param("examId") examId:string,
        @Query('page') page: number = 1,  
        @Query('limit') limit: number = 10,
        @Query('filter') filter?: string,
        @Query('searchValue') searchValue?: string,
        @Query('sortBy') sortBy?: string
        ): Promise<ApiResponse> {
     
        return this.examService.getAllCandidatesExamReportSummary(examId, page,limit,filter,searchValue, sortBy);
    }


    @Get('/all-score-reports/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'list of candidates candidate score reports(non-paginated)' })
    getAllScoreReports(@Param("examId") examId:string): Promise<ApiResponse> {
     
        return this.examService.getAllScoreReport(examId);
    }


    @Get('/all-score-reports-paginated/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'list of candidates score reports(paginated)' })
    getAllScoreReportsPaginated(@Param("examId") examId:string, @Query('page') page: number = 1,   @Query('limit') limit: number = 10): Promise<ApiResponse> {
     
        return this.examService.getAllScoreReportPaginated(examId, page,limit)
    }
   
    @Get('/candidate-exam-reports-excel/download/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download exam reports as excel ' })
    @ApiQuery({ name: 'filter', required: false,description:"username", type: String })
    @ApiQuery({ name: 'searchValue', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false,description:"createdAt|username", type: String })
    async generateExcelReport(
        @Res() res,
        @Param("examId") examId:string,
        @Query('filter') filter?: string,
        @Query('searchValue') searchValue?: string,
        @Query('sortBy') sortBy?: string,
        ): Promise<void> {
      try {
     
        const excelBuffer = await this.examService.downloadExcelForAllCandidateReports(examId,filter, searchValue, sortBy)
  
  
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=exam_report_${examId}.xlsx`);
  
        res.send(excelBuffer);
      } catch (error) {

        res.status(500).json({ status: 500, message: 'Internal Server Error', error: true });
      }
    }

    @Get('/candidate-score-reports-excel/download/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download score reports as excel ' })
    async generateExcelScoreReport(
        @Res() res,
        @Param("examId") examId:string
        ): Promise<void> {
      try {
     
        const excelBuffer = await this.examService.downloadExcelForAllScoreReports(examId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=score_report_${examId}.xlsx`);
  
        res.send(excelBuffer);
      } catch (error) {
         console.log(error)
        res.status(500).json({status: 500,  message: 'Internal Server Error', error: true });
      }
    }
  
 
  

    @Get('/individual-score-reports/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get score report for a candidate' })
    getIndividualScoreReports( @Query('examId') examId:string,   @Query('candidateId') candidateId: string): Promise<ApiResponse> {
     
        return this.examService.getIndividualScoreReport(examId, candidateId);
    }


    @Get('/score-analysis/:examId')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Score Analysis' })
    getScoreAnalysis(@Param("examId") examId:string): Promise<ApiResponse> {
     
        return this.examService.getScoreAnalysis(examId);
    }

    @ApiTags("Local-admin Module")
    @Get('/center-candidates/')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get list of center candidates' })
    getCenterCandidates(@Req() req, @Query("examId") examId:string, @Query("centerId") centerId:string,@Query('page') page: number = 1,   @Query('limit') limit: number = 10): Promise<ApiResponse> {
     
        return this.examService.getCenterCandidates(req.user, examId,centerId,page,limit );
    }

    
    @Get('/all-centers')
    @ApiBearerAuth('Authorization')
    // @Roles("super-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.Setting)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Get all centers' })
    getAllCenters( @Query('page') page: number = 1,   @Query('limit') limit: number = 10 ): Promise<ApiResponse> {
     
        return this.examService.getAllCenters(page, limit);
    }


    @ApiTags("Local-admin Module")
    @Get('/center-candidates-non-paginated/')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get list of center candidates(non-paginated)' })
    getCenterCandidatesWithoutPagination(@Req() req, @Query("examId") examId:string, @Query("centerId") centerId:string): Promise<ApiResponse> {
     
        return this.examService.getCenterCandidatesWithoutPagination(req.user, examId,centerId);
    }

    @ApiTags("Local-admin Module")
    @Get('/local-exam-monitoring-dashboard/')
    @ApiBearerAuth('Authorization')
    @Roles("local-admin","admin")
    @Permissions(DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'local exam monitoring dashboard' })
    localExamMonitoring(@Req() req, @Query("examId") examId:string, @Query("centerId") centerId:string): Promise<ApiResponse> {
     
        return this.examService.localAdminExamMonitoringStat(req.user, examId,centerId)
    }

    @ApiTags("Local-admin Module")
    @Get('/center-candidates-progress/')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin","admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get progress of candidates in a center' })
    getCenterCandidatesProgresses(@Req() req, @Query("examId") examId:string, @Query("centerId") centerId:string,@Query('page') page: number = 1,   @Query('limit') limit: number = 10): Promise<ApiResponse> {
     
        return this.examService.getCenterCandidatesProgresses(req.user, examId,centerId,page,limit );
    }

    @Post('/allow-re-login')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' enable or disable re-login' })
    enableReLogin(@Body() reloginDto: AllowReLoginDto): Promise<ApiResponse> {
        return  this.examService.enableExamReLogin(reloginDto);
    }
    
    
    @Post('/enable-show-result')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' enable or disable show result' })
    enableShowResult(@Body() reloginDto: AllowReLoginDto): Promise<ApiResponse> {
        return  this.examService.enableShowResult(reloginDto);
    }

    @Post('/enable-show-breakdown')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' enable or disable show breakdown' })
    enableShowBreakdown(@Body() reloginDto: AllowReLoginDto): Promise<ApiResponse> {
        return  this.examService.enableShowBreakdown(reloginDto);
    }
    
    @Post('/allow-computer-change')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','local-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' enable or disable computer change' })
    enableComputerChange(@Body() reloginDto: AllowReLoginDto): Promise<ApiResponse> {
        return  this.examService.enableComputerChange(reloginDto);
    }
    
    @Post('/customize-result/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: ' customize result format' })
    customizeResult(@Param('examId') examId:string, @Body() dto:ResultTypeDto): Promise<ApiResponse> {
        return  this.examService.customizeResult(examId,dto);
    }
    
    @Get('/transcripts/:examId')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get all transcripts for an exam' })
    getTranscripts(@Param("examId") examId:string):Promise<ApiResponse> {
     
        return this.examService.getAllTranscripts(examId);
    }

    @Get('/transcripts-pdf/:examId')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download all transcripts as PDF' })
    async downloadTranscriptsPdf(
        @Res() res,
        @Param("examId") examId:string
    ): Promise<void> {
        try {
            const pdfBuffer = await this.examService.generateAllTranscriptsPdf(examId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=transcripts_${examId}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ status: 500, message: 'Internal Server Error', error: true });
        }
    }

    @Get('/transcripts-zip/:examId')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","local-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download all transcripts as ZIP' })
    async downloadTranscriptsZip(
        @Res() res,
        @Param("examId") examId:string
    ): Promise<void> {
        try {
            const zipBuffer = await this.examService.generateAllTranscriptsZip(examId);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=transcripts_${examId}.zip`);
            res.send(zipBuffer);
        } catch (error) {
            console.error('Error generating ZIP:', error);
            res.status(500).json({ status: 500, message: 'Internal Server Error', error: true });
        }
    }

    @Get('/local-admins')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","admin")
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get all local admins' })
    getAllLocalAdmins():Promise<ApiResponse> {
     
        return this.examService.getAllLocalAdmins();
    }


    @Get('/local-admins/:examId')
    @ApiBearerAuth('Authorization')
    @Roles("super-admin","admin")
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get local admins for exam' })
    getAllLocalAdminsForExam(@Param("examId") examId:string):Promise<ApiResponse> {
     
        return this.examService.getAllLocalAdminsForExam(examId);
    }

    // @Get('/local-admins/:examId')
    // @ApiBearerAuth('Authorization')
    // @Roles("super-admin","admin")
    // @Permissions(DefinedPermissions.Exam)
    // @UseGuards(AuthenticationGuard,RoleGuard)
    // @ApiOperation({ description: 'get  local admins for an exam' })
    // getAllLocalAdminsForExam(@Param("examId") examId:string):Promise<ApiResponse> {
     
    //     return this.examService.getAllLocalAdmins();
    // }

    @Get('/individual-score-reports/')
    @ApiBearerAuth('Authorization')
    @Roles("admin","super-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get individual score report' })
    individualScoreReports(@Req() req, @Query("examId") examId:string, @Query("candidateId") candidateId:string): Promise<ApiResponse> {
     
        return this.examService.getIndividualScoreReport(examId,candidateId)
    }

    @Get('/individual-transcripts/')
    @ApiBearerAuth('Authorization')
    @Roles("admin","super-admin")
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get individual  transcripts' })
    individualTranscripts(@Req() req, @Query("examId") examId:string, @Query("candidateId") candidateId:string): Promise<ApiResponse> {
     
        return this.examService.getOneTranscripts(examId,candidateId);
    }


    @Get('/essay-responses/:examId')
    @ApiBearerAuth('Authorization')
    @Roles("admin","super-admin")
    @UseGuards(AuthenticationGuard,RoleGuard)
    @Permissions(DefinedPermissions.Exam)
    @ApiOperation({ description: 'to get all essay responses' })
    getEssayResponses(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getAllEssayResponses(examId);
    }
   
    @Get('/essay-responses/')
    @ApiBearerAuth('Authorization')
    @Roles("admin","super-admin")
    @UseGuards(AuthenticationGuard,RoleGuard)
    @Permissions(DefinedPermissions.Exam)
    @ApiOperation({ description: 'To get a  ' })
    getCandidateEssayResponses(@Query('examId') examId: string, @Query('candidateId') candidateId: string ): Promise<ApiResponse> {
        return  this.examService.getCandidateEssayResponse(examId, candidateId);
    }
     @Post('/download-to-local-server/')
    @ApiBearerAuth('Authorization')
    @Roles("local-admin","super-admin")
    @Permissions(DefinedPermissions.LocalAdminAccess, DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'download to local server' })
   async downloadExam(@Req() req,@Body() dto: DownloadExamDto ) {
        
        return await this.examService.downloadExamToLocalServer(req.user,{examId:dto.examId,centerId:dto.centerId});
    }

    @ApiTags("Authoring Module")
    @Post('/trigger-end-of-day')
    @ApiBearerAuth('Authorization')
    @Roles('local-admin')
    @Permissions(DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'Trigger end of the day' })
    async triggerEndOfDay(@Req() req, @Body() dto: TriggerEndOfDayDto): Promise<ApiResponse> {
         
        return  await this.examService.triggerEndOfDay(req.user,dto);
    }

    @Post('/pull/')
    @ApiBearerAuth('Authorization')
    @Roles("local-admin","super-admin")
    @Permissions(DefinedPermissions.LocalAdminAccess,DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get exam to download on local' })
    getlocalServerexam(@Req() req, @Body() dto:DownloadExamDto ): Promise<ApiResponse> {
        return  this.examService.getExamQuestionsForLocalDownload(req.user,{examId:dto.examId,centerId:dto.centerId});
    }

    @Post('/sync-responses/')
    @ApiBearerAuth('Authorization')
    @Roles('local-admin')
    @Permissions(DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'sync responses' })
   async syncResponses(@Req() req, @Body() data:any ) {
        return  await this.examService.syncResponses(req.user, data);
    }

    @Post('/sync-progress/')
    @ApiBearerAuth('Authorization')
    @Roles('local-admin')
    @Permissions(DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'sync responses' })
   async syncProgress(@Req() req, @Body() data:SyncProgressDto ) {
        return  await this.examService.syncProgress(req.user, data);
    }

    @Post('/sync-grades/')
    @ApiBearerAuth('Authorization')
    @Roles('local-admin')
    @Permissions(DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'sync grades' })
   async syncGrades(@Req() req, @Body() data:SyncGradeDto ) {
        return  await this.examService.syncGrades(req.user, data);
    }

    @Post('/sync-candidate-exams/')
    @ApiBearerAuth('Authorization')
    @Roles('local-admin')
    @Permissions(DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'sync grades' })
   async syncCandidateExams(@Req() req, @Body() data:SyncCandidateExamDto ) {
        return  await this.examService.syncCandidateExams(req.user, data);
    }
    
    
    @Get('/download-essay-grade-sheet/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin', 'super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'download essay grade sheet' })
    async downloadEssayGradeTemplate(@Res() res, @Param('examId') examId: string) {
        try {
          const excelFile = await this.examService.downloadEssayGradeSheet(examId);
      
          if (excelFile.status !== 200) {
            return res.status(excelFile.status).json({ error: true, message: excelFile.message });
          }
      
          const buffer = await excelFile.data.xlsx.writeBuffer();
      
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=gradesheet-${examId.split('-')[0]}.xlsx`);
          res.send(buffer);
        } catch (error) {
          console.error('Error in downloadEssayGradeTemplate:', error);
          res.status(500).json({ error: true, message: 'Internal Server Error' });
        }
      }
    
      
      @Get('/download-candidate-essay-sheet/:examId')
      @ApiBearerAuth('Authorization')
      @Roles('admin', 'super-admin')
      @Permissions(DefinedPermissions.Exam)
      @UseGuards(AuthenticationGuard, RoleGuard)
      @ApiOperation({ description: 'download essay grade sheet' })
      async downloadCandidateEssayGradeSheet(@Res() res, @Query('examId') examId: string, @Query('candidateId') candidateId: string ) {
          try {
            const excelFile = await this.examService.downloadEssayGradeSheet(examId);
        
            if (excelFile.status !== 200) {
              return res.status(excelFile.status).json({ error: true, message: excelFile.message });
            }
        
            const buffer = await excelFile.data.xlsx.writeBuffer();
        
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=gradesheet-${examId.split('-')[0]}.xlsx`);
            res.send(buffer);
          } catch (error) {
            console.error('Error in downloadEssayGradeTemplate:', error);
            res.status(500).json({ error: true, message: 'Internal Server Error' });
          }
        }

    @Post('/upload-essay-grade/')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin')
    @Permissions(DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'upload essay grade' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', { storage }))
    async uploadEssayGrade(@Req() req,@Body() gradeDto:UploadEssayGradeDto, @UploadedFile() file: File) {
     
      const workbook = new ExcelJS.Workbook();
      const stream = fs.createReadStream(file.path);
      
      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        workbook.xlsx.read(stream).then(resolve).catch(reject);
      });
     
      const worksheet = workbook.worksheets[0];
     // const rows = worksheet.getSheetValues();
      const result = this.examService.uploadEssayGrade(gradeDto, worksheet);
      
      const unlinkAsync = util.promisify(fs.unlink);
      await unlinkAsync(file.path);

      return result;
    }
  
    @Get('/brief-details/:examId')
    @ApiOperation({ description: 'get brief exam details' })
    getBriefExamDetails(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getExamBriefDetails(examId)
    } 

    @Post('upload-file')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({
        description: 'Upload a file',
        type: FileUploadDto
      })
    async uploadFile(@UploadedFile() file:File) {
      if (!file) {
        return { error: 'No file provided' };
      }
  
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return {imageUrl: dataUrl };
    }

    @Get('/:examId')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','candidate','local-admin')
    @Permissions(DefinedPermissions.Exam,DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'get an exam' })
    getExam(@Param('examId') examId: string ): Promise<ApiResponse> {
        return  this.examService.getExamById(examId);
    }


    @Post('/complete-section')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','candidate','local-admin')
    @Permissions(DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess, DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'submit a section' })
    async completeSection( @Body() dto:SubmitSectionDto) {
        return await this.examService.submitSection(dto.candidateId,dto.examId, dto.sectionId)
    }

   
    @Post('/submit-bulk-response')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','candidate','local-admin')
    @Permissions(DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess, DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'submit a section' })
    async submitBulkResponse( @Body() dto:BulkResponseDto) {
        return await this.examService.updateResponseInBulk(dto);
    }

@Post('/submit')
    @ApiBearerAuth('Authorization')
    @Roles('admin','super-admin','candidate','local-admin')
    @Permissions(DefinedPermissions.CandidateAccess,DefinedPermissions.LocalAdminAccess, DefinedPermissions.Exam)
    @UseGuards(AuthenticationGuard,RoleGuard)
    @ApiOperation({ description: 'submit a section' })
    async submitExam( @Body() dto:SubmitExamDto) {
        return await this.examService.submitExam(dto.examId, dto.candidateId, dto.submissionType, dto.submissionReason);
    }

    @Post('/verify-unlock-password')
    @ApiBearerAuth('Authorization')
    @Roles('candidate', 'admin', 'super-admin', 'local-admin')
    @Permissions(DefinedPermissions.CandidateAccess, DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'Verify unlock password for locked screen exam' })
    async verifyUnlockPassword(@Body() dto: VerifyUnlockPasswordDto): Promise<ApiResponse> {
        return await this.examService.verifyUnlockPassword(dto.examId, dto.password);
    }

    @Post('/submit-section-end-times')
    @ApiBearerAuth('Authorization')
    @Roles('candidate', 'admin', 'super-admin', 'local-admin')
    @Permissions(DefinedPermissions.CandidateAccess, DefinedPermissions.Exam, DefinedPermissions.LocalAdminAccess)
    @UseGuards(AuthenticationGuard, RoleGuard)
    @ApiOperation({ description: 'Submit section end times for offline exam' })
    async submitSectionEndTimes(@Body() dto: SubmitSectionEndTimesDto): Promise<ApiResponse> {
        return await this.examService.submitSectionEndTimes(
            dto.candidateId,
            dto.examId,
            dto.sectionEndTimes
        );
    }

}

