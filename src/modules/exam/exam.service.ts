import { Injectable, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Role } from '../role/role.entity';
import { ApiResponse } from 'src/app.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Exam } from './exam.entity';
import { Section } from '../section/section.entity';
import { User } from '../user/user.entity';
import {
  CreateExamDto,
  EditExamReminderDto,
  ResultType,
  ResultTypeDto,
  SetExamNotificationSettingsDto,
  SetExamReminderDto,
} from './dto/create-exam.dto';
import { AddItemsToExamDto } from './dto/add-item-to-exam.dto';
import { Item } from '../item/item.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { AddInstructionsToSectionDto } from './dto/add-instructions.dto';
import { Question } from '../question/question.entity';
import {
  AddCenterDto,
  AllowReLoginDto,
  SpecificCandidateExamDto,
  UploadEssayGradeDto,
} from './dto/add-center.dto';
import { Center } from './center.entity';
import { ExamCenter } from './exam-center.entity';
import {
  SetOverallTimerDto,
  SetSectionTimerDto,
} from './dto/set-overall-timer.dto';
import * as moment from 'moment';

import { CandidateExam } from '../candidate-exam/candidate-exam.entity';
import {
  DownloadExamDto,
  LogOutCandidateDto,
  RestartExamAllDto,
  StartExamDto,
  SyncCandidateExamDto,
  SyncExamDto,
  SyncGradeDto,
  SyncProgressDto,
  TriggerEndOfDayDto,
} from './dto/start-exam.dto';
import { CandidateProgress } from '../candidate/candidate-progress.entity';
import {
  PreviousQuestionDto,
  SubmitExamDto,
  SubmitResponseDto,
} from './dto/submit-reponse.dto';
import { CandidateResponse } from './response.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Grade } from './grade.entity';
import {
  AddLocalAdminDto,
  LocalAdminLoginDto,
} from '../user/dto/create-admin.dto';
import { UserService } from '../user/user.service';
import { EmailService } from 'src/shared/notifications/email.service';
import { CandidateService } from '../candidate/candidate.service';
import { compare } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import {
  IncreaseSectionTimingDto,
  IncreaseTimeDto,
} from './dto/increase-time.dto';
import { Candidate } from '../candidate/candidate.entity';
import { AuditLog } from '../audit/audit-log.entity';
import * as ExcelJS from 'exceljs';
import { SectionItem } from '../section/section-item.entity';
import axios, { AxiosRequestConfig } from 'axios';
import { ExamItem } from './exam-items.entity';
import Jimp from 'jimp';
import { Server, Socket } from 'socket.io';
import { RolePermission } from '../role/role-permission.entity';
import { Permission } from '../role/permission.entity';
import { ItemFolder } from '../item/item-folder.entity';
import { CandidateSection } from '../candidate/candidate-section.entity';
import { json } from 'sequelize';
import * as config from 'config';
import { Reminder } from '../notification/reminder.entity';
import { Cron } from '@nestjs/schedule';
import * as momentTimezone from 'moment-timezone';
import { BulkResponseDto } from './dto/bulk-response.dto';
import { ExamHistory } from '../audit/history.entity';
import { Violation } from '../violation/violation.entity';

require('dotenv').config();

@Injectable()
export class ExamService {
  constructor(
    @Inject('EXAMS_REPOSITORY')
    private examRepository: typeof Exam,
    @Inject('SECTIONS_REPOSITORY')
    private sectionRepository: typeof Section,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async deleteSectionById(sectionId: string): Promise<ApiResponse> {
    try {
      const section = await this.sectionRepository.findByPk(sectionId);
      if (!section) {
        return {
          status: 404,
          message: 'Section not found',
          error: true,
        };
      }
      await this.sectionRepository.destroy({ where: { id: sectionId } });
      return {
        status: 200,
        message: 'Section deleted successfully',
        error: false,
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Internal server error while deleting section',
        error: true,
      };
    }
  }

  async deleteExamById(examId: string): Promise<ApiResponse> {
    try {
      const exam = await this.examRepository.findByPk(examId);
      if (!exam) {
        return {
          status: 404,
          message: 'Exam not found',
          error: true,
        };
      }
      await this.examRepository.destroy({ where: { id: examId } });
      return {
        status: 200,
        message: 'Exam deleted successfully',
        error: false,
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Internal server error while deleting exam',
        error: true,
      };
    }
  }

  async resetLoginAttemptsForCandidates(examId: string, candidateIds?: string[]): Promise<ApiResponse> {
    try {
      if (!candidateIds || candidateIds.length === 0) {
        // Reset loginAttempts for all candidates in the exam
        await CandidateProgress.update(
          { loginAttempts: 0 },
          { where: { examId } }
        );
      } else {
        // Reset loginAttempts for specified candidates in the exam
        await CandidateProgress.update(
          { loginAttempts: 0 },
          { where: { examId, candidateId: candidateIds } }
        );
      }
      return {
        status: 200,
        message: 'Login attempts reset successfully',
        error: false,
      };
    } catch (error) {
      console.error('Error resetting login attempts:', error);
      return {
        status: 500,
        message: 'Internal server error while resetting login attempts',
        error: true,
      };
    }
  }

  async resetIsLoggedInForCandidates(examId: string, candidateIds?: string[]): Promise<ApiResponse> {
    try {
      if (!candidateIds || candidateIds.length === 0) {
        // Reset IsLoggedIn for all candidates in the exam
        await CandidateExam.update(
          { isLoggedIn: false },
          { where: { examId } }
        );
      } else {
        // Reset IsLoggedIn for specified candidates in the exam
        await CandidateExam.update(
          { isLoggedIn: false },
          { where: { examId, candidateId: candidateIds } }
        );
      }
      return {
        status: 200,
        message: 'Candidates unlocked successfully',
        error: false,
      };
    } catch (error) {
      console.error('Error resetting IsLoggedIn:', error);
      return {
        status: 500,
        message: 'Internal server error while unlocking candidates',
        error: true,
      };
    }
  }
  private candidateUrl = `${process.env.CANDIDATE_URL}`;
  private onlineServer = process.env.ONLINE_SERVER_URL;
  private appInstance = process.env.APP_INSTANCE;
  private clients: Map<string, Socket> = new Map();
  private jwtSecret = config.get('jwtSecret');
  private static examTimers: Map<string, any> = new Map();
  private static sectionTimers: Map<string, any> = new Map();

  registerClient(customClientId: string, client: Socket) {
    this.clients.set(customClientId, client);
  }

  unregisterClient(customClientId: string) {
    this.clients.delete(customClientId);
  }

  emitToClient(customClientId: string, event: string, data: any) {
    const client = this.clients.get(customClientId);

    if (client) {
      client.emit(event, data);
    }
  }

  getCurrentTimeInWAT() {
    const currentTimeInWAT = moment()
      .tz('Africa/Lagos')
      .format('YYYY-MM-DD HH:mm:ss');
    console.log(currentTimeInWAT);
    return currentTimeInWAT;
  }

  async terminateExam(currentUser, examId: string): Promise<ApiResponse> {
    try {
      const exam = await this.examRepository.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      // Set exam endTime to current time to mark it as terminated
      const currentTime = new Date();
      await this.examRepository.update(
        { endTime: currentTime },
        { where: { id: examId } },
      );

      // Mark all candidates as submitted and logged out, and process their results
      const candidates = await CandidateExam.findAll({ where: { examId } });
      for (const candidate of candidates) {
        // Check if candidate has already been submitted to avoid duplicate processing
        if (!candidate.isSubmitted) {
          // Process the exam for this candidate - grade their responses
          try {
            await this.gradeExam(candidate.candidateId, examId);
          } catch (gradeError) {
            console.error(`Error grading exam for candidate ${candidate.candidateId}:`, gradeError);
            // Continue processing other candidates even if one fails
          }
        }

        // Update candidate status
        await CandidateExam.update(
          { 
            isSubmitted: true, 
            isLoggedIn: false
          },
          { where: { id: candidate.id } },
        );
        
        this.emitToClient(`${candidate.candidateId}_${examId}`, 'logged-out', {
          message: 'Exam terminated by admin',
        });
        
        this.emitToClient(`${candidate.candidateId}_${examId}`, 'exam-submitted', {
          message: 'Exam has been automatically submitted by admin',
          data: { examId, candidateId: candidate.candidateId }
        });
      }

      // Process non-participating candidates with zero scores
      await this.processNonParticipatingCandidates(examId);
      const allCandidates = await CandidateExam.findAll({ where: { examId } });
      const gradedCandidates = await Grade.findAll({
        where: { examId },
        attributes: ['candidateId']
      });
      const gradedCandidateIds = new Set(gradedCandidates.map(g => g.candidateId));

      const resultExport = allCandidates.map(candidate => ({
        candidateId: candidate.candidateId,
        score: gradedCandidateIds.has(candidate.candidateId) ? candidate.score : 0,
      }));

      // Return the result export
      return {
        status: 200,
        message: 'Exam terminated successfully with results processed',
        data: resultExport,
        error: false,
      };

      await AuditLog.create({
        action: `Terminated Exam: ${examId}`,
        userId: currentUser.sub,
      });

      return {
        status: 200,
        message: 'Exam terminated successfully with results processed',
        error: false,
      };
    } catch (e) {
      console.error('Error terminating exam:', e);
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async processNonParticipatingCandidates(examId: string): Promise<void> {
    try {
      // Get all candidates registered for this exam
      const allCandidates = await CandidateExam.findAll({
        where: { examId },
        include: [Candidate]
      });

      // Get candidates who have grades (participated)
      const gradedCandidates = await Grade.findAll({
        where: { examId },
        attributes: ['candidateId']
      });

      const gradedCandidateIds = new Set(gradedCandidates.map(g => g.candidateId));

      // Process non-participating candidates
      for (const candidateExam of allCandidates) {
        if (!gradedCandidateIds.has(candidateExam.candidateId)) {
          // Create zero-score grade record for non-participating candidate
          const exam = await Exam.findByPk(examId);
          const sections = await Section.findAll({ where: { examId } });

          let totalQuestions = 0;
          const sectionGrades = [];

          for (const section of sections) {
            const sectionQuestions = await this.getSectionQuestionNonPaginated(section.id);
            const questions = sectionQuestions.questions || [];
            totalQuestions += questions.length;

            sectionGrades.push({
              sectionId: section.id,
              subject: sectionQuestions.subject || 'Unknown',
              totalQuestions: questions.length,
              correctAnswers: 0,
              incorrectAnswers: 0,
              unansweredQuestions: questions.length,
              candidateScore: 0,
              totalObtainableScore: questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0),
              essayResponses: []
            });
          }

          // Create grade record with zero scores
          await Grade.create({
            candidateId: candidateExam.candidateId,
            examId: examId,
            nonEssayGrade: '0',
            essayGrade: '0',
            totalNoOfQuestion: totalQuestions,
            noOfAttemptedQuestions: 0,
            sectionGrades: sectionGrades
          });

          // Mark candidate exam as submitted
          await CandidateExam.update(
            { 
              isSubmitted: true,
              isLoggedIn: false
            },
            { 
              where: { 
                candidateId: candidateExam.candidateId, 
                examId: examId 
              } 
            }
          );
        }
      }
    } catch (error) {
      console.error('Error processing non-participating candidates:', error);
      throw error;
    }
  }

  async customizeResult(examId: string, dto: ResultTypeDto) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      await Exam.update(
        { resultType: dto.resultType },
        { where: { id: examId } },
      );
      return {
        status: 200,
        message: 'result customized successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'An error ocuured',
        error: true,
      };
    }
  }
  async createExam(createExamDto: CreateExamDto): Promise<ApiResponse> {
    try {
      const existingExam = await this.findExamByName(createExamDto.title);
      if (existingExam) {
        return {
          status: 400,
          message: 'exam with this title already exist',
          error: true,
        };
      }

      let overallTime = null;
      if (
        (createExamDto.setOverallTimer == false && createExamDto.timing) ||
        (createExamDto.setOverallTimer == true && !createExamDto.timing)
      ) {
        return {
          status: 400,
          message: 'please, enable setOverallTimer and set a valid time',
          error: true,
        };
      }
      const sectionValidationErrors = [];
      // Validate each section first
      for (const sect of createExamDto.sections) {
        console.log(
          (createExamDto.setSectionTimer === false && !sect.timing) ||
            (createExamDto.setSectionTimer === true && !sect.timing),
        );
        if (
          (createExamDto.setSectionTimer === false && sect.timing) ||
          (createExamDto.setSectionTimer === true && !sect.timing)
        ) {
          sectionValidationErrors.push(
            'please, enable section timer and set a valid section time',
          );
        }

        const itm = await Item.findByPk(sect.itemId);
        if (!itm) {
          sectionValidationErrors.push('Invalid item id');
        }
      }

      // Check if there are section validation errors
      if (sectionValidationErrors.length > 0) {
        return {
          status: 400,
          message: sectionValidationErrors.join(', '),
          error: true,
        };
      }

      overallTime = createExamDto.timing;
      const exam = await this.examRepository.create<Exam>({
        title: createExamDto.title,
        deliveryMode: createExamDto.deliveryMode,
        type: createExamDto.type,
        startTime: createExamDto.startTime,
        endTime: createExamDto.endTime,
        randomizeOverall: createExamDto.randomizeOverall,
        randomizePerSection: createExamDto.randomizePerSection,
        setOverallTimer: createExamDto.setOverallTimer,
        setSectionTimer: createExamDto.setSectionTimer,
        faceCaptureRequired: createExamDto.faceCaptureRequired,
        instructions: createExamDto.instructions,
        showBreakdown: createExamDto.showBreakdown
          ? createExamDto.showBreakdown
          : true,
        showResult: createExamDto.showResult ? createExamDto.showResult : true,
        resultType: createExamDto.resultType
          ? createExamDto.resultType
          : ResultType.Percentage,
timeLimit: createExamDto.timing,
        lockedScreenEnabled: createExamDto.lockedScreenEnabled || false,
        lockedScreenPassword: createExamDto.lockedScreenPassword || null,
        calculatorEnabled: createExamDto.calculatorEnabled || false,
      });
      const regLink = `${this.candidateUrl}register?id=${exam.id}`;
      await Exam.update(
        {
          regLink: regLink,
        },
        { where: { id: exam.id } },
      );

      for (let sect of createExamDto.sections) {
        if (createExamDto.sections.length == 0) continue;
        // console.log(((exam.setOverallTimer==false)&&(sect.timing)))
        // console.log(((exam.setSectionTimer==true)&&(!sect.timing)))

        const item = await Item.findByPk(sect.itemId);
        if (!item) {
          return { status: 400, message: 'Invalid item id', error: true };
        }
        const newSection = await this.sectionRepository.create({
          examId: exam.id,
          title: item.questionSubject,
          instructions: sect.instructions ? sect.instructions.toString() : null,
          timeLimit: sect.timing,
          randomizeItems: exam.randomizePerSection,
          difficultyLevels: sect.difficultyLevels,
        });
        //  await ExamItem.create({
        //   examId:exam.id,
        //   itemId:sect.itemId
        //  });
        await exam.$add('Item', item.id);
        await exam.$add('Section', newSection.id);
        await newSection.$add('Item', sect.itemId);
      }
      for (let id of createExamDto.centers) {
        if (createExamDto.centers.length == 0) continue;
        let center = await Center.findByPk(id);
        if (!center) {
          return {
            status: 400,
            message: 'Invalid center id',
            error: true,
          };
        }

        const assignedCenter = await ExamCenter.findOne({
          where: {
            centerId: center.id,
            examId: exam.id,
          },
        });

        if (assignedCenter) {
          continue;
        }

        await exam.$add('Center', center.id);
      }
      return {
        status: 200,
        message: 'exam created successfully',
        data: {
          ...exam,
        },
        error: false,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async updateExam(
    examId: string,
    createExamDto: CreateExamDto,
  ): Promise<ApiResponse> {
    try {
      const existingExam = await Exam.findByPk(examId);
      if (!existingExam) {
        return {
          status: 400,
          message: 'exam not found',
          error: true,
        };
      }

      let overallTime = null;
      if (
        (createExamDto.setOverallTimer == false && createExamDto.timing) ||
        (createExamDto.setOverallTimer == true && !createExamDto.timing)
      ) {
        return {
          status: 400,
          message: 'please, enable setOverallTimer and set a valid time',
          error: true,
        };
      }
      overallTime = createExamDto.timing;

      await Exam.update(
        {
          title: createExamDto.title,
          deliveryMode: createExamDto.deliveryMode,
          type: createExamDto.type,
          startTime: createExamDto.startTime,
          endTime: createExamDto.endTime,
          randomizeOverall: createExamDto.randomizeOverall,
          randomizePerSection: createExamDto.randomizePerSection,
          setOverallTimer: createExamDto.setOverallTimer,
          setSectionTimer: createExamDto.setSectionTimer,
          faceCaptureRequired: createExamDto.faceCaptureRequired,
          instructions: createExamDto.instructions,
          showBreakdown: createExamDto.showBreakdown
            ? createExamDto.showBreakdown
            : true,
          showResult: createExamDto.showResult
            ? createExamDto.showResult
            : true,
          resultType: createExamDto.resultType
            ? createExamDto.resultType
            : ResultType.Percentage,
timeLimit: overallTime,
          lockedScreenEnabled: createExamDto.lockedScreenEnabled || false,
          lockedScreenPassword: createExamDto.lockedScreenPassword || null,
          calculatorEnabled: createExamDto.calculatorEnabled || false,
        },
        { where: { id: examId } },
      );

      for (let sect of createExamDto.sections) {
        if (createExamDto.sections.length == 0) continue;
        if (
          (createExamDto.setSectionTimer == false && sect.timing) ||
          (createExamDto.setSectionTimer == true && !sect.timing)
        ) {
          return {
            status: 400,
            message: 'please, enable setSectionTimer and set a valid time',
            error: true,
          };
        }

        if (!sect.id) {
          const item = await Item.findByPk(sect.itemId);
          if (!item) {
            return {
              status: 400,
              message: 'Invalid item id',
              error: true,
            };
          }

          const newSection = await this.sectionRepository.create({
            examId: examId,
            title: item.questionSubject,
            instructions: sect.instructions ? sect.instructions.toString() : null,
            timeLimit: sect.timing,
            randomizeItems: existingExam.randomizePerSection,
            difficultyLevels: sect.difficultyLevels || null,
          });

          await SectionItem.create({ sectionId: newSection.id, itemId: sect.itemId });
        } else {
          let section = await Section.findByPk(sect.id);
          if (!section) {
            // Create the section if it doesn't exist
            const item = await Item.findByPk(sect.itemId);
            if (!item) {
              return {
                status: 400,
                message: 'Invalid item id',
                error: true,
              };
            }

            section = await this.sectionRepository.create({
              id: sect.id,
              examId: examId,
              title: item.questionSubject,
              instructions: sect.instructions ? sect.instructions.toString() : null,
              timeLimit: sect.timing,
              randomizeItems: existingExam.randomizePerSection,
              difficultyLevels: sect.difficultyLevels || null,
            });

            await SectionItem.create({ sectionId: section.id, itemId: sect.itemId });
          } else if (section.examId !== examId) {
            // Update examId if different
            await this.sectionRepository.update(
              { examId: examId },
              { where: { id: sect.id } },
            );
          }

          await this.sectionRepository.update(
            {
              instructions: sect.instructions ? sect.instructions.toString() : null,
              timeLimit: sect.timing,
              randomizeItems: existingExam.randomizePerSection,
              difficultyLevels: sect.difficultyLevels || section.difficultyLevels,
            },
            { where: { id: sect.id } },
          );

          const sectionItem = await SectionItem.findOne({
            where: { sectionId: sect.id, itemId: sect.itemId },
          });
          if (!sectionItem) {
            await SectionItem.create({ sectionId: sect.id, itemId: sect.itemId });
          }
        }
      }

      for (let cent of createExamDto.centers) {
        if (createExamDto.centers.length == 0) continue;
        let center = await Center.findByPk(cent.id);
        if (!center) {
          return {
            status: 400,
            message: 'Invalid center id',
            error: true,
          };
        }

        const assignedCenter = await ExamCenter.findOne({
          where: {
            centerId: center.id,
            examId: examId,
          },
        });

        if (!assignedCenter) {
          await ExamCenter.create({ examId: examId, centerId: center.id });
        } else {
          if (assignedCenter.isDownloaded) {
            await ExamHistory.create({
              operation: 'UPDATE',
              examId: examId,
              recordId: examId,
              tableName: 'Exam',
              isActive: true,
            });
          }
        }
      }

      return {
        status: 200,
        message: 'exam updated successfully',
        data: {
          id: existingExam.id,
          name: existingExam.title,
        },
        error: false,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async setExamReminder(examId: string, dto: SetExamReminderDto) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      await Reminder.create({
        ...dto,
        examId: examId,
      });
      return {
        status: 200,
        message: 'Exam reminder set successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: false,
      };
    }
  }

  async editExamReminder(examId: string, dto: EditExamReminderDto) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      const reminder = await Reminder.findByPk(dto.id);
      if (!reminder) {
        return {
          status: 400,
          message: 'Invalid reminder id',
          error: true,
        };
      }
      await Reminder.update(
        {
          subject: dto.subject,
          message: dto.message,
          scheduledDate: dto.scheduledDate,
          isSent: false,
        },
        { where: { id: dto.id, examId: examId } },
      );
      return {
        status: 200,
        message: 'Exam reminder updated successfully',
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: false,
      };
    }
  }

  @Cron('0 0 */1 * * *')
  async sendReminders() {
    try {
      let reminders = await Reminder.findAll();
      console.log('background task running');
      for (let r of reminders) {
        const targetTime = moment(r.scheduledDate, 'YYYY-MM-DD HH:mm:ss');
        const currentTime = moment();
        if (currentTime.isAfter(targetTime) && r.isSent == false) {
          let candidates = await CandidateExam.findAll({
            where: { examId: r.examId },
            include: { model: Candidate },
          });
          console.log(candidates);
          for (let c of candidates) {
            let cand = c.candidate;
            let html = `${r.message}`;
            //this.emailService.sendEmailSendgrid(html, cand.email, r.subject);
            this.emailService.sendEmail(cand.email, r.subject, html);
          }
          await Reminder.update({ isSent: true }, { where: { id: r.id } });
        }
      }
    } catch (e) {}
  }

  async findExamByName(name: string): Promise<Exam> {
    return await Exam.findOne<Exam>({
      where: { title: name },
    });
  }

  async findExamById(id: string): Promise<ApiResponse> {
    const exam = await Exam.findOne<Exam>({
      where: { id: id },
    });
    return {
      status: 200,
      message: 'exam retrieved successfully',
      data: exam,
      error: false,
    };
  }

  async addItemsToExam(
    addItemToExamDto: AddItemsToExamDto,
  ): Promise<ApiResponse> {
    try {
      const examExists = await this.examRepository.findByPk<Exam>(
        addItemToExamDto.examId,
      );
      if (!examExists) {
        return {
          status: 400,
          message: 'Exam with this id does not exists',
          error: true,
        };
      }

      const items = await Item.findAll({
        where: { id: addItemToExamDto.itemIds },
      });

      for (const item of items) {
        await examExists.$add('Item', item.id);
      }

      return {
        status: 200,
        message: 'Items added successfully',
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async createSection(addSectionDto: CreateSectionDto) {
    try {
      const examExists = await this.examRepository.findByPk<Exam>(
        addSectionDto.examId,
      );
      if (!examExists) {
        return {
          status: 400,
          message: 'Exam with this id does not exists',
          error: true,
        };
      }
      const item = await Item.findByPk(addSectionDto.itemId);
      if (!item) {
        return {
          status: 400,
          message: 'invalid item id',
          error: true,
        };
      }
      const newSection = await this.sectionRepository.create({
        examId: examExists.id,
        title: item.questionSubject,
        randomizeItems: examExists.randomizePerSection,
      });

      await examExists.$add('Section', newSection.id);
      await newSection.$add('Item', addSectionDto.itemId);
      return {
        status: 200,
        message: 'Section Created Successfully',
        data: {
          id: newSection.id,
        },
        error: false,
      };
    } catch (e) {}
  }

  async addInstructionsToSection(addInstructions: AddInstructionsToSectionDto) {
    try {
      const section = await Section.findByPk(addInstructions.sectionId);
      if (!section) {
        return {
          status: 400,
          message: 'section with this id does not exist',
          error: true,
        };
      }

      await Section.update(
        { instructions: addInstructions.toString() },
        { where: { id: section.id } },
      );

      return {
        status: 200,
        message: 'instructions added successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async getSectionById(id: string) {
    try {
    } catch (e) {}
  }

  async getExamItems(examId: string): Promise<ApiResponse> {
    try {
      let exam = await Exam.findOne({
        where: { id: examId },
        include: { model: Item },
      });

      if (!exam) {
        return {
          status: 400,
          message: 'No Exam with this id',
          error: true,
        };
      }

      let items = exam.items.map((item) => ({
        id: item.id,
        name: `ITEM${item.id.substring(0, 4).toUpperCase()}`,
        questionType: item.questionType,
        questionTopic: item.questionTopic,
        questionSubject: item.questionSubject,
      }));
      return {
        status: 200,
        message: 'exam items retrieved successfully',
        data: items,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async getExamSections(examId) {
    try {
      let exam = await Exam.findOne({
        where: { id: examId },
      });

      if (!exam) {
        return {
          status: 400,
          message: 'No Exam with this id',
          error: true,
        };
      }

      const sections = await Section.findAll({
        where: { examId: examId },
        include: {
          model: Item,
          include: [
            {
              model: Question,
            },
          ],
        },
      });

      sections.sort((a, b) =>
        moment(a.createdAt).isBefore(b.createdAt) ? -1 : 1,
      );
   
      let data = [];
      for (let sec of sections) {
        const item = sec.items.find((item) => item);

        if (item) {
          data.push({
            id: sec.id,
            title: sec.title,
            timeLimit: sec.timeLimit,
            instructions: sec.instructions,
            subject: item.questionSubject,
            topic: item.questionTopic,
            difficultyLevel: item ? item.difficultyLevel : null,
            questionType: item ? item.questionType : null,
            noOfQuestions: item ? item.questions.length : 0,
            createdAt: sec.createdAt,
            updatedAt: sec.updatedAt,
          });
        }
      }

      return {
        status: 200,
        message: 'Exam sections retrieved successfully',
        data: data,
        error: false,
      };
    } catch (e) {
      console.log(e.message);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async getSectionQuestions(
    sectionId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse> {
    try {
      const offset = (page - 1) * limit;

      let section = await Section.findOne({
        where: { id: sectionId },
        include: { model: Item },
      });
      console.log(section);
      if (!section) {
        return {
          status: 400,
          message: 'No section with this id',
          error: true,
        };
      }

      const { rows, count } = await Question.findAndCountAll({
        where: { itemId: section.items[0].id },
        limit: Number(limit),
        offset,
      });

      return {
        status: 200,
        message: 'section questions retrieved successfully',
        data: rows,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async getSectionQuestionNonPaginated(sectionId: string): Promise<any> {
    try {
      let section = await Section.findOne({
        where: { id: sectionId },
        include: { model: Item },
      });
    

      if (!section) {
        return {
          status: 400,
          message: 'No section with this id',
          error: true,
        };
      }

      const questions = await Question.findAll({
        where: { itemId: section.items[0].id },
      });

      let preparedQuestions = [];

      if (section.difficultyLevels) {
        for (let [difficulty, count] of Object.entries(
          section.difficultyLevels,
        )) {
        
          let filteredQuestions = questions.filter(
            (question) => {
              return question.difficultyLevel.toLowerCase().trim() ===
              difficulty.toLowerCase().trim()
            }
              
          );

          const selectedQuestions = filteredQuestions.slice(0, Number(count));

          preparedQuestions = preparedQuestions.concat(selectedQuestions);
        }
      } else {

        preparedQuestions = questions;
      }
    

      return {
        questions: preparedQuestions,
        subject: section.items[0].questionSubject,
      };
    } catch (e) {
      throw e;
    }
  }

  async getAllQuestionsForExam(examId: string): Promise<any> {
    try {
      let examItems = await ExamItem.findAll({
        where: { examId: examId },
      });
      const allQuestions = [];

      for (let s of examItems) {
  
        // let section = await Section.findOne({
        //   where: { examId: examId },
        //   include: {model:Item}
        // });
        const questions = await Question.findAll({
          where: { itemId: s.itemId },
        });
        for (let q of questions) {
          allQuestions.push(q.dataValues);
        }
      }

      return allQuestions;
    } catch (e) {
      throw e;
    }
  }

  async getAllLocalAdmins(
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse> {
    try {
      const offset = (page - 1) * limit;

      const { rows, count } = await User.findAndCountAll<User>({
        limit: Number(limit),
        offset,
      });

      let users = [];
      for (let r of rows) {
        console.log(r);
        const role = await Role.findByPk(r.roleId);
        if (role.name !== 'local-admin') continue;
        users.push({
          ...r.dataValues,
          assignedRole: role.name,
        });
      }
      return {
        status: 200,
        message: 'List of Local admins retrieved successfully',
        data: users,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: `Internal Server Error: ${err.message}`,
        error: true,
      };
    }
  }

  async getAllLocalAdminsForExam(
    examId,
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse> {
    try {
      const offset = (page - 1) * limit;

      let examCenters = await ExamCenter.findAll({ where: { examId } });
      let admins = [];
      for (let e of examCenters) {
        const admin = await User.findByPk(e.adminId);
        const center = await Center.findByPk(e.centerId);

        if (admin && center) {
          const role = await Role.findByPk(admin.roleId);
          admins.push({
            ...admin.dataValues,
            assignedRole: role.name,
            center: center.dataValues,
          });
        }
      }

      return {
        status: 200,
        message: 'List of Local admins  retrieved successfully',
        data: admins,
        // pageInfo: {
        //   totalItems: count,
        //   totalPages: Math.ceil(count / limit),
        //   currentPage: page,
        // },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: `Internal Server Error: ${err.message}`,
        error: true,
      };
    }
  }

  async getCandidateExamQuestions(
    examId: string,
    candidateId: string,
    candidateSectionNames: string[],
  ): Promise<any> {
    try {
      let examSections = await this.getExamSections(examId);

      let candidateSections = examSections.data.filter((s) => {
        return candidateSectionNames.includes(s.subject);
      });
      const allQuestions = [];

      for (let s of candidateSections) {
        console.log(s);
        let sectionItem = await SectionItem.findOne({
          where: { sectionId: s.id },
        });
        const questions = await Question.findAll({
          where: { itemId: sectionItem.itemId },
        });
        console.log(questions);
        for (let q of questions) {
          allQuestions.push(q.dataValues);
        }
      }

      return allQuestions;
    } catch (e) {
      throw e;
    }
  }


  async getExamById(examId: string) {
  
    let exam = await Exam.findOne({
      where: { id: examId },
      include: [
        {
          model: Section,
          include: [
            {
              model: Item,
              include: [{ model: Question }],
            },
          ],
        },
        { model: Center },
        { model: Reminder },
      ],
    });
    if (!exam) {
      return {
        status: 400,
        message: ' Exam with this id not found',
        error: true,
      };
    }
    
    if (exam.notificationSettings == null) {
      exam.notificationSettings = {
        updateOnExamTiming: true,
        updateOnGradedResponses: true,
        updateOnExtraTime: true,
      };
    }

    let refinedSections = [];
    for(let i =0;i<exam.sections.length;i++){
       let chosenQuestions  = await this.getSectionQuestionNonPaginated(exam.sections[i].id);
       let items = [];
       if (exam.sections[i].items && exam.sections[i].items.length > 0) {
         items.push({
          id: exam.sections[i].items[0].id,
          questionType: exam.sections[i].items[0].questionType,
          name: exam.sections[i].items[0].name,
          isLocalAuthoring: exam.sections[i].items[0].isLocalAuthoring,
          isSynced:exam.sections[i].items[0].isSynced,
          difficultyLevel: exam.sections[i].items[0].difficultyLevel,
          language: exam.sections[i].items[0].language,
          questionSubject: exam.sections[i].items[0].questionSubject,
          questionTopic: exam.sections[i].items[0].questionTopic,
          folderId: exam.sections[i].items[0].folderId,
          authorId: exam.sections[i].items[0].authorId,
          createdAt:exam.sections[i].items[0].createdAt,
          updatedAt: exam.sections[i].items[0].updatedAt,
          questions: chosenQuestions.questions,
          SectionItem: exam.sections[i].items[0]["SectionItem"]  
        });
       }
      
       refinedSections.push({
        id: exam.sections[i].id,
        title: exam.sections[i].title,
        instructions: exam.sections[i].instructions,
        timeLimit: exam.sections[i].timeLimit,
        randomizeItems: exam.sections[i].randomizeItems,
        difficultyLevels: exam.sections[i].difficultyLevels,
        createdAt: exam.sections[i].createdAt,
        updatedAt: exam.sections[i].updatedAt,
        examId: exam.sections[i].examId,
        items:items
       })
   
    }
    console.log("questionslengthoutside", exam.sections[0].items[0]["questions"].length)
    console.log("refinedSections", refinedSections[0].items[0]["questions"].length)
    //exam["sections"] = refinedSections;
return {
      status: 200,
      message: 'Exam retrieved successfully',
      data:{
        id: exam.id,
        title: exam.title,
        startTime: exam.startTime,
        endTime: exam.endTime,
        deliveryMode: exam.deliveryMode,
        type: exam.type,
        randomizePerSection: exam.randomizePerSection,
        randomizeOverall: exam.randomizeOverall,
        faceCaptureRequired: exam.faceCaptureRequired,
        allowReLogin: exam.allowReLogin,
        allowComputerChange: exam.allowComputerChange,
        setOverallTimer: exam.setOverallTimer,
        timeLimit: exam.timeLimit,
        setSectionTimer: exam.setSectionTimer,
        regLink: exam.regLink,
        showResult: exam.showResult,
        showBreakdown: exam.showBreakdown,
        resultType: exam.resultType,
        inviteSent: exam.inviteSent,
        instructions: exam.instructions,
        notificationSettings: exam.notificationSettings,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        sections:refinedSections,
        centers: exam.centers,
        reminders:exam.reminders,
        lockedScreenEnabled: exam.lockedScreenEnabled,
        lockedScreenPassword: exam.lockedScreenPassword,
        calculatorEnabled: exam.calculatorEnabled,
      },
      error: false,
    };
  }

  

  async markAsDownloaded(dto: DownloadExamDto) {
    try {
      const examCenter = await ExamCenter.findOne({
        where: { examId: dto.examId, centerId: dto.centerId },
      });

      if (!examCenter) {
        return {
          status: 400,
          message: 'Invalid examId or centerId',
          error: true,
        };
      }

      await ExamCenter.update(
        { isDownloaded: true },
        { where: { examId: dto.examId, centerId: dto.centerId } },
      );

      return {
        status: 200,
        message: 'Exam updated successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'An error occurred',
        error: false,
      };
    }
  }

  async getExamBriefDetails(examId: string) {
    let exam = await Exam.findOne({
      where: { id: examId },
    });
    if (!exam) {
      return {
        status: 400,
        message: ' Exam with this id not found',
        error: true,
      };
    }
    console.log(exam);
    const examSubjects = await this.getExamSubjects(examId);
    const examCenters = await ExamCenter.findAll({ where: { examId: examId } });
    const centers = [];
    for (let c of examCenters) {
      let center = await Center.findByPk(c.centerId);
      if (center) centers.push(center);
    }

    if (exam.notificationSettings == null) {
      exam.notificationSettings = {
        updateOnExamTiming: true,
        updateOnGradedResponses: true,
        updateOnExtraTime: true,
      };
    }

    let reminders = await Reminder.findAll({ where: { examId: exam.id } });
    return {
      status: 200,
      message: 'Exam retrieved successfully',
      data: {
        exam,
        centers: centers,
        subjects: examSubjects.data,
        reminders: reminders,
      },
      error: false,
    };
  }
  async getExamQuestionsForLocalDownload(user, downloadDto: DownloadExamDto) {
    try {
      let exam = await Exam.findOne({
        where: { id: downloadDto.examId },
      });
      if (!exam) {
        return {
          status: 400,
          message: ' Exam with this id not found',
          error: true,
        };
      }

      const center = await Center.findByPk(downloadDto.centerId);

      const examCenter = await ExamCenter.findOne({
        where: { examId: downloadDto.examId, centerId: downloadDto.centerId },
      });
      if (!center || !examCenter) {
        return {
          status: 400,
          message: 'Invalid center id',
          error: true,
        };
      }
      const userFound = await User.findByPk(user.sub);
      if (!userFound) {
        return {
          status: 400,
          message: 'user not admin of this center',
          error: true,
        };
      }
      let examData = [];

    

      let sections = await Section.findAll({
        where: { examId: downloadDto.examId },
      });
      let sectionItems = [];
      let candidateSections = [];
      for (let section of sections) {
        let currentSectionItems = await SectionItem.findAll({
          where: { sectionId: section.id },
        });
        sectionItems.push(...currentSectionItems);
        let currentCandidateSections = await CandidateSection.findAll({
          where: { sectionId: section.id },
        });
        candidateSections.push(...currentCandidateSections);
      }
      let items = [];
      let questions = [];
      let itemFolders = [];
      let examItems = [];
      for (let record of sectionItems) {
        let item = await Item.findOne({ where: { id: record.itemId } });
        items.push({ ...item.dataValues });
        let itemQuestions = await Question.findAll({
          where: { itemId: item.id },
        });
        const extractedQuestions = itemQuestions.map((question) => ({
          id: question.id,
          content: question.content,
          type: question.type,
          options: question.options,
          score: question.score,
          questionTopic: question.correctOption,
          correctOption: question.correctOption,
          difficultyLevel:question.difficultyLevel,
          embeddedMedia: question.embeddedMedia,
          translations: question.translations,
          itemId: question.itemId,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
        }));
        questions.push(...extractedQuestions);
        if (item && item.folderId) {
          let itemFolder = await ItemFolder.findOne({
            where: { id: item.folderId },
          });
          if (itemFolder) itemFolders.push(itemFolder.dataValues);
        }
        let examItem = await ExamItem.findOne({
          where: { examId: downloadDto.examId, itemId: item.id },
        });
        examItems.push(examItem.dataValues);
      }
      let candidateExams = [];
      let candidates = [];
    
      if(examCenter.isDownloaded){
        const examHistories = await ExamHistory.findAll({where:{examId:downloadDto.examId, isActive:true}});
        let filteredCandSect = [];
        for(let history of examHistories){
  
          if(history.tableName=="Candidate"){
            let cand  = await Candidate.findOne({where:{id: history.recordId}})
            candidates.push(cand);
          }
          else if(history.tableName=="CandidateExam"){
            let candExam  = await CandidateExam.findOne({where:{id: history.recordId}})
            let candSect  = await CandidateSection.findAll({where:{candidateId:candExam.candidateId}})
            candidateExams.push(candExam)
            const sectionIds = sections.map(s=>s.id);
            const filteredSections = candSect.filter((s) => sectionIds.includes(s.sectionId));
            filteredCandSect.push(...filteredSections);
          }
        }
        examData.push({
          exam: exam.dataValues,
          user: userFound.dataValues,
          center: center.dataValues,
          examCenter: examCenter.dataValues,
          candidates: candidates,
          candidateExams: candidateExams,
          itemFolders: itemFolders,
          items: items,
          examItems: examItems,
          questions: questions,
          sections:sections,
          sectionItems:sectionItems,
          candidateSections:filteredCandSect,
          examHistories:examHistories
        })

  
      }
      else{
        candidateExams = await CandidateExam.findAll({
          where: { examId: downloadDto.examId, centerId: downloadDto.centerId },
        });
        let extractedCandidateExams = candidateExams.map((c) => ({
          id: c.id,
          startTime: c.startTime,
          endTime: c.endTime,
          isSubmitted: c.isSubmitted,
          isOnline: c.isOnline,
          candidateId: c.candidateId,
          assignedSubjects: c.assignedSubjects,
          timer: c.timer,
          centerId: c.centerId,
          faceCaptured: c.faceCaptured,
          examId: c.examId,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
  
        for (let person of extractedCandidateExams) {
          let candidate = await Candidate.findByPk(person.candidateId);
          candidates.push({ ...candidate.dataValues });
        }
        examData.push({
          exam: exam.dataValues,
          user: userFound.dataValues,
          center: center.dataValues,
          examCenter: examCenter.dataValues,
          candidates: candidates,
          candidateExams: extractedCandidateExams,
          itemFolders: itemFolders,
          items: items,
          examItems: examItems,
          questions: questions,
          sections: sections,
          sectionItems,
          candidateSections,
        });
      }
    
      return {
        status: 200,
        message: 'Exam retrieved successfully',
        data: JSON.stringify(examData),
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `An error occured: ${e.message}`,
        error: true,
      };
    }
  }


  async synchronizeData(token, data, onlineApiUrl) {
    try {
      const response = await axios.post(onlineApiUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      console.log("data received", response)
      if (response.data.status === 200) {
        console.log("response")
        const examData = JSON.parse(response.data.data);
        console.log(examData)
        for (const record of examData) {
           console.log("exam",record.exam);
          // Perform bulk inserts with update on duplicate
          await Exam.bulkCreate([record.exam], { updateOnDuplicate: ["endTime", "startTime", "instructions", "title"] });

            if (record.user) {
              await User.bulkCreate([record.user], { updateOnDuplicate: ["firstName", "lastName"] });
            }

            if (record.center) {
              await Center.bulkCreate([record.center], { updateOnDuplicate: ["name"] });
            }

            if (record.examCenter) {
              await ExamCenter.bulkCreate([record.examCenter], { updateOnDuplicate: ['id'] });
            }

            // Iterate through each candidate and create them
            if (record.candidates && record.candidates.length > 0) {
              const candidatesWithCenterId = record.candidates.map(candidate => ({
                ...candidate,
                centerId: record.examCenter.centerId
              }));

              await Candidate.bulkCreate(candidatesWithCenterId, { updateOnDuplicate: ["password", "plainPassword", "assignedSubjects"] });
            }

            if (record.candidateExams && record.candidateExams.length > 0) {
              await CandidateExam.bulkCreate(record.candidateExams, { updateOnDuplicate: ['candidateId', 'examId'] });
            }

            if (record.itemFolders && record.itemFolders.length > 0) {
              await ItemFolder.bulkCreate(record.itemFolders.map(folder => 
                ({
                  id: folder.id,
                  name: folder.name,
                  description: folder.description,
                  createdAt: folder.createdAt,
                  updatedAt: folder.updatedAt,
                  ownerId: record.user.id
                })),
                { updateOnDuplicate: ['name'] }
              );
            }

            if (record.items && record.items.length > 0) {
              await Item.bulkCreate(record.items.map(item => 
                ({
                  id: item.id,
                  name: item.name,
                  questionType: item.questionType,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                  folderId: item.folderId,
                  isLocalAuthoring: item.isLocalAuthoring,
                  isSynced: item.isSynced,
                  questionSubject: item.questionSubject,
                  questionTopic: item.questionTopic,
                  difficultyLevel: item.difficultyLevel,
                  authorId: record.user.id
                })),
                { updateOnDuplicate: ['name'] }
              );
            }

            if (record.questions && record.questions.length > 0) {
              await Question.bulkCreate(record.questions, { updateOnDuplicate: ["content", "options", "correctOption"] });
            }

            if (record.sections && record.sections.length > 0) {
              await Section.bulkCreate(record.sections, {
                fields: ["id", "title", "instructions", "timeLimit", "examId", "randomizeItems", "difficultyLevels", "createdAt", "updatedAt"],
                updateOnDuplicate: ["title", "examId", "instructions", "difficultyLevels"]
              });
            }

            if (record.sectionItems && record.sectionItems.length > 0) {
              await SectionItem.bulkCreate(record.sectionItems, { updateOnDuplicate: ["sectionId", "itemId"] });
            }
            
            console.log(record.candidateSections)
            if (record.candidateSections && record.candidateSections.length > 0) {
              await CandidateSection.bulkCreate(record.candidateSections, {
                fields: ["id", "sectionId", "candidateId", "timer", "endTime", "createdAt", "updatedAt"],
                updateOnDuplicate: ["id", "sectionId", "candidateId", "timer", "endTime", "createdAt", "updatedAt"]
              });
            }

            if (record.examItems && record.examItems.length > 0) {
              await ExamItem.bulkCreate(record.examItems, { updateOnDuplicate: ["examId", "itemId"] });
            }

            if (record.examHistories && record.examHistories.length > 0) {
              const deleteOps = record.examHistories.filter(r => r.operation === "DELETE");
              for (const op of deleteOps) {
                if (op.tableName === "Candidate") {
                  await Promise.all([
                    CandidateExam.destroy({ where: { candidateId: op.recordId } }),
                    CandidateSection.destroy({ where: { candidateId: op.recordId } }),
                    Candidate.destroy({ where: { id: op.recordId } })
                  ]);
                }
              }
            } 
          // Mark exam as downloaded
          const markUrl = `${this.onlineServer}/exam/mark-as-downloaded`;
          const updateData = {
            examId: record.exam.id,
            centerId: record.center.id,
          };
          const result = await axios.post(markUrl, updateData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
  
          if (result.data.status === 200) {
            return {
              status: 200,
              message: 'Exam downloaded successfully',
              error: false,
            };
          }
        }
      }
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: `An Error Occurred: ${error}`,
        error: true,
      };
    }
  }
  
  
  async synchronizeWithRetry(token, data, onlineApiUrl) {
    try {
      // const result = await retry(
      //   async () => {
      //     const jsonData = JSON.stringify(data);
      //     return await this.synchronizeData(token,jsonData, onlineApiUrl);
      //   },
      //   {
      //     retries: 3,
      //     onRetry: (err, attempt) => {
      //       console.log(`Retry attempt ${attempt}, Error: ${err.message}`);
      //     },
      //   }
      // );
      const jsonData = JSON.stringify(data);
      //  console.log(jsonData);
      console.log(data);
      return await this.synchronizeData(token, jsonData, onlineApiUrl);
    } catch (error) {
      throw error; // Handle retries exhausted or other exceptions
    }
  }

  async downloadExamToLocalServer(user, downloadDto: DownloadExamDto) {
    try {
      const onlineUrl = `${this.onlineServer}/exam/pull`;
      return await this.synchronizeWithRetry(
        user.token,
        downloadDto,
        onlineUrl,
      );
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `An error occurred: ${e}`,
        error: true,
      };
    }
  }

  // async triggerEndOfDay(user, dto: TriggerEndOfDayDto) {
  //   try {
  //     const examCenter = await ExamCenter.findOne({
  //       where: { examId: dto.examId, centerId: dto.centerId },
  //     });
  //     if (!examCenter) {
  //       return {
  //         status: 400,
  //         message: 'Invalid exam id or center id',
  //         error: true,
  //       };
  //     }
  //     const exam = await Exam.findByPk(dto.examId);
  //     let progresses = await CandidateProgress.findAll({
  //       where: { examId: dto.examId },
  //     });
  //     let mappedProgress = progresses.map((progress) => {
  //       return {
  //         id: progress.id,
  //         candidateId: progress.candidateId,
  //         examId: progress.examId,
  //         currentSectionId: progress.currentSectionId,
  //         questionStatus: progress.questionStatus,
  //         sectionStatus: progress.sectionStatus,
  //         loginAttempts: progress.loginAttempts,
  //         networkFailures: progress.networkFailures,
  //         lastLogin: progress.lastLogin,
  //         createdAt: progress.createdAt,
  //         updatedAt: progress.updatedAt,
  //       };
  //     });
  //     const grades = await Grade.findAll({ where: { examId: dto.examId } });
  //     let mappedGrades = grades.map((g) => {
  //       return {
  //         id: g.id,
  //         candidateId: g.candidateId,
  //         examId: g.examId,
  //         essayGrade: g.essayGrade,
  //         nonEssayGrade: g.nonEssayGrade,
  //         totalNoOfQuestion: g.totalNoOfQuestion,
  //         noOfAttemptedQuestions: g.noOfAttemptedQuestions,
  //         sectionGrades: g.sectionGrades,
  //         createdAt: g.createdAt,
  //         updatedAt: g.updatedAt,
  //       };
  //     });
  //     const responses = await CandidateResponse.findAll({
  //       where: { examId: dto.examId },
  //     });
  //     let mappedResponses = responses.map((r) => {
  //       return {
  //         id: r.id,
  //         responses: r.responses,
  //         examId: r.examId,
  //         candidateId: r.candidateId,
  //         createdAt: r.createdAt,
  //         updatedAt: r.updatedAt,
  //       };
  //     });
  //     const candidateExams = await CandidateExam.findAll({
  //       where: { examId: dto.examId },
  //     });
  //     let mappedCandidateExams = candidateExams.map((r) => {
  //       return {
  //         id: r.id,
  //         startTime: r.startTime,
  //         endTime: r.endTime,
  //         isSubmitted: r.isSubmitted,
  //         isOnline: r.isOnline,
  //         faceCaptured: r.faceCaptured,
  //         score: r.score,
  //         candidateId: r.candidateId,
  //         examId: r.examId,
  //         assignedSubjects: r.assignedSubjects,
  //         createdAt: r.createdAt,
  //         updatedAt: r.updatedAt,
  //         timer: r.timer,
  //       };
  //     });
  //     //  const candidateSections = await CandidateSection.findAll({where:{examId:dto.examId}});
  //     //  let mappedCandidateSections = candidateSections.map((r)=> {
  //     //    return {
  //     //      id:r.id,
  //     //      candidateId:r.candidateId,
  //     //      examId:r.examId,
  //     //      createdAt:r.createdAt,
  //     //      updatedAt:r.updatedAt,
  //     //      timer:r.timer
  //     //    }
  //     // })
  //     let result = {
  //       centerId: dto.centerId,
  //       exam: exam.dataValues,
  //       progresses: mappedProgress,
  //       grades: mappedGrades,
  //       responses: mappedResponses,
  //       candidateExams: mappedCandidateExams,
  //     };
  //     // const jsonData = JSON.stringify(result);
  //     // console.log(jsonData);
  //     const url = `${this.onlineServer}/exam/sync-responses`;
  //     const response = await axios.post(url, result, {
  //       headers: {
  //         Authorization: `Bearer ${user.token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //     console.log(response);
  //     if (response.data.status == 200) {
  //       const gradeIdsToDelete = grades.map((g) => g.id);
  //       await Grade.destroy({
  //         where: {
  //           id: gradeIdsToDelete,
  //         },
  //       });
  //       const progressIdsToDelete = progresses.map((g) => g.id);
  //       await CandidateProgress.destroy({
  //         where: {
  //           id: progressIdsToDelete,
  //         },
  //       });
  //       const responseIdsToDelete = responses.map((g) => g.id);
  //       await CandidateResponse.destroy({
  //         where: {
  //           id: responseIdsToDelete,
  //         },
  //       });
  //       await CandidateExam.destroy({
  //         where: {
  //           examId: exam.id,
  //         },
  //       });
  //       const sections = await Section.findAll({where:{examId:exam.id}});
  //       const sectionIdsToDelete = sections.map((g) => g.id);
  //       await CandidateSection.destroy({
  //          where:{
  //            sectionId:sectionIdsToDelete
  //          }
  //       });
  //       await Section.destroy({
  //         where: {
  //           examId: exam.id
  //         },
  //       });
  //       await Exam.destroy({
  //         where: {
  //           id: exam.id,
  //         },
  //       });
  //     }
  //     return response.data;
  //   } catch (e) {
  //     console.log(e);
  //     return {
  //       status: 500,
  //       message: `An Error Occurred: ${e.message}`,
  //       error: true,
  //     };
  //   }
  // }
  

  

  // async addExamCenter(addCenterDto: AddCenterDto): Promise<ApiResponse> {
  //   try {

  //     const exam = await Exam.findByPk(addCenterDto.examId);

  //     if (!exam) {
  //       return {
  //         status: 400,
  //         message: "Invalid Exam Id",
  //         error: true,
  //       };
  //     }

  //     if (exam.deliveryMode === 'online') {
  //       return {
  //         status: 400,
  //         message: "Center cannot be added for online exams",
  //         error: true,
  //       };
  //     }

  //     let center = await Center.findOne({ where: { name: addCenterDto.name } });

  //     if (!center) {

  //       center = await Center.create({ name: addCenterDto.name, location: addCenterDto.location });
  //     }

  //     const assignedCenter = await ExamCenter.findOne({
  //       where: {
  //         centerId: center.id,
  //         examId: addCenterDto.examId,
  //       },
  //     });

  //     if (assignedCenter) {
  //       return {
  //         status: 400,
  //         message: "This Exam Center has already been assigned",
  //         error: true,
  //       };
  //     }

  //     await exam.$add('Center',center.id);

  //     return {
  //       status: 200,
  //       message: "Exam center added successfully",
  //       data:{
  //          id: center.id
  //       },
  //       error: false,
  //     };
  //   } catch (e) {
  //     console.error(e);
  //     return {
  //       status: 500,
  //       message: `Internal Server Error: ${e.message}`,
  //       error: true,
  //     };
  //   }
  // }


  async sendApiRequest(options: ApiRequestOptions, maxRetries = 3): Promise<any> {
    const { url, payload, userToken } = options;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    };
  
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await axios.post(url, payload, config);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 503) {
          console.error('503 Request Timeout Error. Retrying...');
          retries++;
          continue;
        }
        console.error('API request error:', error);
        throw error;
      }
    }
  
    throw new Error(`API request failed after ${maxRetries} retries.`);
  }
  
  

  async sendProgressBatches(exam:any, centerId: string, batches: any[], userToken: string, url: string): Promise<{ data: any }> {
    try {
      let result;
      const responses = await Promise.all(
        batches.map(async (batch) => {
          const response = await axios.post(url, { centerId, exam, progresses: batch }, {
            headers: {
              Authorization: `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            },
          });
          result = response.data;
        })
      );
      return result;
    } catch (error) {
      console.log(error);
      return { data: { status: 500, message: `An Error Occurred: ${error.message}`, error: true } };
    }
  }

  async triggerEndOfDay(user, dto: TriggerEndOfDayDto) {
    try {
      const examCenter = await ExamCenter.findOne({
        where: { examId: dto.examId, centerId: dto.centerId },
      });
      if (!examCenter) {
        return {
          status: 400,
          message: 'Invalid exam id or center id',
          error: true,
        };
      }
      const exam = await Exam.findByPk(dto.examId);
      let progresses = await CandidateProgress.findAll({
        where: { examId: dto.examId },
      });
      let mappedProgress = progresses.map((progress) => {
        return {
          id: progress.id,
          candidateId: progress.candidateId,
          examId: progress.examId,
          currentSectionId: progress.currentSectionId,
          questionStatus: progress.questionStatus,
          sectionStatus: progress.sectionStatus,
          loginAttempts: progress.loginAttempts,
          networkFailures: progress.networkFailures,
          lastLogin: progress.lastLogin,
          createdAt: progress.createdAt,
          updatedAt: progress.updatedAt,
        };
      });
   
      const grades = await Grade.findAll({ where: { examId: dto.examId } });
      let mappedGrades = grades.map((g) => {
        return {
          id: g.id,
          candidateId: g.candidateId,
          examId: g.examId,
          essayGrade: g.essayGrade,
          nonEssayGrade: g.nonEssayGrade,
          totalNoOfQuestion: g.totalNoOfQuestion,
          noOfAttemptedQuestions: g.noOfAttemptedQuestions,
          sectionGrades: g.sectionGrades,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        };
      });
      const responses = await CandidateResponse.findAll({
        where: { examId: dto.examId },
      });
      let mappedResponses = responses.map((r) => {
        return {
          id: r.id,
          responses: r.responses,
          examId: r.examId,
          candidateId: r.candidateId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });
      const candidateExams = await CandidateExam.findAll({
        where: { examId: dto.examId },
      });
      let mappedCandidateExams = candidateExams.map((r) => {
        return {
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          isSubmitted: r.isSubmitted,
          isOnline: r.isOnline,
          faceCaptured: r.faceCaptured,
          score: r.score,
          candidateId: r.candidateId,
          examId: r.examId,
          assignedSubjects: r.assignedSubjects,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          timer: r.timer,
        };
      });
      let mappedCandidateIds = candidateExams.map((r) => r.candidateId);
       const candidateSections = await CandidateSection.findAll({where:{candidateId:mappedCandidateIds}});
       let mappedCandidateSections = candidateSections.map((r)=> {
         return {
           id:r.id,
           candidateId:r.candidateId,
           sectionId:r.sectionId,
           createdAt:r.createdAt,
           updatedAt:r.updatedAt,
           timer:r.timer
         }
      })
      let result = {
        centerId: dto.centerId,
        exam: exam.dataValues,
        responses: mappedResponses,
      };
      const userToken = user.token;
      const examDataValues = exam.dataValues;
      const dtoCenterId = dto.centerId;
      
      const syncResponsesUrl = `${this.onlineServer}/exam/sync-responses`;
      const syncProgressUrl = `${this.onlineServer}/exam/sync-progress`;
      const syncGradesUrl = `${this.onlineServer}/exam/sync-grades`;
      const syncCandidateExamUrl = `${this.onlineServer}/exam/sync-candidate-exams`;
      
      const syncResponsesPayload = { ...result };
      const syncProgressPayload = { centerId: dtoCenterId, exam: examDataValues, progresses: mappedProgress };
      const syncGradesPayload = { centerId: dtoCenterId, exam: examDataValues, grades: mappedGrades };
      const syncCandidateExamPayload = {
        centerId: dtoCenterId,
        exam: examDataValues,
        candidateExams: mappedCandidateExams,
        candidateSections: mappedCandidateSections,
      };
      
      const response = await this.sendApiRequest({ url: syncResponsesUrl, payload: syncResponsesPayload, userToken });
      const progressResponse = await this.sendApiRequest({ url: syncProgressUrl, payload: syncProgressPayload, userToken });
      //const progressResponse = await this.sendProgressBatches(examDataValues, dto.centerId, mappedProgress, userToken, syncProgressUrl);
      const gradeResponse = await this.sendApiRequest({ url: syncGradesUrl, payload: syncGradesPayload, userToken });
      const candidateExamResponse = await this.sendApiRequest({ url: syncCandidateExamUrl, payload: syncCandidateExamPayload, userToken });
      console.log("response", response)
      console.log("response", response)
      console.log("progres", progressResponse)
      console.log("grade", gradeResponse)
      console.log("candidateExam", candidateExamResponse)
      const allResponsesSuccessful = [response,progressResponse,gradeResponse, candidateExamResponse].every((data) => data.status === 200);
      
      if (allResponsesSuccessful) {
        const gradeIdsToDelete = grades.map((g) => g.id);
        const progressIdsToDelete = progresses.map((g) => g.id);
        const responseIdsToDelete = responses.map((g) => g.id);
      
        await Promise.all([
          Grade.destroy({ where: { id: gradeIdsToDelete } }),
          CandidateProgress.destroy({ where: { id: progressIdsToDelete } }),
          CandidateResponse.destroy({ where: { id: responseIdsToDelete } }),
          CandidateExam.destroy({ where: { examId: exam.id } }),
        ]);
      
        const sections = await Section.findAll({ where: { examId: exam.id } });
        const sectionIdsToDelete = sections.map((s) => s.id);
        await CandidateSection.destroy({ where: { candidateId: mappedCandidateIds } }),
        await Promise.all([
          Section.destroy({ where: { examId: exam.id } }),
          Exam.destroy({ where: { id: exam.id } }),
          Candidate.destroy({ where: { id:mappedCandidateIds} })
        ]);
      }
      
      return {
        status: 200,
        message: `Responses synced successfully`,
        error: true,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `An Error Occurred: ${e.message}`,
        error: true,
      };
    }
  }
  
  async syncResponses(user, data: SyncExamDto) {
    try {
      const exam = await Exam.findByPk(data.exam.id);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
  
      // Prepare data for bulk operations
      const responsesBulkData = data.responses.map(item => ({
        candidateId: item.candidateId,
        examId: item.examId,
        responses: item.responses,
      }));

  
      // Perform bulk operations
      this.cacheManager.set(`synced-response-${data.exam.id}`, responsesBulkData);
  
      this.processSyncedResponses(data.exam.id); 
  
      return {
        status: 200,
        message: 'responses synced successfully',
        error: false,
      };
    } catch (e) {
      const jsonData = JSON.stringify(data.responses);
      return {
        status: 500,
        message: `An Error occurred: ${e.message}  ${jsonData}`,
        error: true,
      };
    }
  }
 
  //@Cron('* * * * *')
  async processSyncedProgress(examId) {
    try {
      // const exams = await Exam.findAll();
      // for (const exam of exams) {
        const syncedProgress = await this.cacheManager.get(`synced-progress-${examId}`);
        console.log("syncedProgress", syncedProgress);
        if (!syncedProgress) {
          return;
        }
        console.log("saving synced progress");
        const insertedRows = await CandidateProgress.bulkCreate(syncedProgress as any, {
          updateOnDuplicate: ['candidateId', 'examId', 'currentSectionId', 'questionStatus', 'sectionStatus', 'loginAttempts', 'lastLogin']
        });
        console.log("saved synced progress");

        // Delete from cache only if insertion was successful
        if (insertedRows.length > 0) {
          await this.cacheManager.del(`synced-progress-${examId}`);
          console.log("Deleted synced progress from cache");
        }
      //}
    } catch (error) {
      console.error("Error occurred when saving synced progress:", error);
    }
  }
  
  async syncProgress(user, data: SyncProgressDto) {
    try {
      const exam = await Exam.findByPk(data.exam.id);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
  
      const progressesBulkData = data.progresses.map(item => ({
        candidateId: item.candidateId,
        examId: item.examId,
        currentSectionId: item.currentSectionId,
        questionStatus: item.questionStatus,
        sectionStatus: item.sectionStatus,
        loginAttempts: item.loginAttempts,
        networkFailures: item.networkFailures,
        lastLogin: item.lastLogin,
      }));
      this.cacheManager.set(`synced-progress-${data.exam.id}`, progressesBulkData);
  
      // Trigger processSyncedProgress as a background task
      this.processSyncedProgress(data.exam.id); 
  
      return {
        status: 200,
        message: 'Progresses synced successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }
  
  async processSyncedGrades(examId) {
    try {
      // const exams = await Exam.findAll();
      // for (const exam of exams) {
        const syncedGrades = await this.cacheManager.get(`synced-grade-${examId}`);
        console.log("syncedProgress", syncedGrades);
        if (!syncedGrades) {
          return;
        }
        console.log("saving synced grade");
        const insertedRows =  await Grade.bulkCreate(syncedGrades as any, { updateOnDuplicate:  ['candidateId', 'examId', 'nonEssayGrade', 'essayGrade','totalNoOfQuestion','noOfAttemptedQuestions','sectionGrades']});
        console.log("saved synced grade");
        console.log(insertedRows);
        // Delete from cache only if insertion was successful
        if (insertedRows.length > 0) {
          await this.cacheManager.del(`synced-grade-${examId}`);
          console.log("Deleted synced grade from cache");
        }
     // }
    } catch (error) {
      console.error("Error occurred when saving synced grade:", error);
    }
  }

  async processSyncedResponses(examId) {
    try {
     
        const syncedResponses = await this.cacheManager.get(`synced-response-${examId}`);

        if (!syncedResponses) {
          return;
        }

        const insertedRows = await CandidateResponse.bulkCreate(syncedResponses as any, { updateOnDuplicate:  ['candidateId', 'examId','responses' ] });
        console.log("saved synced responses");
        console.log(insertedRows);
        // Delete from cache only if insertion was successful
        if (insertedRows.length > 0) {
          await this.cacheManager.del(`synced-response-${examId}`);
          console.log("Deleted synced response from cache");
        }

    } catch (error) {
      console.error("Error occurred when saving synced response:", error);
    }
  }

  async syncGrades(user, data: SyncGradeDto) {
    try {
      const exam = await Exam.findByPk(data.exam.id);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
  
      const gradesBulkData = data.grades.map(item => ({
        candidateId: item.candidateId,
        examId: item.examId,
        nonEssayGrade: item.nonEssayGrade,
        essayGrade: item.essayGrade,
        totalNoOfQuestion: item.totalNoOfQuestion,
        noOfAttemptedQuestions: item.noOfAttemptedQuestions,
        sectionGrades: item.sectionGrades,
      }));
    
      this.cacheManager.set(`synced-grade-${data.exam.id}`, gradesBulkData);
      this.processSyncedGrades(data.exam.id);
      //await Grade.bulkCreate(gradesBulkData, { updateOnDuplicate:  ['candidateId', 'examId', 'nonEssayGrade', 'essayGrade','totalNoOfQuestion','noOfAttemptedQuestions','sectionGrades']});
  
      return {
        status: 200,
        message: 'grades synced successfully',
        error: false,
      };
    } catch (e) {

      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async processSyncedCandidateExams(examId) {
    try {
      // const exams = await Exam.findAll();
      // for (const exam of exams) {
        const syncedCandidateExams = await this.cacheManager.get(`synced-candidate-exams-${examId}`);
        const syncedCandidateSections = await this.cacheManager.get(`synced-candidate-sections-${examId}`);
        console.log("syncedCandidateExams", syncedCandidateExams);
        if (!syncedCandidateExams || !syncedCandidateSections) {
          return;
        }
        console.log("saving synced candidate exams");
        
       const insertedCandidateExams = await CandidateExam.bulkCreate(syncedCandidateExams as any, { updateOnDuplicate:  [ 'isSubmitted', 'startTime','endTime']});
      
       const insertedCandidateSections = await CandidateSection.bulkCreate(syncedCandidateSections as any, { updateOnDuplicate:  [ 'timer', 'endTime']});
      

        // Delete from cache only if insertion was successful
        if ((insertedCandidateExams.length > 0) && (insertedCandidateSections.length > 0)) {
          await this.cacheManager.del(`synced-candidate-exams-${examId}`);
          await this.cacheManager.del(`synced-candidate-sections-${examId}`);
        }
     // }
    } catch (error) {
      console.log("Error occurred when saving synced candidate-exams:", error);
    }
  }


  async syncCandidateExams(user, data: SyncCandidateExamDto) {
    try {
      const exam = await Exam.findByPk(data.exam.id);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
  
      const candidateExamsBulkData = data.candidateExams.map(item => ({
        ...item,
      }));

      const candidateSectionsBulkData = data.candidateSections.map(item => ({
        ...item,
      }));
    
      await this.cacheManager.set(`synced-candidate-exams-${data.exam.id}`, candidateExamsBulkData);
      
      await this.cacheManager.set(`synced-candidate-sections-${data.exam.id}`, candidateSectionsBulkData);

      // await CandidateExam.bulkCreate(candidateExamsBulkData, { updateOnDuplicate:  [ 'isSubmitted', 'startTime','endTime']});
      
      // await CandidateSection.bulkCreate(candidateSectionsBulkData, { updateOnDuplicate:  [ 'timer', 'endTime']});
        
      await ExamCenter.update(
        {
          isSynced: true,
        },
        { where: { examId: data.exam.id, centerId: data.centerId } },
      );
  
      this.processSyncedCandidateExams(data.exam.id);
      return {
        status: 200,
        message: 'candidate exam and sections synced successfully',
        error: false,
      };
    } catch (e) {

      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }


  // async syncResponses(user, data: SyncExamDto) {
  //   try {
  //     const exam = await Exam.findByPk(data.exam.id);
  //     if (!exam) {
  //       return {
  //         status: 400,
  //         message: 'Invalid exam id',
  //         error: true,
  //       };
  //     }
  
  //     // Prepare data for bulk operations
  //     const prepareBulkData = (items, fields) =>
  //       items.map(item =>
  //         fields.reduce((acc, field) => {
  //           if (item.hasOwnProperty(field)) acc[field] = item[field];
  //           return acc;
  //         }, {})
  //       );
  
  //     const responsesBulkData = prepareBulkData(data.responses, [
  //       'candidateId',
  //       'examId',
  //       'responses',
  //     ]);
  //     const gradesBulkData = prepareBulkData(data.grades, [
  //       'candidateId',
  //       'examId',
  //       'nonEssayGrade',
  //       'essayGrade',
  //       'totalNoOfQuestion',
  //       'noOfAttemptedQuestions',
  //       'sectionGrades',
  //     ]);
  //     const progressesBulkData = prepareBulkData(data.progresses, [
  //       'candidateId',
  //       'examId',
  //       'currentSectionId',
  //       'questionStatus',
  //       'sectionStatus',
  //       'loginAttempts',
  //       'networkFailures',
  //       'lastLogin',
  //     ]);
  //     const candidateExamsBulkData = data.candidateExams.map(item => ({ ...item }));
  
  //     // Perform bulk operations in batches
  //     const batchSize = 100; // Adjust batch size as needed
  
  //     // Define bulk create operations outside the loop
  //     const bulkCreateOperations = [
  //       CandidateResponse.bulkCreate(responsesBulkData, { updateOnDuplicate: ['candidateId', 'examId'] }),
  //       Grade.bulkCreate(gradesBulkData, { updateOnDuplicate: ['candidateId', 'examId'] }),
  //       CandidateProgress.bulkCreate(progressesBulkData, { updateOnDuplicate: ['candidateId', 'examId'] }),
  //       CandidateExam.bulkCreate(candidateExamsBulkData, { updateOnDuplicate: ['candidateId', 'examId'] }),
  //     ];
  
  //     for (const bulkOperation of bulkCreateOperations) {
  //       const totalItems = (await bulkOperation).length;
  //       for (let i = 0; i < totalItems; i += batchSize) {
  //         const batchSlice = (await bulkOperation).slice(i, i + batchSize);
  //         await Promise.all(batchSlice);
  //       }
  //     }
  
  //     await ExamCenter.update(
  //       { isSynced: true },
  //       { where: { examId: data.exam.id, centerId: data.centerId } }
  //     );
  
  //     return {
  //       status: 200,
  //       message: 'Responses synced successfully',
  //       error: false,
  //     };
  //   } catch (e) {
  //     const jsonData = JSON.stringify(data.responses);
  //     return {
  //       status: 500,
  //       message: `An error occurred: ${e.message} ${jsonData}`,
  //       error: true,
  //     };
  //   }
  // }
  
  
  
  async addCenter(addCenterDto: AddCenterDto): Promise<ApiResponse> {
    try {
      let center = await Center.findOne({ where: { name: addCenterDto.name } });

      if (!center) {
        center = await Center.create({
          name: addCenterDto.name,
          location: addCenterDto.location,
        });
      }

      return {
        status: 200,
        message: 'Exam center added successfully',
        data: {
          ...center.dataValues,
        },
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async setOverallTimer(
    setOverallTimerDto: SetOverallTimerDto,
  ): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(setOverallTimerDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'exam with this id does not exist',
          error: true,
        };
      }
      if (!exam.setOverallTimer) {
        return {
          status: 400,
          message: 'Timer was not enabled for this exam while setting up',
          error: true,
        };
      }

      const date1 = moment(exam.startTime, 'YYYY-MM-DD HH:mm:ss');
      const date2 = moment(exam.endTime, 'YYYY-MM-DD HH:mm:ss');

      // Calculate the time difference
      const timeDifference = moment.duration(date2.diff(date1));
      const limitDuration = moment.duration(exam.timeLimit);
      const isTimeLessThanLimit =
        timeDifference.asMilliseconds() <= limitDuration.asMilliseconds();
      if (isTimeLessThanLimit) {
        return {
          status: 400,
          message: 'Time limit cannot be greater than the exam period',
          error: true,
        };
      }

      await Exam.update(
        {
          timeLimit: setOverallTimerDto.time,
        },
        { where: { id: setOverallTimerDto.examId } },
      );

      return {
        status: 200,
        message: 'Timer set successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async setSectionTimer(setSectionTimerDto: SetSectionTimerDto) {
    try {
      const sect = await Section.findOne({
        where: { id: setSectionTimerDto.sectionId },
        include: { model: Exam },
      });

      if (!sect) {
        return {
          status: 400,
          message: 'Section with this id does not exist',
          error: true,
        };
      }
      if (!sect.exam.setSectionTimer) {
        return {
          status: 400,
          message:
            'Timer was not enabled for sections while setting up the exam',
          error: true,
        };
      }
      const overallTime = moment.duration(sect.exam.dataValues.timeLimit);
      const newSectionTimer = moment.duration(setSectionTimerDto.time);

      if (newSectionTimer.asSeconds() > overallTime.asSeconds()) {
        return {
          status: 400,
          message:
            'You cannot allocate more than the overall time scheduled for the exam',
          error: true,
        };
      }

      const allSections = await Section.findAll({
        where: { examId: sect.exam.id },
      });

      let timeAlloted = moment.duration(0);

      allSections.forEach((section) => {
        if (section.timeLimit) {
          const sectionTime = moment.duration(section.timeLimit);
          timeAlloted.add(sectionTime);
        }
      });

      if (timeAlloted.asSeconds() > overallTime.asSeconds()) {
        return {
          status: 400,
          message:
            'You cannot allocate more than the overall time scheduled for the exam',
          error: true,
        };
      }

      await Section.update(
        { timeLimit: setSectionTimerDto.time },
        { where: { id: setSectionTimerDto.sectionId } },
      );

      return {
        status: 200,
        message: 'Timer set successfully',
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async getExamCenters(examId: string) {
    try {
      const exam = await Exam.findOne({
        where: { id: examId },
        include: [{ model: Section }, { model: Center }],
      });
      if (!exam) {
        return {
          status: 400,
          message: ' Exam with this id not found',
          error: true,
        };
      }
      return {
        status: 200,
        message: 'exam centers retrieved successfully',
        data: exam.centers,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }


   
  //  async startExam(
  //   startExamDto: StartExamDto,
  //   client: Socket,
  // ): Promise<ApiResponse> {
  //   try {
  //     // Find the candidate's exam
  //     const candidateExam = await CandidateExam.findOne({
  //       where: {
  //         candidateId: startExamDto.candidateId,
  //         examId: startExamDto.examId,
  //       },
  //     });

  //     if (!candidateExam) {
  //       return {
  //         status: 400,
  //         message: 'Candidate has not been registered for this exam',
  //         error: true,
  //       };
  //     }

  //     if (candidateExam && candidateExam.isSubmitted) {
  //       return {
  //         status: 400,
  //         message: 'Exam has already been submitted',
  //         error: true,
  //       };
  //     }
  //     if(candidateExam && !(candidateExam.isSubmitted) &&(candidateExam.endTime)){
  //       const endTime = new Date(candidateExam.endTime).getTime();
  //       const currentTime = new Date().getTime();
  //       if(currentTime > endTime){
  //         await CandidateExam.update({isSubmitted: true}, {where:{examId:candidateExam.examId, candidateId:candidateExam.candidateId}});
  //       }
  //     }

  //     const exam = await Exam.findOne({
  //       where: { id: startExamDto.examId },
  //       include: {
  //         model: Section,
  //         where: { id: startExamDto.sectionId },
  //         include: [
  //           {
  //             model: Item,
  //             include: [
  //               {
  //                 model: Question,
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     });
  //     const today = moment().utc();

  //     if (
  //       exam &&
  //       (today.isBefore(moment(exam.startTime).utc()) ||
  //         today.isAfter(moment(exam.endTime).utc()))
  //     ) {
  //       return {
  //         status: 400,
  //         message:
  //           'You cannot take exam before the start date or after the end date',
  //         error: true,
  //       };
  //     }

  //     // Update the candidate's exam with the start time
  //     // const startTime = new Date().toISOString();
  //     // await CandidateExam.update(
  //     //   { startTime: startTime },
  //     //   { where: { id: candidateExam.id } },
  //     // );
  //     console.log(exam);
  //     await this.initializeCandidateProgress(
  //       startExamDto.candidateId,
  //       startExamDto.sectionId,
  //       exam,
  //       client,
  //     );
  //     // const questions = exam.sections[0]?.items[0]?.questions|| [];

  //     if (exam && exam.setOverallTimer && exam.timeLimit != null) {
  //       let candidateExam = await CandidateExam.findOne({
  //         where: {
  //           candidateId: startExamDto.candidateId,
  //           examId: startExamDto.examId,
  //         },
  //       });
  //       let overallTimer =
  //         candidateExam && candidateExam.timer
  //           ? candidateExam.timer
  //           : exam.timeLimit;
  //       const overallTime = await this.convertTimeToMilliseconds(overallTimer);
  //      await this.startExamTimer(startExamDto, overallTimer);
  //     }
  //     const section = await Section.findByPk(startExamDto.sectionId);

  //     if (section && exam.setSectionTimer && section.timeLimit) {
  //       let candidateSection = await CandidateSection.findOne({
  //         where: {
  //           candidateId: startExamDto.candidateId,
  //           sectionId: startExamDto.sectionId,
  //         },
  //       });
  //       let sectionTimer =
  //         candidateSection && candidateSection.timer
  //           ? candidateSection.timer
  //           : section.timeLimit;
  //       const sectionTime = await this.convertTimeToMilliseconds(sectionTimer);
  //       await this.startSectionTimer(
  //         startExamDto.sectionId,
  //         startExamDto.candidateId,
  //         sectionTime,
  //         exam.id,
  //         client,
  //       );
  //     }

  //     let progress = await this.getCandidateProgress(
  //       startExamDto.candidateId,
  //       exam.id,
  //     );

  //     let sectionCompleted = progress.sectionStatus.find(
  //       (s) => s.sectionId == progress.currentSectionId && s.completed == true,
  //     );
  //     let currentSectionId = progress.currentSectionId;
  //     if (sectionCompleted) {
  //       let index = progress.sectionStatus.findIndex(
  //         (s) => s.sectionId == progress.currentSectionId,
  //       );
  //       let nextSection = progress.sectionStatus[index + 1];
  //       if (nextSection) {
  //         currentSectionId = nextSection.sectionId;
  //       }
  //     }

  //     // let unAttemptedQuestionsInSection = progress.questionStatus.filter((p) => (p.sectionId == currentSectionId) && (p.attempted === false));

  //     let unAttemptedQuestionsInSection = progress.questionStatus.filter(
  //       (p) => p.sectionId == startExamDto.sectionId,
  //     );
  //     let totalQuestionInSection = progress.questionStatus.filter(
  //       (q) => q.sectionId == startExamDto.sectionId,
  //     );
  //     let attemptedQuestionsInSection = progress.questionStatus.filter(
  //       (p) => p.sectionId == startExamDto.sectionId && p.attempted == true,
  //     );

  //     let lastServed = progress.questionStatus.filter((q) => q.current == true);
  //     if (lastServed.length > 0) {
  //       unAttemptedQuestionsInSection = lastServed;
  //     } else if (attemptedQuestionsInSection.length > 0) {
  //       unAttemptedQuestionsInSection = progress.questionStatus.filter(
  //         (p) => p.sectionId == startExamDto.sectionId,
  //       );
  //     }
  //     await this.setCurrent(startExamDto.examId, startExamDto.candidateId, progress, unAttemptedQuestionsInSection[0]);
  //     let responseData = {
  //       questionNum: unAttemptedQuestionsInSection[0]
  //         ? unAttemptedQuestionsInSection[0].questionNum
  //         : 0,
  //       question: unAttemptedQuestionsInSection[0]
  //         ? unAttemptedQuestionsInSection[0].question
  //         : null,
  //       currentSectionId:unAttemptedQuestionsInSection[0]?unAttemptedQuestionsInSection[0].sectionId:startExamDto.sectionId,
  //       questionsLeftInSection: unAttemptedQuestionsInSection.length - 1,
  //       totalQuestionsInSection: totalQuestionInSection.length,
  //       sectionSubmitted: sectionCompleted ? true : false,
  //       questionSubmitted: unAttemptedQuestionsInSection[0]
  //         ? unAttemptedQuestionsInSection[0].attempted
  //         : true,
  //       firstExamQuestion: unAttemptedQuestionsInSection[0]
  //         ? unAttemptedQuestionsInSection[0].firstExamQuestion
  //         : false,
  //       lastExamQuestion: unAttemptedQuestionsInSection[0]
  //         ? unAttemptedQuestionsInSection[0].lastExamQuestion
  //         : false,
  //       answer: unAttemptedQuestionsInSection[0]
  //         ? unAttemptedQuestionsInSection[0].response
  //         : null,
  //     };

  //     const remainingExamTime = await this.getExamRemainingTime(
  //       startExamDto.candidateId,
  //       startExamDto.examId,
  //     );
  //     // const remainingSectionTime = await this.getSectionRemainingTime(
  //     //   startExamDto.candidateId,
  //     //   responseData.currentSectionId,
  //     // );

  //     const remainingSectionTime = await this.getSectionRemainingTime(
  //       startExamDto.candidateId,
  //       responseData.currentSectionId,
  //       startExamDto.examId
  //     );
  //     let data = {
  //       responseData,
  //       remainingExamTime,
  //       remainingSectionTime,
  //     };

  //     return {
  //       status: 200,
  //       message: 'Exam started successfully',
  //       data: data,
  //       error: false,
  //     };
  //     // this.examGateway.server.to(client.id).emit('question', response);
  //     // this.examGateway.server.to(client.id).emit('remaining-exam-time', remainingTime);
  //   } catch (error) {
  //     console.log(error);
  //     console.error('Error while starting the exam:', error);
  //     return {
  //       status: 500,
  //       message: `Internal server error: ${error.message}`,
  //       error: true,
  //     };
  //   }
  // }


  async startExam(startExamDto: StartExamDto, client: Socket): Promise<ApiResponse> {
    try {
      const candidateExam = await CandidateExam.findOne({
        where: {
          candidateId: startExamDto.candidateId,
          examId: startExamDto.examId,
        },
      });
  
      if (!candidateExam) {
        return { status: 400, message: 'Candidate not registered for this exam', error: true };
      }
  
      if (candidateExam.isSubmitted) {
        return { status: 400, message: 'Exam already submitted', error: true };
      }
  
      if (!candidateExam.isSubmitted && candidateExam.endTime) {
        const endTime = new Date(candidateExam.endTime).getTime();
        const currentTime = new Date().getTime();
        if (currentTime > endTime) {
          await CandidateExam.update({ isSubmitted: true }, {
            where: { examId: candidateExam.examId, candidateId: candidateExam.candidateId }
          });
        }
      }
  
      const exam = await Exam.findOne({
        where: { id: startExamDto.examId },
      });
  
      const now = moment.utc();
      const examStartTime = moment(exam.startTime).utc();
      const examEndTime = moment(exam.endTime).utc();
      
      if (now.isBefore(examStartTime) || now.isAfter(examEndTime)) {
        return {
          status: 400,
          message: 'Exam can only be taken during the scheduled time',
          error: true,
        };
      }
  
      if (exam.setOverallTimer && exam.timeLimit != null) {
        const overallTimer = candidateExam?.timer || exam.timeLimit;
        await this.convertTimeToMilliseconds(overallTimer);
        await this.startExamTimer(startExamDto, overallTimer);
      }
  
      const section = await Section.findByPk(startExamDto.sectionId);
  
      if (exam.setSectionTimer && section?.timeLimit!=null) {
        const candidateSection = await CandidateSection.findOne({
          where: { candidateId: startExamDto.candidateId, sectionId: startExamDto.sectionId },
        });
        let sectionTimer = candidateSection?.timer || section.timeLimit;
    
        const sectionTime = await this.convertTimeToMilliseconds(sectionTimer);
        console.log("sectionTime",sectionTime);
        await CandidateExam.update({ startTime:examStartTime}, {
          where: { examId: candidateExam.examId, candidateId: candidateExam.candidateId }
        });
        await this.startSectionTimer(
          startExamDto.sectionId,
          startExamDto.candidateId,
          sectionTime,
          exam.id,
          client,
        );
      }
  
      const remainingExamTime = await this.getExamRemainingTime(
        startExamDto.candidateId,
        startExamDto.examId,
      );
  
      const remainingSectionTime = await this.getSectionRemainingTime(
        startExamDto.candidateId,
        startExamDto.sectionId,
        startExamDto.examId,
      );
  
      const data = { remainingExamTime, remainingSectionTime };
  
      return { status: 200, message: 'Exam started successfully', data, error: false };
    } catch (error) {
      console.log(error);
      return { status: 500, message: `Internal server error: ${error.message}`, error: true };
    }
  }
  

  
 
  
  
  constructResponseData(progress: CandidateProgress, currentSectionId: string): any {
    const unAttemptedQuestionsInSection = progress.questionStatus.filter(p => p.sectionId === currentSectionId && !p.attempted);
    const totalQuestionInSection = progress.questionStatus.filter(q => q.sectionId === currentSectionId);
    const sectionCompleted = progress.sectionStatus.find(s => s.sectionId === currentSectionId && s.completed);

    return {
      questionNum: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].questionNum : 0,
      question: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].question : null,
      currentSectionId: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].sectionId : currentSectionId,
      questionsLeftInSection: unAttemptedQuestionsInSection.length - 1,
      totalQuestionsInSection: totalQuestionInSection.length,
      sectionSubmitted: !!sectionCompleted,
      questionSubmitted: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].attempted : true,
      firstExamQuestion: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].firstExamQuestion : false,
      lastExamQuestion: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].lastExamQuestion : false,
      answer: unAttemptedQuestionsInSection.length > 0 ? unAttemptedQuestionsInSection[0].response : null,
    };
  }

  
  async setCurrent(examId, candidateId, progress, currentQuestion) {
    if (currentQuestion) {
      progress.questionStatus.forEach((q) => (q.current = false));
      let questionIndex = progress.questionStatus.findIndex(
        (q) => q.question.id == currentQuestion.question.id
      );
      progress.questionStatus[questionIndex].current = true;
  
      await CandidateProgress.update(
        {
          questionStatus: progress.questionStatus,
        },
        {
          where: {
            examId: examId,
            candidateId: candidateId,
          },
        }
      );
    }
  }
  


  async restartExams(
    currentUser,
    restartExams: RestartExamAllDto,
  ): Promise<ApiResponse> {
    try {
      const { examId, candidateIds } = restartExams;
      const exam = await Exam.findByPk(restartExams.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam Id',
          error: true,
        };
      }
      // Check if candidateIds is an array
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return {
          status: 400,
          message: 'Invalid candidate IDs provided',
          error: true,
        };
      }

      // Iterate through each candidate ID
      for (const candidateId of candidateIds) {
        const candidateExam = await CandidateExam.findOne({
          where: { candidateId, examId },
        });

        if (!candidateExam) {
          console.warn(
            `Invalid Exam or Candidate Id for Candidate ID: ${candidateId}`,
          );
          continue;
        }

        // Reset the candidate's exam
        await CandidateExam.update(
          { startTime: null,endTime:null, isSubmitted: false },
          { where: { id: candidateExam.id } },
        );

        const savedProgress = await this.getCandidateProgress(
          candidateId,
          restartExams.examId,
        );
        let firstSection;
        if (savedProgress) {
          firstSection = savedProgress.sectionStatus[0].sectionId;
        }

        // Remove exam responses
        const examResponses = await CandidateResponse.findOne({
          where: { candidateId, examId },
        });

        if (examResponses) {
          await CandidateResponse.destroy({
            where: { candidateId, examId }
          })
        }
        await this.cacheManager.del(`examTimer:${candidateId}-${examId}`);
        // const examTimerRef = await this.cacheManager.get(
        //   `examTimeoutRef:${candidateId}-${examId}`,
        // );
        // console.log("timer", examTimerRef);
        // if (examTimerRef) {
        //   console.log("timer cleared")
        //   await clearTimeout(Number(examTimerRef));
        //   await this.cacheManager.del(
        //     `examTimeoutRef:${candidateId}-${examId}`,
        //   );
        // }

        await this.cacheManager.set(`examRestarted:${candidateId}-${examId}`, true, 0);
        let candProgress = await CandidateProgress.findOne({
          where: { examId: examId, candidateId: candidateId }
        });
        if (candProgress && exam.setSectionTimer === true && candProgress.sectionStatus.length > 0) {
          for (const sect of candProgress.sectionStatus) {
            const existingSection = await CandidateSection.findOne({
              where: { sectionId: sect.sectionId, candidateId }
            });
        
            if (existingSection) {
              await CandidateSection.update({ endTime: null }, {
                where: { sectionId: sect.sectionId, candidateId }
              });
            }
          }
        
          await CandidateProgress.destroy({
            where: { examId, candidateId }
          });
        } else if (candProgress && exam.setSectionTimer === false) {
          await CandidateProgress.destroy({
            where: { candidateId, examId }
          });
        }
        
       
      
        this.emitToClient(`${candidateId}_${examId}`, 'exam-restarted', {
          message: 'Exam restarted',
        });
      }
      await AuditLog.create({
        action: `Restarted Exam: ${examId} `,
        userId: currentUser.sub,
      });
      return {
        status: 200,
        message: 'Exams restarted successfully for the specified candidates.',
        error: false,
      };
    } catch (e) {
      console.error('Error while restarting exams:', e);
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async logOutCandidates(currentUser, logOutDto: LogOutCandidateDto) {
    try {
      const exam = await this.findExamById(logOutDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      for (let id of logOutDto.candidateIds) {
        await CandidateExam.update({
          isSubmitted:true,
          isLoggedIn:false
         },{where:{candidateId:id, examId:logOutDto.examId}});

        this.emitToClient(`${id}_${logOutDto.examId}`, 'logged-out', {
          message: 'Logged Out',
        });
      }

      // Process non-participating candidates with zero scores
      await this.processNonParticipatingCandidates(logOutDto.examId);

      await AuditLog.create({
        action: `Logged out candidates in exam:${logOutDto.examId}`,
        userId: currentUser.sub,
      });

      return {
        status: 200,
        message: 'Candidates have been logged out',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async logOutAllCandidates(currentUser, examId: string) {
    try {
      const exam = await this.findExamById(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      const candidates = await CandidateExam.findAll({
        where: { examId: examId },
      });
      for (let person of candidates) {
         await CandidateExam.update({
          isSubmitted:true,
          isLoggedIn:false
         },{where:{candidateId:person.candidateId, examId:examId}})

        this.emitToClient(`${person.candidateId}_${examId}`, 'logged-out', {
          message: 'Logged Out',
        });
      }

      // Process non-participating candidates with zero scores
      await this.processNonParticipatingCandidates(examId);

      await AuditLog.create({
        action: `Logged out candidates in exam:${examId}`,
        userId: currentUser.sub,
      });
      return {
        status: 200,
        message: 'Candidates have been logged out',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async restartExamsForAll(currentUser, examId: string): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      const candidates = await CandidateExam.findAll({
        where: { examId: examId }
      });

      // Iterate through each candidate ID
      for (const person of candidates) {
        // Reset the candidate's exam
        await CandidateExam.update(
          { startTime: null,endTime:null, isSubmitted: false },
          { where: { id: person.id } },
        );

        // Remove cached progress (if any)
        const cachedProgress = await this.getCandidateProgress(
          person.candidateId,
          examId,
        );
        if (cachedProgress) {
          await this.cacheManager.del(person.candidateId);
        }

        const savedProgress = await CandidateProgress.findOne({
          where: { candidateId: person.candidateId, examId: person.examId }
        });
        
        if (savedProgress) {
          const { candidateId, examId } = person;
        
          if (exam.setSectionTimer === true && savedProgress.sectionStatus.length > 0) {
            for (const sect of savedProgress.sectionStatus) {
              const existingSection = await CandidateSection.findOne({
                where: { sectionId: sect.sectionId, candidateId }
              });
        
              if (existingSection) {
                await CandidateSection.update({ endTime: null }, {
                  where: { sectionId: sect.sectionId, candidateId }
                });
              }
            }
          }
        
          await CandidateProgress.destroy({
            where: { candidateId, examId }
          });
        }
        
      

        // Remove exam responses
        const examResponses = await CandidateResponse.findOne({
          where: { candidateId: person.candidateId, examId: person.examId },
        });

        if (examResponses) {
          await CandidateResponse.destroy({
          where: { candidateId: person.candidateId, examId: person.examId },
        });
        }
        await this.cacheManager.del(
          `examTimer:${person.candidateId}-${examId}`,
        );
       
   
        await this.cacheManager.set(`examRestarted:${person.candidateId}-${examId}`, true, 0);
        
        this.emitToClient(`${person.candidateId}_${examId}`, 'exam-restarted', {
          message: 'Exam restarted',
        });
      }
      // await AuditLog.create({
      //   action: `Restarted Exam for all candidates in exam:${examId}`,
      //   userId:currentUser.sub
      // });
      return {
        status: 200,
        message: 'Exams restarted successfully for all candidates.',
        error: false,
      };
    } catch (e) {
      console.error('Error while restarting exams:', e);
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async increaseExamTiming(currentUser, timingDto: IncreaseTimeDto) {
    try {
      const exam = await Exam.findByPk(timingDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Exam not found',
          error: true,
        };
      }
      let candidateIds = timingDto.candidateIds;
      if (candidateIds.length === 0) {
        const candidateExams = await CandidateExam.findAll({
          where: { examId: timingDto.examId },
        });
        candidateIds = candidateExams.map((item) => item.candidateId);
      }
      for (let id of candidateIds) {
        let candidate = await CandidateExam.findOne({
          where: { candidateId: id, examId: timingDto.examId },
        });
        if (!candidate) {
          return {
            status: 400,
            message: `candidate:${id} not found in this exam`,
            error: true,
          };
        }
        const time = await this.convertTimeToMilliseconds(timingDto.time);
        await this.extendExamTimer(timingDto.examId, id, time);

        await CandidateExam.update(
          {
            timer: timingDto.time,
          },
          { where: { examId: timingDto.examId, candidateId: id } },
        );
      }
      await AuditLog.create({
        action: `Extended time for exam: ${timingDto.examId}`,
        userId: currentUser.sub,
      });
      return {
        status: 200,
        message: 'Exam time has successfully been increased',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An error occurred:${e.message}`,
        error: true,
      };
    }
  }

  async extendSectionTimer(examId, candidateId, sectionId, sectionTime) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Exam not found',
          error: true,
        };
      }
      const section = await Section.findByPk(sectionId);
      if (!section) {
        return {
          status: 400,
          message: 'Section not found',
          error: true,
        };
      }
      let candidateSection = await CandidateSection.findOne({
        where: { candidateId: candidateId, sectionId: sectionId },
      });
      
       const remainingTime = await this.getSectionRemainingTime(
        candidateId,
        sectionId,
        examId
       );

      let overallTimer =
        candidateSection && candidateSection.timer
          ? candidateSection.timer
          : section.timeLimit;

      const examTime = await this.convertTimeToMilliseconds(overallTimer);
      const remainingTimeInMillisecs = await this.convertTimeToMilliseconds(
        remainingTime.data.remainingTime,
      );
      let sectionTimeExtensionInMilliseconds =
        await this.convertTimeToMilliseconds(sectionTime);
      const spentTime = examTime - remainingTimeInMillisecs;

      let newEndTime = sectionTimeExtensionInMilliseconds - spentTime;

      if (newEndTime > 0) {
   
        const progress = await this.getCandidateProgress(candidateId, examId);
        const candidateSection = await CandidateSection.findOne({where:{sectionId,candidateId}});
      
        if(candidateSection && candidateSection.endTime){
          // const sectionIndex = progress.sectionStatus.findIndex(
          //   (s) => s.sectionId === sectionId,
          // );
        
          // if( (progress.sectionStatus[sectionIndex].startTime!=='') && (progress.sectionStatus[sectionIndex].endTime!=='')){
          //   let currentTime = new Date().toISOString();
          //   let endTime = new Date(new Date(currentTime).getTime() + newEndTime).toISOString();
          //   progress.sectionStatus[sectionIndex].endTime = endTime;

          //   await CandidateProgress.update(
          //     {
          //       sectionStatus: progress.sectionStatus,
          //     },
          //     { where: { candidateId: candidateId, examId: examId } },
          //   );
          // }
        
            let currentTime = new Date().toISOString();
            let endTime = new Date(new Date(currentTime).getTime() + newEndTime).toISOString();
            
            await candidateSection.update(
              {
                endTime: endTime
              },
              { where: { candidateId: candidateId, sectionId: sectionId } }
            );
        }
       
    
        let timeLeft = await this.getSectionRemainingTime(
          candidateId,
          sectionId,
          examId
        );
        this.emitToClient(
          `${candidateId}_${examId}`,
          'remaining-section-time',
          timeLeft,
        );
      } else {
        this.emitToClient(
          `${candidateId}_${examId}`,
          'remaining-section-time',
          {
            status: 200,
            message: 'Section time extended',
            data: { remainingTime: '00:00:00' },
            error: false,
          },
        );
      }

      console.log(
        `Extended section timer for candidate: ${candidateId} until ${new Date(
          newEndTime,
        )}`,
      );
    } catch (error) {
      console.error(`Error in extendSectionTimer: ${error}`);
      throw error;
    }
  }

  async increaseSectionTimingExam(
    currentUser,
    timingDto: IncreaseSectionTimingDto,
  ) {
    try {
      const exam = await Exam.findByPk(timingDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Exam not found',
          error: true,
        };
      }

      let candidateIds = timingDto.candidateIds;
      if (candidateIds.length === 0) {
        const candidateExams = await CandidateExam.findAll({
          where: { examId: timingDto.examId },
        });
        candidateIds = candidateExams.map((item) => item.candidateId);
      }
      for (let id of candidateIds) {
        let candidate = await CandidateExam.findOne({
          where: { candidateId: id, examId: timingDto.examId },
        });
        if (!candidate) {
          return {
            status: 400,
            message: `candidate:${id} not found in this exam`,
            error: true,
          };
        }

        for (let s of timingDto.sectionTimers) {
          //const time = await this.convertTimeToMilliseconds(timingDto.time);
          let candidateSection = await CandidateSection.findOne({
            where: { candidateId: id, sectionId: s.sectionId },
          });
          await this.extendSectionTimer(
            timingDto.examId,
            id,
            s.sectionId,
            s.time,
          );

          if (candidateSection) {
            await CandidateSection.update(
              {
                timer: s.time,
              },
              { where: { sectionId: s.sectionId, candidateId: id } },
            );
          } else {
            await CandidateSection.create({
              timer: s.time,
              sectionId: s.sectionId,
              candidateId: id,
            });
          }
        }
      }
      return {
        status: 200,
        message: 'Time extended successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An error occurred:${e.message}`,
        error: true,
      };
    }
  }

  // async submitResponse(
  //   submitResponse: SubmitResponseDto,
  //   client,
  // ): Promise<ApiResponse> {
  //   try {
  //     const exam = await Exam.findByPk(submitResponse.examId);
  //     const question = await Question.findByPk(submitResponse.questionId);
  //     const candidateExam = await CandidateExam.findOne({
  //       where: {
  //         candidateId: submitResponse.candidateId,
  //         examId: submitResponse.examId,
  //       },
  //     });
  //     const section = await Section.findByPk(submitResponse.sectionId);

  //     if (!question || !candidateExam || !section) {
  //       return {
  //         status: 400,
  //         message: 'Invalid question, ExamId, or SectionId',
  //         error: true,
  //       };
  //     }

  //     // Retrieve candidate progress
  //     const candidateProgress = await CandidateProgress.findOne({
  //       where: {
  //         examId: submitResponse.examId,
  //         candidateId: submitResponse.candidateId,
  //       },
  //     });
  //     console.log('progress saved', candidateProgress);
  //     // Check if the section is completed
  //     const sectionStatus = candidateProgress.sectionStatus.find(
  //       (status) => status.sectionId === submitResponse.sectionId,
  //     );

  //     if (sectionStatus && !sectionStatus.startTime) {
  //       const sectionStatusIndex = candidateProgress.sectionStatus.findIndex(
  //         (status) => status.sectionId === submitResponse.sectionId,
  //       );
  //       candidateProgress.sectionStatus[sectionStatusIndex].startTime =
  //         new Date().toISOString();
  //       await CandidateProgress.update(
  //         {
  //           sectionStatus: candidateProgress.sectionStatus,
  //         },
  //         {
  //           where: {
  //             candidateId: candidateProgress.candidateId,
  //             examId: candidateProgress.examId,
  //           },
  //         },
  //       );
  //     }

  //     let currentSectionId = candidateProgress.currentSectionId;
  //     // if (exam.setSectionTimer && sectionStatus && sectionStatus.completed) {
  //     //   return {
  //     //     status: 400,
  //     //     message: "This section has been completed already",
  //     //     data: {
  //     //       currentSectionId:currentSectionId
  //     //     },
  //     //     error: true,
  //     //   };
  //     // }

  //     // if(sectionStatus.completed == true){
  //     //   let index = candidateProgress.sectionStatus.findIndex((s) => s.sectionId == candidateProgress.currentSectionId);
  //     //   let nextSection = candidateProgress.sectionStatus[index+1];
  //     //   if(nextSection){
  //     //     currentSectionId = nextSection.sectionId
  //     //   }
  //     // }

  //     // if (candidateProgress && candidateProgress.currentSectionId !== submitResponse.sectionId) {
  //     //   return {
  //     //     status: 400,
  //     //     message: "you cannot submit response for another section until the current section is completed",
  //     //     error: true,
  //     //   };
  //     // }

  //     // Check if the candidate has submitted a response for this question
  //     const existingResponseIndex = candidateProgress.questionStatus.findIndex(
  //       (status) =>
  //         status.question.id === submitResponse.questionId &&
  //         status.attempted === true,
  //     );

  //     // let existingSectionTime = await this.getSectionRemainingTime(
  //     //   submitResponse.candidateId,
  //     //   submitResponse.sectionId,
  //     // );

  //      let existingSectionTime = await this.getSectionRemainingTime(
  //       submitResponse.candidateId,
  //       submitResponse.sectionId,
  //       submitResponse.examId
  //     );
      
      
  //     // If the candidate has submitted a response, update it
  //     console.log(existingResponseIndex);
  //     if (existingResponseIndex !== -1) {
  //       if (
  //         exam.setSectionTimer &&
  //         existingSectionTime &&
  //         existingSectionTime.data.remainingSectionTime === '00:00:00'
  //       ) {
  //         let sectionStatusIndex = candidateProgress.sectionStatus.findIndex(
  //           (s) => s.sectionId === sectionStatus.sectionId,
  //         );
  //         candidateProgress.sectionStatus[sectionStatusIndex].completed = true;
  //         candidateProgress.sectionStatus[sectionStatusIndex].endTime =
  //           moment().format('YYYY-MM-DD HH:mm:ss');
  //       }
  //       candidateProgress.questionStatus[existingResponseIndex].response =
  //         submitResponse.answer;
  //       candidateProgress.questionStatus[existingResponseIndex].attempted =
  //         true;
  //       candidateProgress.questionStatus[existingResponseIndex].current = false;
      

  //       let sectionQuestions = candidateProgress.questionStatus.filter(
  //         (s) => s.sectionId == candidateProgress.currentSectionId,
  //       );
  //       let sectionAttemptedQuestions = candidateProgress.questionStatus.filter(
  //         (s) =>
  //           s.sectionId == candidateProgress.currentSectionId &&
  //           s.attempted == true,
  //       );
  //       if (sectionQuestions.length === sectionAttemptedQuestions.length) {
  //         let sectionCompletedIndex = candidateProgress.sectionStatus.findIndex(
  //           (s) => s.sectionId == candidateProgress.currentSectionId,
  //         );
  //         candidateProgress.sectionStatus[sectionCompletedIndex].completed =
  //           true;
  //         candidateProgress.sectionStatus[sectionCompletedIndex].endTime =
  //           moment().format('YYYY-MM-DD HH:mm:ss');
  //       }

  //       await CandidateProgress.update(
  //         {
  //           currentSectionId: candidateProgress.currentSectionId,
  //           sectionStatus: candidateProgress.sectionStatus,
  //           questionStatus: candidateProgress.questionStatus,
  //         },
  //         {
  //           where: {
  //             examId: submitResponse.examId,
  //             candidateId: submitResponse.candidateId,
  //           },
  //         },
  //       );

  //       let progress = await this.getCandidateProgress(
  //         submitResponse.candidateId,
  //         submitResponse.examId,
  //       );
  //       let questionSubmitted = progress.questionStatus.filter(
  //         (q) =>
  //           q.questionId == submitResponse.questionId &&
  //           q.attempted == true &&
  //           q.sectionId == submitResponse.sectionId,
  //       );
  //       let questionNum = questionSubmitted.questionNum;

  //       if (questionSubmitted) {
  //         questionNum = Number(questionNum) + 1;
  //       }
  //       console.log(questionNum);

  //       let sectionCompleted = progress.sectionStatus.find(
  //         (s) =>
  //           s.sectionId == progress.currentSectionId && s.completed == true,
  //       );
  //       let currentSectionId = progress.currentSectionId;
  //       if (sectionCompleted) {
  //         let index = progress.sectionStatus.findIndex(
  //           (s) => s.sectionId == progress.currentSectionId,
  //         );
  //         let nextSection = progress.sectionStatus[index + 1];
  //         if (nextSection) {
  //           currentSectionId = nextSection.sectionId;
  //           const anotherSection = await Section.findByPk(currentSectionId);
  //           if (exam.setSectionTimer && anotherSection.timeLimit) {
  //             let candidateSection = await CandidateSection.findOne({
  //               where: {
  //                 candidateId: submitResponse.candidateId,
  //                 sectionId: anotherSection.id,
  //               },
  //             });
  //             let sectionTimer =
  //               candidateSection && candidateSection.timer
  //                 ? candidateSection.timer
  //                 : anotherSection.timeLimit;
  //             const time = await this.convertTimeToMilliseconds(sectionTimer);
  //             await this.startSectionTimer(
  //               anotherSection.id,
  //               submitResponse.candidateId,
  //               time,
  //               exam.id,
  //               client,
  //             );
  //           }
  //         }
  //       }

  //       let nextQuestion = await this.getNextQuestion(
  //         submitResponse.examId,
  //         submitResponse.sectionId,
  //         submitResponse.candidateId,
  //         submitResponse.questionId,
  //         questionNum,
  //       );
  //       console.log(nextQuestion);
  //       let currentSection = progress.sectionStatus.find(
  //         (s) => s.sectionId == progress.currentSectionId,
  //       );
  //       let nQuestion = nextQuestion?.data?.nextQuestion || null;
  //       let attemptedQuestionsInSection  = [];
  //       let unAttemptedQuestionsInSection = [];
  //       let totalQuestionInSection = []
  //       if(nQuestion){
  //         attemptedQuestionsInSection = progress.questionStatus.filter(
  //           (p) =>
  //             p.sectionId == nQuestion.sectionId && p.attempted === true,
  //         );
  //         unAttemptedQuestionsInSection = progress.questionStatus.filter(
  //           (p) =>
  //             p.sectionId == nQuestion.sectionId && p.attempted === false,
  //         );
  //          totalQuestionInSection = progress.questionStatus.filter(
  //           (q) => q.sectionId == nQuestion.sectionId,
  //         );
       
  //       }
  //       await this.setCurrent(submitResponse.examId, submitResponse.candidateId, progress, nQuestion);
         
      
  //       let responseData = {
  //         questionNum: nQuestion ? nQuestion.questionNum : 0,
  //         question: nQuestion ? nQuestion.question : null,
  //         questionsLeftInSection: unAttemptedQuestionsInSection
  //           ? Math.max(unAttemptedQuestionsInSection.length - 1,0)
  //           : 0,
  //         totalQuestionsInSection: totalQuestionInSection
  //           ? totalQuestionInSection.length
  //           : 0,
  //         currentSectionId: nQuestion
  //           ? nQuestion.sectionId
  //           : progress.currentSectionId,
  //         sectionSubmitted: currentSection ? currentSection.completed : false,
  //         questionSubmitted: nQuestion ? nQuestion.attempted : false,
  //         firstExamQuestion: nQuestion ? nQuestion.firstExamQuestion : false,
  //         lastExamQuestion: nQuestion ? nQuestion.lastExamQuestion : false,
  //         answer: nQuestion ? nQuestion.response : null,
  //       };

  //       const remainingExamTime = await this.getExamRemainingTime(
  //         submitResponse.candidateId,
  //         submitResponse.examId,
  //       );
  //       // const remainingSectionTime = await this.getSectionRemainingTime(
  //       //   submitResponse.candidateId,
  //       //   responseData.currentSectionId,
  //       // );
  //       const remainingSectionTime = await this.getSectionRemainingTime(
  //         submitResponse.candidateId,
  //         responseData.currentSectionId,
  //         submitResponse.examId
  //       );
  //       return {
  //         status: 200,
  //         message: 'Response updated successfully',
  //         data: {
  //           responseData,
  //           remainingExamTime: remainingExamTime,
  //           remainingSectionTime: remainingSectionTime,
  //         },
  //         error: false,
  //       };
  //     }

  //     // If the candidate has not submitted a response, add a new response
  //     const currentDateTime = new Date();
  //     const currentISODateTime = currentDateTime.toISOString();

  //     let networkFailures = submitResponse.noOfRetries
  //       ? submitResponse.noOfRetries
  //       : 0;

  //     await this.updateCandidateProgress(
  //       submitResponse.candidateId,
  //       submitResponse.questionId,
  //       submitResponse.answer,
  //       submitResponse.sectionId,
  //       client,
  //       networkFailures,
  //       submitResponse.examId,
  //     );
  //     let updatedCandidateProgress = await this.getCandidateProgress(
  //       submitResponse.candidateId,
  //       submitResponse.examId,
  //     );
  //     let questionSubmitted = updatedCandidateProgress.questionStatus.filter(
  //       (q) => q.questionId == submitResponse.questionId && q.attempted == true,
  //     );
  //     //console.log(progress.questionStatus);
  //     console.log(`questionSubmitted` + questionSubmitted);
  //     let questionNum = questionSubmitted.questionNum;
  //     if (questionSubmitted) {
  //       questionNum = Number(questionNum) + 1;
  //     }

  //     // Return the next question or relevant data
  //     let nextQuestion = await this.getNextQuestion(
  //       submitResponse.examId,
  //       submitResponse.sectionId,
  //       submitResponse.candidateId,
  //       submitResponse.questionId,
  //       questionNum,
  //     );
  //     console.log(nextQuestion);
  //     let currentSection = updatedCandidateProgress.sectionStatus.find(
  //       (s) => s.sectionId == updatedCandidateProgress.currentSectionId,
  //     );
  //     let nQuestion = nextQuestion?.data?.nextQuestion || null;
  //     // let attemptedQuestionsInSection =
  //     //   updatedCandidateProgress.questionStatus.filter(
  //     //     (p) =>
  //     //       p.sectionId == updatedCandidateProgress.currentSectionId &&
  //     //       p.attempted === true,
  //     //   );

  //     let totalQuestionInSection = [];
  //     let unAttemptedQuestionsInSection = [];
  //     if(nQuestion){
  //      unAttemptedQuestionsInSection =
  //       updatedCandidateProgress.questionStatus.filter(
  //         (p) =>
  //           p.sectionId == nQuestion.sectionId &&
  //           p.attempted === false
  //       );
  //     totalQuestionInSection =
  //       updatedCandidateProgress.questionStatus.filter(
  //         (q) => q.sectionId == nQuestion.sectionId
  //       );
  //     }
      
 

  //     await this.setCurrent(submitResponse.examId, submitResponse.candidateId,updatedCandidateProgress, nQuestion);
  //     let responseData = {
  //       questionNum: nQuestion ? nQuestion.questionNum : 0,
  //       question: nQuestion ? nQuestion.question : null,
  //       questionsLeftInSection: unAttemptedQuestionsInSection
  //         ? Math.max(unAttemptedQuestionsInSection.length - 1, 0)
  //         : 0,
  //       totalQuestionsInSection: totalQuestionInSection
  //         ? totalQuestionInSection.length
  //         : 0,
  //       currentSectionId: nQuestion
  //         ? nQuestion.sectionId
  //         : updatedCandidateProgress.currentSectionId,
  //       sectionSubmitted: currentSection ? currentSection.completed : false,
  //       questionSubmitted: nQuestion ? nQuestion.attempted : false,
  //       firstExamQuestion: nQuestion ? nQuestion.firstExamQuestion : false,
  //       lastExamQuestion: nQuestion ? nQuestion.lastExamQuestion : false,
  //       answer: nQuestion ? nQuestion.response : null,
  //     };

  //     const remainingExamTime = await this.getExamRemainingTime(
  //       submitResponse.candidateId,
  //       submitResponse.examId,
  //     );
  //     // const remainingSectionTime = await this.getSectionRemainingTime(
  //     //   submitResponse.candidateId,
  //     //   responseData.currentSectionId,
  //     // );
  //     const remainingSectionTime = await this.getSectionRemainingTime(
  //       submitResponse.candidateId,
  //       responseData.currentSectionId,
  //       submitResponse.examId
  //     );
  //     return {
  //       status: 200,
  //       message: 'Response submitted successfully',
  //       data: {
  //         responseData,
  //         remainingExamTime: remainingExamTime,
  //         remainingSectionTime: remainingSectionTime,
  //       },
  //       error: false,
  //     };
  //   } catch (err) {
  //     console.error(err);
  //     return {
  //       status: 500,
  //       message: `${err.message}`,
  //       error: true,
  //     };
  //   }
  // }

  async submitResponse(
    submitResponseDto: SubmitResponseDto,
    client: Socket,
  ): Promise<ApiResponse> {
    try {
      const { examId, questionId, candidateId, sectionId, answer } = submitResponseDto;
  

      const [exam, question, candidateExam, section, candidateProgress] = await Promise.all([
        Exam.findByPk(examId),
        Question.findByPk(questionId),
        CandidateExam.findOne({ where: { candidateId, examId } }),
        Section.findByPk(sectionId),
        CandidateProgress.findOne({ where: { examId, candidateId } }),
      ]);
  
      if (!question || !candidateExam || !section || !candidateProgress) {
        return {
          status: 400,
          message: 'Invalid question, exam, section, or candidate',
          error: true,
        };
      }
  
   
      const sectionStatus = candidateProgress.sectionStatus.find(s => s.sectionId === sectionId);
      if (sectionStatus && !sectionStatus.startTime) {
        sectionStatus.startTime = new Date().toISOString();
        await CandidateProgress.update(
          { sectionStatus: candidateProgress.sectionStatus },
          { where: { examId, candidateId } }
        );
      }
  
      // Check if the candidate has submitted a response for this question
      const existingResponseIndex = candidateProgress.questionStatus.findIndex(
        status => status.questionId === questionId && status.attempted
      );
  
      // Update or add the response based on the existing status
      if (existingResponseIndex !== -1) {
        candidateProgress.questionStatus[existingResponseIndex].response = answer;
        candidateProgress.questionStatus[existingResponseIndex].attempted = true;
        candidateProgress.questionStatus[existingResponseIndex].current = false;
      } else {
        const currentDateTime = new Date();
        const newResponse = {
          questionId,
          sectionId,
          response: answer,
          attempted: true,
          current: false,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        };
        candidateProgress.questionStatus.push(newResponse);
      }
  
      // Update candidate progress in the database
      await CandidateProgress.update(
        {
          currentSectionId: candidateProgress.currentSectionId,
          sectionStatus: candidateProgress.sectionStatus,
          questionStatus: candidateProgress.questionStatus,
        },
        { where: { examId, candidateId } }
      );
  
      // Get updated progress data
      const updatedProgress = await this.getCandidateProgress(candidateId, examId);
  
      // Construct response data based on updated progress
      const responseData = this.constructResponseData(updatedProgress, sectionId);
  
      // Calculate remaining exam and section time
      const remainingExamTime = await this.getExamRemainingTime(candidateId, examId);
      const remainingSectionTime = await this.getSectionRemainingTime(candidateId, sectionId, examId);
  
      return {
        status: 200,
        message: 'Response submitted successfully',
        data: {
          responseData,
          remainingExamTime,
          remainingSectionTime,
        },
        error: false,
      };
    } catch (error) {
      console.error('Error submitting response:', error);
      return {
        status: 500,
        message: `Internal server error: ${error.message}`,
        error: true,
      };
    }
  }
  

  // async saveEssayResponse(
  //   submitResponse: SubmitResponseDto,
  //   client,
  // ): Promise<ApiResponse> {
  //   try {
  //     const exam = await Exam.findByPk(submitResponse.examId);
  //     const question = await Question.findByPk(submitResponse.questionId);
  //     const candidateExam = await CandidateExam.findOne({
  //       where: {
  //         candidateId: submitResponse.candidateId,
  //         examId: submitResponse.examId,
  //       },
  //     });
  //     const section = await Section.findByPk(submitResponse.sectionId);

  //     if (!question || !candidateExam || !section) {
  //       return {
  //         status: 400,
  //         message: 'Invalid question, ExamId, or SectionId',
  //         error: true,
  //       };
  //     }

  //     // Retrieve candidate progress
  //     const candidateProgress = await CandidateProgress.findOne({
  //       where: {
  //         examId: submitResponse.examId,
  //         candidateId: submitResponse.candidateId,
  //       },
  //     });
  //     console.log('progress saved', candidateProgress);
  //     const sectionStatus = candidateProgress.sectionStatus.find(
  //       (status) => status.sectionId === submitResponse.sectionId,
  //     );

  //     // Check if the candidate has submitted a response for this question
  //     const existingResponseIndex = candidateProgress.questionStatus.findIndex(
  //       (status) => status.question.id === submitResponse.questionId,
  //     );

  //     // let existingSectionTime = await this.getSectionRemainingTime(
  //     //   submitResponse.candidateId,
  //     //   submitResponse.sectionId,
  //     // );
  //     let existingSectionTime = await this.getSectionRemainingTime(
  //       submitResponse.candidateId,
  //       submitResponse.sectionId,
  //       submitResponse.examId
  //     );
  //     // If the candidate has submitted a response, update it
  //     console.log(existingResponseIndex);
  //     if (existingResponseIndex !== -1) {
  //       if (
  //         exam.setSectionTimer &&
  //         existingSectionTime &&
  //         existingSectionTime.data.remainingSectionTime === '00:00:00'
  //       ) {
  //         let sectionStatusIndex = candidateProgress.sectionStatus.findIndex(
  //           (s) => s.sectionId === sectionStatus.sectionId,
  //         );
  //         candidateProgress.sectionStatus[sectionStatusIndex].completed = true;
  //         if(candidateProgress.sectionStatus[sectionStatusIndex].endTime===""){
  //           candidateProgress.sectionStatus[sectionStatusIndex].endTime =
  //           moment().format('YYYY-MM-DD HH:mm:ss');
  //         } 
  //       }
  //       candidateProgress.questionStatus[existingResponseIndex].response =
  //         submitResponse.answer;
  //       candidateProgress.questionStatus[existingResponseIndex].attempted =
  //         true;
  //       console.log(
  //         'updated response',
  //         candidateProgress.questionStatus[existingResponseIndex],
  //       );

  //       await CandidateProgress.update(
  //         {
  //           currentSectionId: candidateProgress.currentSectionId,
  //           sectionStatus: candidateProgress.sectionStatus,
  //           questionStatus: candidateProgress.questionStatus,
  //         },
  //         {
  //           where: {
  //             examId: submitResponse.examId,
  //             candidateId: submitResponse.candidateId,
  //           },
  //         },
  //       );

  //       return {
  //         status: 200,
  //         message: 'Essay responses saved successfully',
  //         error: false,
  //       };
  //     }

  //     // const currentDateTime = new Date();
  //     // const currentISODateTime = currentDateTime.toISOString();

  //     // let networkFailures = (submitResponse.noOfRetries)?submitResponse.noOfRetries:0;

  //     // await this.updateCandidateProgress(submitResponse.candidateId,submitResponse.questionId,submitResponse.answer,submitResponse.sectionId,client, networkFailures, submitResponse.examId);
  //     // let updatedCandidateProgress = await this.getCandidateProgress(submitResponse.candidateId, submitResponse.examId);
  //     // let questionSubmitted = updatedCandidateProgress.questionStatus.filter((q)=> ((q.questionId==submitResponse.questionId)&&(q.attempted==true)));
  //     // //console.log(progress.questionStatus);
  //     // console.log(`questionSubmitted`+questionSubmitted)
  //     // let questionNum = questionSubmitted.questionNum;
  //     // if(questionSubmitted){
  //     //  questionNum =  Number(questionNum) +1;
  //     // }

  //     // // // Return the next question or relevant data
  //     // let nextQuestion = await this.getNextQuestion(
  //     //   submitResponse.examId,
  //     //   updatedCandidateProgress.currentSectionId,
  //     //   submitResponse.candidateId,
  //     //   questionNum
  //     // );
  //     // console.log(nextQuestion);
  //     // let currentSection = updatedCandidateProgress.sectionStatus.find((s) => (s.sectionId == updatedCandidateProgress.currentSectionId))
  //     // let nQuestion = nextQuestion.data.nextQuestion;
  //     // let attemptedQuestionsInSection = updatedCandidateProgress.questionStatus.filter((p) =>(p.sectionId == updatedCandidateProgress.currentSectionId)  && (p.attempted === true));
  //     // let unAttemptedQuestionsInSection = updatedCandidateProgress.questionStatus.filter((p) => (p.sectionId == updatedCandidateProgress.currentSectionId) && (p.attempted === false));
  //     // let totalQuestionInSection = updatedCandidateProgress.questionStatus.filter((q) => q.sectionId == updatedCandidateProgress.currentSectionId);
  //     // let responseData = {
  //     //   questionNum:(nQuestion)? nQuestion.questionNum:0,
  //     //   question:(nextQuestion.data.nextQuestion)? nQuestion.question:null,
  //     //   questionsLeftInSection: (unAttemptedQuestionsInSection)?(unAttemptedQuestionsInSection.length-1):0,
  //     //   totalQuestionsInSection: (totalQuestionInSection)?(totalQuestionInSection.length):0,
  //     //   currentSectionId:(nQuestion)? nQuestion.sectionId:updatedCandidateProgress.currentSectionId,
  //     //   sectionSubmitted: (currentSection)?currentSection.completed:false,
  //     //   questionSubmitted: (nQuestion)?nQuestion.attempted:false,
  //     //   firstExamQuestion: (nQuestion)?nQuestion.firstExamQuestion:false,
  //     //   lastExamQuestion:(nQuestion)?nQuestion.lastExamQuestion:false,
  //     //   answer:(nQuestion)?nQuestion.response:null
  //     // };

  //     // const remainingExamTime =  await this.getExamRemainingTime(submitResponse.candidateId, submitResponse.examId);
  //     //  const remainingSectionTime = await this.getSectionRemainingTime(submitResponse.candidateId,responseData.currentSectionId);
  //     //  return  {
  //     //    status: 200,
  //     //    message: "Response submitted successfully",
  //     //    data: {
  //     //      responseData,
  //     //      remainingExamTime:remainingExamTime,
  //     //      remainingSectionTime:remainingSectionTime

  //     //    },
  //     //    error: false
  //     //  };
  //   } catch (err) {
  //     console.error(err);
  //     return {
  //       status: 500,
  //       message: `${err.message}`,
  //       error: true,
  //     };
  //   }
  // }

  async saveEssayResponse(
    submitResponse: SubmitResponseDto,
    client,
  ): Promise<ApiResponse> {
    try {
      const [exam, question, candidateExam, section, candidateProgress] = await Promise.all([
        Exam.findByPk(submitResponse.examId),
        Question.findByPk(submitResponse.questionId),
        CandidateExam.findOne({
          where: {
            candidateId: submitResponse.candidateId,
            examId: submitResponse.examId,
          },
        }),
        Section.findByPk(submitResponse.sectionId),
        CandidateProgress.findOne({
          where: {
            examId: submitResponse.examId,
            candidateId: submitResponse.candidateId,
          },
        }),
      ]);
  
      if (!exam || !question || !candidateExam || !section || !candidateProgress) {
        return {
          status: 400,
          message: 'Invalid request parameters',
          error: true,
        };
      }
  
      const sectionStatus = candidateProgress.sectionStatus.find(
        (status) => status.sectionId === submitResponse.sectionId,
      );
  
      const existingResponseIndex = candidateProgress.questionStatus.findIndex(
        (status) => status.question.id === submitResponse.questionId,
      );
  
      let existingSectionTime = await this.getSectionRemainingTime(
        submitResponse.candidateId,
        submitResponse.sectionId,
        submitResponse.examId,
      );
  
      if (existingResponseIndex !== -1) {
        if (
          exam.setSectionTimer &&
          existingSectionTime &&
          existingSectionTime.data.remainingSectionTime === '00:00:00'
        ) {
          const sectionStatusIndex = candidateProgress.sectionStatus.findIndex(
            (s) => s.sectionId === sectionStatus.sectionId,
          );
          candidateProgress.sectionStatus[sectionStatusIndex].completed = true;
          if (!candidateProgress.sectionStatus[sectionStatusIndex].endTime) {
            candidateProgress.sectionStatus[sectionStatusIndex].endTime =
              moment().format('YYYY-MM-DD HH:mm:ss');
          }
        }
        candidateProgress.questionStatus[existingResponseIndex].response =
          submitResponse.answer;
        candidateProgress.questionStatus[existingResponseIndex].attempted = true;
  
        await CandidateProgress.update(
          {
            currentSectionId: candidateProgress.currentSectionId,
            sectionStatus: candidateProgress.sectionStatus,
            questionStatus: candidateProgress.questionStatus,
          },
          {
            where: {
              examId: submitResponse.examId,
              candidateId: submitResponse.candidateId,
            },
          },
        );
  
        return {
          status: 200,
          message: 'Essay responses saved successfully',
          error: false,
        };
      }
  
      let networkFailures = submitResponse.noOfRetries ? submitResponse.noOfRetries : 0;
  
      await this.updateCandidateProgress(
        submitResponse.candidateId,
        submitResponse.questionId,
        submitResponse.answer,
        submitResponse.sectionId,
        client,
        networkFailures,
        submitResponse.examId,
      );
  
      let updatedCandidateProgress = await this.getCandidateProgress(
        submitResponse.candidateId,
        submitResponse.examId,
      );
  
      let questionSubmitted = updatedCandidateProgress.questionStatus.filter(
        (q) => q.questionId == submitResponse.questionId && q.attempted == true,
      );
  
      let questionNum = questionSubmitted.questionNum;
      if (questionSubmitted) {
        questionNum = Number(questionNum) + 1;
      }
  
      let nextQuestion = await this.getNextQuestion(
        submitResponse.examId,
        submitResponse.sectionId,
        submitResponse.candidateId,
        submitResponse.questionId,
        questionNum,
      );
  
      let currentSection = updatedCandidateProgress.sectionStatus.find(
        (s) => s.sectionId == updatedCandidateProgress.currentSectionId,
      );
  
      let nQuestion = nextQuestion?.data?.nextQuestion || null;
  
      let totalQuestionInSection = [];
      let unAttemptedQuestionsInSection = [];
      if (nQuestion) {
        unAttemptedQuestionsInSection = updatedCandidateProgress.questionStatus.filter(
          (p) => p.sectionId == nQuestion.sectionId && p.attempted === false,
        );
        totalQuestionInSection = updatedCandidateProgress.questionStatus.filter(
          (q) => q.sectionId == nQuestion.sectionId,
        );
      }
  
      await this.setCurrent(
        submitResponse.examId,
        submitResponse.candidateId,
        updatedCandidateProgress,
        nQuestion,
      );
  
      let responseData = {
        questionNum: nQuestion ? nQuestion.questionNum : 0,
        question: nQuestion ? nQuestion.question : null,
        questionsLeftInSection: unAttemptedQuestionsInSection
          ? Math.max(unAttemptedQuestionsInSection.length - 1, 0)
          : 0,
        totalQuestionsInSection: totalQuestionInSection
          ? totalQuestionInSection.length
          : 0,
        currentSectionId: nQuestion
          ? nQuestion.sectionId
          : updatedCandidateProgress.currentSectionId,
        sectionSubmitted: currentSection ? currentSection.completed : false,
        questionSubmitted: nQuestion ? nQuestion.attempted : false,
        firstExamQuestion: nQuestion ? nQuestion.firstExamQuestion : false,
        lastExamQuestion: nQuestion ? nQuestion.lastExamQuestion : false,
        answer: nQuestion ? nQuestion.response : null,
      };
  
      const remainingExamTime = await this.getExamRemainingTime(
        submitResponse.candidateId,
        submitResponse.examId,
      );
  
      const remainingSectionTime = await this.getSectionRemainingTime(
        submitResponse.candidateId,
        responseData.currentSectionId,
        submitResponse.examId,
      );
  
      return {
        status: 200,
        message: 'Response submitted successfully',
        data: {
          responseData,
          remainingExamTime: remainingExamTime,
          remainingSectionTime: remainingSectionTime,
        },
        error: false,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        message: `${err.message}`,
        error: true,
      };
    }
  }
  

  // async getPreviousQuestion(dto: PreviousQuestionDto): Promise<ApiResponse> {
  //   try {
  //     const candidateExam = await CandidateExam.findOne({
  //       where: {
  //         candidateId: dto.candidateId,
  //         examId: dto.examId,
  //       },
  //     });

  //     const question = await Question.findByPk(dto.questionId);

  //     const section = await Section.findByPk(dto.sectionId);
  //     const exam = await Exam.findByPk(dto.examId);
  //     if (!question || !candidateExam || !section) {
  //       return {
  //         status: 400,
  //         message: 'Invalid question, ExamId, or SectionId',
  //         error: true,
  //       };
  //     }

  //     // Retrieve candidate progress
  //     const candidateProgress = await this.getCandidateProgress(
  //       dto.candidateId,
  //       dto.examId,
  //     );
  //     let currentQuestionIndex = candidateProgress.questionStatus.findIndex(
  //       (q) => q.question.id === dto.questionId,
  //     );
  //     let previousQuestion =
  //       candidateProgress.questionStatus[currentQuestionIndex - 1];
  //     if (previousQuestion) {
  //       let previousSectionCompleted = candidateProgress.sectionStatus.find(
  //         (s) =>
  //           s.sectionId == previousQuestion.sectionId && s.completed == true,
  //       );
  //       if (exam.setSectionTimer && previousSectionCompleted) {
  //         return {
  //           status: 400,
  //           message:
  //             'This section has already been completed, you cannot submit a response',
  //           error: true,
  //         };
  //       }
  //     }
  //     candidateProgress.questionStatus[currentQuestionIndex].response = dto.answer;
  //     candidateProgress.questionStatus[currentQuestionIndex].current = false;
      
  //     await CandidateProgress.update(
  //       {
  //         questionStatus: candidateProgress.questionStatus,
  //       },
  //       { where: { examId: dto.examId, candidateId: dto.candidateId } },
  //     );

  //     const progress = await CandidateProgress.findOne({
  //       where: { examId: dto.examId, candidateId: dto.candidateId },
  //     });

  //     let sectionCompleted = progress.sectionStatus.find(
  //       (s) => s.sectionId == previousQuestion.sectionId && s.completed == true,
  //     );
  //     let currentSectionId = progress.currentSectionId;
  //     //  if(sectionCompleted){
  //     //    let index = progress.sectionStatus.findIndex((s) => s.sectionId == progress.currentSectionId);
  //     //    let nextSection = progress.sectionStatus[index-1];
  //     //    if(nextSection){
  //     //      currentSectionId = nextSection.sectionId
  //     //    }
  //     //  }

  //     let unAttemptedQuestionsInSection = progress.questionStatus.filter(
  //       (p) =>
  //         p.sectionId == previousQuestion.sectionId && p.attempted === false,
  //     );
  //     let totalQuestionInSection = progress.questionStatus.filter(
  //       (q) => q.sectionId == previousQuestion.sectionId,
  //     );
    

  //     await this.setCurrent(dto.examId, dto.candidateId, progress, previousQuestion);

  //     let responseData = {
  //       questionNum: previousQuestion ? previousQuestion.questionNum : 0,
  //       question: previousQuestion ? previousQuestion.question : null,
  //       questionsLeftInSection: unAttemptedQuestionsInSection.length,
  //       totalQuestionInSection: totalQuestionInSection.length,
  //       currentSectionId: previousQuestion ? previousQuestion.sectionId : null,
  //       sectionSubmitted: sectionCompleted ? true : false,
  //       questionSubmitted: previousQuestion
  //         ? previousQuestion.attempted
  //         : false,
  //       firstExamQuestion: previousQuestion
  //         ? previousQuestion.firstExamQuestion
  //         : false,
  //       lastExamQuestion: previousQuestion
  //         ? previousQuestion.lastExamQuestion
  //         : false,
  //       answer: previousQuestion ? previousQuestion.response : null,
  //     };

  //     const remainingExamTime = await this.getExamRemainingTime(
  //       dto.candidateId,
  //       dto.examId,
  //     );
  //     // const remainingSectionTime = await this.getSectionRemainingTime(
  //     //   dto.candidateId,
  //     //   responseData.currentSectionId,
  //     // );

  //      const remainingSectionTime = await this.getSectionRemainingTime(
  //       dto.candidateId,
  //       responseData.currentSectionId,
  //       dto.examId
  //     );
  //     return {
  //       status: 200,
  //       message: 'Response submitted successfully',
  //       data: {
  //         responseData,
  //         remainingExamTime: remainingExamTime,
  //         remainingSectionTime: remainingSectionTime,
  //       },
  //       error: false,
  //     };
  //   } catch (err) {
  //     console.error(err);
  //     return {
  //       status: 500,
  //       message: ` ${err.message}`,
  //       error: true,
  //     };
  //   }
  // }

  async getPreviousQuestion(dto: PreviousQuestionDto): Promise<ApiResponse> {
    try {
      const [candidateExam, question, section, exam, candidateProgress] = await Promise.all([
        CandidateExam.findOne({
          where: {
            candidateId: dto.candidateId,
            examId: dto.examId,
          },
        }),
        Question.findByPk(dto.questionId),
        Section.findByPk(dto.sectionId),
        Exam.findByPk(dto.examId),
        this.getCandidateProgress(dto.candidateId, dto.examId),
      ]);
  
      if (!question || !candidateExam || !section || !exam || !candidateProgress) {
        return {
          status: 400,
          message: 'Invalid request parameters',
          error: true,
        };
      }
  
      const currentQuestionIndex = candidateProgress.questionStatus.findIndex(
        (q) => q.question.id === dto.questionId,
      );
      const previousQuestion = candidateProgress.questionStatus[currentQuestionIndex - 1];
  
      if (!previousQuestion) {
        return {
          status: 400,
          message: 'No previous question found',
          error: true,
        };
      }
  
      const previousSectionCompleted = candidateProgress.sectionStatus.find(
        (s) => s.sectionId == previousQuestion.sectionId && s.completed == true,
      );
  
      if (exam.setSectionTimer && previousSectionCompleted) {
        return {
          status: 400,
          message:
            'This section has already been completed, you cannot submit a response',
          error: true,
        };
      }
  
      candidateProgress.questionStatus[currentQuestionIndex].response = dto.answer;
      candidateProgress.questionStatus[currentQuestionIndex].current = false;
  
      await CandidateProgress.update(
        {
          questionStatus: candidateProgress.questionStatus,
        },
        { where: { examId: dto.examId, candidateId: dto.candidateId } },
      );
  
      const progress = await CandidateProgress.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
  
      const sectionCompleted = progress.sectionStatus.find(
        (s) => s.sectionId == previousQuestion.sectionId && s.completed == true,
      );
  
      let currentSectionId = progress.currentSectionId;
  
      let unAttemptedQuestionsInSection = progress.questionStatus.filter(
        (p) =>
          p.sectionId == previousQuestion.sectionId && p.attempted === false,
      );
      let totalQuestionInSection = progress.questionStatus.filter(
        (q) => q.sectionId == previousQuestion.sectionId,
      );
  
      await this.setCurrent(dto.examId, dto.candidateId, progress, previousQuestion);
  
      let responseData = {
        questionNum: previousQuestion.questionNum,
        question: previousQuestion.question,
        questionsLeftInSection: unAttemptedQuestionsInSection.length,
        totalQuestionInSection: totalQuestionInSection.length,
        currentSectionId: previousQuestion.sectionId,
        sectionSubmitted: sectionCompleted ? true : false,
        questionSubmitted: previousQuestion.attempted,
        firstExamQuestion: previousQuestion.firstExamQuestion,
        lastExamQuestion: previousQuestion.lastExamQuestion,
        answer: previousQuestion.response,
      };
  
      const remainingExamTime = await this.getExamRemainingTime(
        dto.candidateId,
        dto.examId,
      );
  
      const remainingSectionTime = await this.getSectionRemainingTime(
        dto.candidateId,
        responseData.currentSectionId,
        dto.examId,
      );
  
      return {
        status: 200,
        message: 'Response submitted successfully',
        data: {
          responseData,
          remainingExamTime: remainingExamTime,
          remainingSectionTime: remainingSectionTime,
        },
        error: false,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 500,
        message: `${err.message}`,
        error: true,
      };
    }
  }
  

  // async submitExam(examId: string, candidateId: string) {
  //   try {
  //     const candidateExam = await CandidateExam.findOne({
  //       where: {
  //         candidateId,
  //         examId,
  //       },
  //     });
  //     if (!candidateExam) {
  //       return {
  //         status: 400,
  //         message: 'Invalid Exam or Candidate Id',
  //         error: true,
  //       };
  //     }

  //     if (candidateExam.isSubmitted) {
  //       return {
  //         status: 400,
  //         message: 'Exam has already been submitted',
  //         error: true,
  //       };
  //     }
  //     const progress = await this.getCandidateProgress(candidateId, examId);
  //     console.log(progress);
  //     await CandidateProgress.update(
  //       {
  //         currentSectionId: progress.currentSectionId,
  //         sectionStatus: progress.sectionStatus,
  //         questionStatus: progress.questionStatus,
  //         loginAttempts: progress?.loginAttempts,
  //         networkFailures: progress?.networkFailures,
  //         lastLogin: progress.lastLogin,
  //       },
  //       {
  //         where: { candidateId: progress.candidateId, examId: progress.examId },
  //       },
  //     );

  //     await CandidateExam.update(
  //       {
  //         endTime: new Date().toISOString(),
  //         isSubmitted: true,
  //       },
  //       { where: { id: candidateExam.id } },
  //     );

  //     const grade = await this.gradeExam(candidateId, examId);

  //    // await this.cacheManager.del(`examTimer:${candidateId}-${examId}`);
  //     return {
  //       status: 200,
  //       message: 'Your Exam has successfully been submitted',
  //       data: {
  //         grade: grade,
  //       },
  //       error: false,
  //     };
  //   } catch (e) {
  //     console.log(e);
  //     return {
  //       status: 500,
  //       message: `Internal Server Error: ${e.message}`,
  //       error: true,
  //     };
  //   }
  // }

  async submitExam(examId: string, candidateId: string, submissionType?: string, submissionReason?: string) {
    try {
      const candidateExam = await CandidateExam.findOne({
        where: {
          candidateId,
          examId,
        },
      });
      const progress = await this.getCandidateProgress(candidateId, examId);

      if (!candidateExam) {
        return {
          status: 400,
          message: 'Invalid Exam or Candidate Id',
          error: true,
        };
      }

      if (candidateExam.isSubmitted) {
        return {
          status: 400,
          message: 'Exam has already been submitted',
          error: true,
        };
      }

      await Promise.all([
        CandidateProgress.update(
          {
            currentSectionId: progress.currentSectionId,
            sectionStatus: progress.sectionStatus,
            questionStatus: progress.questionStatus,
            loginAttempts: progress?.loginAttempts,
            networkFailures: progress?.networkFailures,
            lastLogin: progress.lastLogin,
          },
          {
            where: { candidateId, examId },
          },
        ),
        CandidateExam.update(
          {
            endTime: new Date().toISOString(),
            isSubmitted: true,
            submissionType: submissionType || 'manual',
            submissionReason: submissionReason || null,
          },
          { where: { id: candidateExam.id } },
        ),
      ]);
  
      const grade = await this.gradeExam(candidateId, examId);
  
      // Fetch all candidates for the exam, including those who did not attempt
      const allCandidates = await CandidateExam.findAll({
        where: { examId },
      });

      return {
        status: 200,
        message: 'Your Exam has successfully been submitted',
        data: {
          grade,
          allCandidates, // Include all candidates in the response
        },
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }
  

  async getPerformanceBreakdown(dto: SubmitExamDto) {
    try {
      const exam = await Exam.findOne({ where: { id: dto.examId } });
      if (exam && !exam.showBreakdown) {
        return {
          status: 400,
          message:
            'Break down cannot be shown for this exam, please update exam config to enable this feature',
          error: true,
        };
      }
      const grade = await Grade.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      if (!grade) {
        return {
          status: 400,
          message:
            'No grade for the specified candidate and exam, ensure candidateId and examId are valid',
          error: true,
        };
      }

      let breakdown = grade.sectionGrades.map((g) => {
        let essayResult = g.essayResponses.length === 0 ? 'null' : 'pending';

        let essayObtainableScore = 0;
        let essayCandidateScore = 0;

        if (grade.essayGrade) {
          essayObtainableScore = g.essayResponses.reduce(
            (total, section) => total + section.obtainableScore,
            0,
          );
          essayCandidateScore = g.essayResponses.reduce(
            (total, section) => total + section.score,
            0,
          );
          essayResult = essayCandidateScore.toString();
        }

        return {
          subject: g.subject,
          correct: g.correctAnswers,
          incorrect: g.incorrectAnswers,
          unAnswered: g.unansweredQuestions,
          candidateScore: g.candidateScore + Number(essayCandidateScore),
          obtainableScore: g.totalObtainableScore,
          essayResult: essayResult,
        };
      });

      const totalObtainableScore = breakdown.reduce(
        (total, section) => total + section.obtainableScore,
        0,
      );
      const totalCandidateScore = breakdown.reduce(
        (total, section) => total + section.candidateScore,
        0,
      );

      return {
        status: 200,
        message: 'Performance breakdown retrieved successfully',
        data: {
          breakdown: breakdown,
          totalScore: `${totalCandidateScore}/${totalObtainableScore}`,
          weightedScore: grade.essayGrade
            ? Number(grade.nonEssayGrade) + Number(grade.essayGrade)
            : Number(grade.nonEssayGrade),
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async viewResult(dto: SubmitExamDto) {
    try {
      const grade = await Grade.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      if (!grade) {
        return {
          status: 400,
          message:
            'No grade for the specified candidate and exam, ensure candidateId and examId are valid',
          error: true,
        };
      }

      let breakdown = grade.sectionGrades.map((g) => {
        return {
          subject: g.subject,
          candidateScore: g.candidateScore,
          obtainableScore: g.totalObtainableScore,
        };
      });

      return {
        status: 200,
        message: 'result retrieved successfully',
        data: {
          breakdown: breakdown,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  // async getTranscriptsPaginated(examId:string, page:number=1, limit:number=10){
  //   try{
  //     const offset = (page - 1) * limit;
  //     const { count, rows: candidates } = await CandidateExam.findAndCountAll({
  //       where:{examId:examId},
  //       limit:Number(limit),
  //       offset: offset
  //     });
  //     let transcripts = [];
  //      for(let person of candidates){
  //       const grade = await Grade.findOne({where:{examId:examId, candidateId:person.candidateId}});
  //       if(!grade){
  //         continue;
  //       }
  //       const profile = await Candidate.findByPk(person.candidateId);
  //       let breakdown = grade.sectionGrades.map((g) => {
  //          return{
  //            subject: g.subject,
  //            candidateScore:g.candidateScore,
  //            obtainableScore:g.totalObtainableScore,
  //          }
  //       });

  //       transcripts.push({
  //         username:profile.username,
  //         email: profile.email,
  //         result: breakdown
  //       })
  //      }

  //     return {
  //       status: 200,
  //       message:"result retrieved successfully",
  //       data:transcripts,
  //       pageInfo: {
  //         totalItems: count,
  //         totalPages: Math.ceil(count / limit),
  //         currentPage: page,
  //       },
  //       error: false
  //     }
  //   }
  //   catch(e){
  //     return {
  //       status:500,
  //       message: `An Error occurred: ${e.message}`,
  //       error: true
  //     }
  //   }

  // }

  async getAllTranscripts(examId: string) {
    try {
      // First get the exam details
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 404,
          message: 'Exam not found',
          error: true,
        };
      }

      const { count, rows: candidates } = await CandidateExam.findAndCountAll({
        where: { examId: examId },
      });

      let transcripts = [];
      for (let person of candidates) {
        const candidate = await Candidate.findByPk(person.candidateId);
        if (!candidate) {
          continue;
        }

        const candidateExam = await CandidateExam.findOne({
          where: { examId: examId, candidateId: person.candidateId },
        });

        const progress = await CandidateProgress.findOne({
          where: { examId: examId, candidateId: person.candidateId },
        });

        const grade = await Grade.findOne({
          where: { examId: examId, candidateId: person.candidateId },
        });

        // Only include candidates who have progress/responses
        if (!progress || !grade) {
          continue;
        }

        const sectionStat = await this.getCandidateSectionStatistics(
          examId,
          person.candidateId,
          grade,
        );

        // Fetch violations for this candidate
        const violations = await Violation.findAll({
          where: { examId: examId, candidateId: person.candidateId },
        });

        let questions = [];
        if (progress.questionStatus) {
          for (let s of progress.questionStatus) {
            questions.push(s);
          }
        }

        // Build detailed transcript data (matching getAnsweredQuestions structure)
        transcripts.push({
          // Candidate basic info
          username: candidate.username,
          email: candidate.email,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          picture: candidate.picture,
          
          // Exam info
          examId: examId,
          examTitle: exam.title,
          examType: exam.type,
          examDeliveryMode: exam.deliveryMode,
          examScheduledStartTime: exam.startTime,
          examScheduledEndTime: exam.endTime,
          
          // Candidate exam specific info
          faceCaptured: candidateExam?.faceCaptured,
          examStartTime: candidateExam?.startTime,
          examEndTime: candidateExam?.endTime,
          
          // Questions and answers
          questions: questions,
          sections: sectionStat,
          
          // Violations
          violations: violations.map(v => ({
            violationType: v.violationType,
            violationReason: v.violationReason,
            timestamp: v.createdAt,
          })),
          
          // Grade data
          grade: grade,
        });
      }

      return {
        status: 200,
        message: 'Transcripts retrieved successfully',
        data: transcripts,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async getOneTranscripts(examId: string, candidateId: string) {
    try {
      const candidateExam = await CandidateExam.findAndCountAll({
        where: { examId: examId, candidateId: candidateId },
      });

      const grade = await Grade.findOne({
        where: { examId: examId, candidateId: candidateId },
      });
      if (!grade) {
        return {
          status: 400,
          message: 'No grade found for this candidate',
          error: true,
        };
      }
      const profile = await Candidate.findByPk(candidateId);
      let breakdown = grade.sectionGrades.map((g) => {
        return {
          subject: g.subject,
          candidateScore: g.candidateScore,
          obtainableScore: g.totalObtainableScore,
        };
      });

      let transcripts = {
        username: profile.username,
        email: profile.email,
        result: breakdown,
      };

      return {
        status: 200,
        message: 'result retrieved successfully',
        data: transcripts,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async generateAllTranscriptsPdf(examId: string): Promise<Buffer> {
    try {
      const transcriptsData = await this.getAllTranscripts(examId);
      if (transcriptsData.error) {
        throw new Error(transcriptsData.message);
      }

      const transcripts = transcriptsData.data;
      const { jsPDF } = require('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Transcript Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Exam ID: ${examId}`, 20, 35);
      doc.text(`Total Candidates: ${transcripts.length}`, 20, 45);
      
      let yPos = 60;
      
      for (let i = 0; i < transcripts.length; i++) {
        const t = transcripts[i];
        
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`Candidate ${i + 1}: ${t.username || 'N/A'}`, 20, yPos);
        yPos += 8;
        
        doc.setFontSize(11);
        doc.text(`Candidate ID: ${t.username || 'N/A'}`, 25, yPos);
        yPos += 6;
        doc.text(`Email: ${t.email || 'N/A'}`, 25, yPos);
        yPos += 10;
        
        if (t.result && t.result.length > 0) {
          doc.setFontSize(12);
          doc.text('Results:', 25, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.text('Subject', 30, yPos);
          doc.text('Score', 100, yPos);
          doc.text('Total', 130, yPos);
          yPos += 6;
          
          t.result.forEach((r) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(String(r.subject || 'N/A'), 30, yPos);
            doc.text(String(r.candidateScore || 0), 100, yPos);
            doc.text(String(r.obtainableScore || 0), 130, yPos);
            yPos += 6;
          });
          
          yPos += 10;
        }
      }
      
      return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async generateAllTranscriptsZip(examId: string): Promise<Buffer> {
    try {
      const transcriptsData = await this.getAllTranscripts(examId);
      if (transcriptsData.error) {
        throw new Error(transcriptsData.message);
      }

      const transcripts = transcriptsData.data;
      const archiver = require('archiver');
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('data', (chunk) => chunks.push(chunk));
        
        archive.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        archive.on('error', (err) => {
          console.error('Error creating ZIP:', err);
          reject(err);
        });

        for (let i = 0; i < transcripts.length; i++) {
          const t = transcripts[i];
          const filename = `${t.username || 'candidate_' + i}.txt`;
          
          let content = `Transcript Report
`;
          content += `=================

`;
          content += `Candidate ID: ${t.username || 'N/A'}
`;
          content += `Email: ${t.email || 'N/A'}

`;
          content += `Results:
`;
          
          if (t.result) {
            t.result.forEach((r, ri) => {
              content += `  ${ri + 1}. ${r.subject}: ${r.candidateScore}/${r.obtainableScore}
`;
            });
          }
          
          archive.append(content, { name: filename });
        }

        archive.finalize();
      });
    } catch (error) {
      console.error('Error generating ZIP:', error);
      throw error;
    }
  }

  async gradeExam(candidateId: string, examId: string) {
    try {
      const progress = await this.getCandidateProgress(candidateId, examId);
      const essayResponses = [];
      const sectionGrades = [];

      for (const section of progress.sectionStatus) {
        const sectionQuestions = await this.getSectionQuestionNonPaginated(
          section.sectionId,
        );
        //progress.questionStatus.filter((q) => q.sectionId === section.sectionId);
        const attemptedQuestions = progress.questionStatus.filter(
          (q) => q.attempted === true,
        );
        const sectionGrade = {
          sectionId: section.sectionId,
          totalQuestions: sectionQuestions.questions.length,
          subject: sectionQuestions.subject,
          unansweredQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          essayResponses: [],
          candidateScore: 0,
          totalObtainableScore: 0,
          started: section.startTime || null,
          submitted: section.endTime || null,
        };

        for (const question of sectionQuestions.questions) {
          const attemptedQuestion = attemptedQuestions.find(
            (q) => q.question.id === question.id,
          );

          // Calculate the total obtainable score for the section
          sectionGrade.totalObtainableScore += Number(question.score);

          if (question.type.toLowerCase() !== 'essay') {
            if (attemptedQuestion) {
              if (
                String(attemptedQuestion.response).toLowerCase() ===
                String(question.correctOption).toLowerCase()
              ) {
                sectionGrade.correctAnswers++;
                sectionGrade.candidateScore += Number(question.score);
              } else {
                sectionGrade.incorrectAnswers++;
              }
            } else {
              sectionGrade.unansweredQuestions++;
            }
          } else {
            // Handle essay questions
            if (attemptedQuestion) {
              sectionGrade.essayResponses.push({
                questionId: question.id,
                content: question.content,
                response: attemptedQuestion.answer,
                sectionId: section.id,
              });
            }
          }
        }

        sectionGrades.push(sectionGrade);
      }

      // Calculate overall grade
      const totalMaxScore = sectionGrades.reduce(
        (total, section) => total + section.totalObtainableScore,
        0,
      );
      const totalScore = sectionGrades.reduce(
        (total, section) => total + section.candidateScore,
        0,
      );
      const percent = (totalScore / totalMaxScore) * 100;

      await CandidateResponse.create({
        candidateId: candidateId,
        examId: examId,
        responses: essayResponses,
      });

      const grade = {
        candidateId: candidateId,
        examId: examId,
        nonEssayGrade: totalScore,
        totalNoOfQuestion: sectionGrades.reduce(
          (total, section) => total + section.totalQuestions,
          0,
        ),
        noOfAttemptedQuestions: sectionGrades.reduce(
          (total, section) => total + section.attemptedQuestions,
          0,
        ),
        sectionGrades,
      };

      const existingGrade = await Grade.findOne({
        where: { candidateId: grade.candidateId, examId: grade.examId },
      });
      if (existingGrade) {
        await Grade.update(
          {
            nonEssayGrade: grade.nonEssayGrade,
            totalNoOfQuestion: grade.totalNoOfQuestion,
            noOfAttemptedQuestions: grade.noOfAttemptedQuestions,
            sectionGrades: grade.sectionGrades,
          },
          { where: { candidateId: grade.candidateId, examId: grade.examId } },
        );
      } else {
        await Grade.create(grade);
      }

      console.log(grade);
      let result;
      const exam = await Exam.findByPk(examId);
      if (exam && exam.showResult) {
        switch (exam.resultType) {
          case ResultType.Percentage:
            result = `${percent.toFixed(0)}%`;
            break;
          case ResultType.PassorFail:
            result = percent > 50 ? 'Passed' : 'Failed';
            break;
          case ResultType.Points:
            result = `${Number(totalScore) / Number(totalMaxScore)}`;
            break;
        }
      } else {
        result = 'N/A';
      }
      return result;
    } catch (e) {
      throw e;
    }
  }

  async getAllCenters(
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {
      let { rows, count } = await Center.findAndCountAll({
        limit: Number(limit),
        offset,
      });

      return {
        status: 200,
        message: 'centers retrieved successfully',
        data: rows,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }
  async getCenterCandidates(
    user,
    examId: string,
    centerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }
      const center = await Center.findByPk(centerId);
      if (!center) {
        return {
          status: 400,
          message: 'Invalid center id',
          error: true,
        };
      }
      if (user.roles.includes('local-admin')) {
        if (center && center.adminId !== user.sub) {
          return {
            status: 403,
            message: 'you are not authorized to perform action in this center',
            error: true,
          };
        }
      }

      let { rows, count } = await Candidate.findAndCountAll({
        limit: Number(limit),
        offset,
        where: { centerId: centerId },
      });
      let result = [];
      let total = count;
      for (let r of rows) {
        const candExam = await CandidateExam.findOne({
          where: { candidateId: r.id, examId: exam.id },
        });
        if (!candExam) {
          total--;
          continue;
        }
        result.push({
          id: r.id,
          username: r.username,
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          status: r.status,
          picture: r.picture,
          phoneNo: r.phoneNo,
          imported: r.imported,
          assignedSubjects: candExam.assignedSubjects,
          faceCaptured: candExam.faceCaptured,
        });
      }
      return {
        status: 200,
        message: 'center candidates retrieved successfully',
        data: result,
        pageInfo: {
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async getCenterCandidatesWithoutPagination(
    user,
    examId: string,
    centerId: string,
  ): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }
      const center = await Center.findByPk(centerId);
      if (!center) {
        return {
          status: 400,
          message: 'Invalid center id',
          error: true,
        };
      }
      if (user.roles.includes('local-admin')) {
        if (center && center.adminId !== user.sub) {
          return {
            status: 403,
            message: 'you are not authorized to perform action in this center',
            error: true,
          };
        }
      }

      let rows = await Candidate.findAndCountAll({
        where: { centerId: centerId },
      });

      return {
        status: 200,
        message: 'center candidates retrieved successfully',
        data: rows,
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async getCenterCandidatesProgresses(
    user,
    examId: string,
    centerId,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }
      const center = await Center.findByPk(centerId);
      if (user.roles.includes('local-admin')) {
        if (center && center.adminId !== user.sub) {
          return {
            status: 403,
            message: 'you are not authorized to perform action in this center',
            error: true,
          };
        }
      }
      const offset = (page - 1) * limit;
      const { count, rows: candidates } = await CandidateExam.findAndCountAll({
        where: { examId: examId },
        include: [Candidate],
        limit: Number(limit),
        offset: offset,
      });

      let newCount = count;

      const examSections = await this.getExamSections(examId);
      let totalQuestions = 0;
      for (let section of examSections.data) {
        totalQuestions += section.noOfQuestions;
      }

      let allProgresses = [];

      for (let person of candidates) {
        let progress = await this.getCandidateProgress(person.candidateId);
        let candidate = await Candidate.findByPk(person.candidateId);
        if (candidate && candidate.centerId !== centerId) {
          newCount--;
          continue;
        }
        if (progress) {
          allProgresses.push({
            candidateId: person.candidateId,
            username: candidate.username,
            email: candidate.email,
            id: candidate.id,
            loggedIn: progress.lastLogin,
            startedAt: person.startTime,
            attempted: progress.questionStatus.filter(
              (q) => q.attempted == true,
            ).length,
            totalQuestions,
          });
        }
      }

      return {
        status: 200,
        message: ' center Candidates progresses retrieved successfully',
        data: allProgresses,
        pageInfo: {
          totalItems: newCount,
          totalPages: Math.ceil(newCount / limit),
          currentPage: page,
        },
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occured: ${e.message}`,
        error: true,
      };
    }
  }

  async localAdminExamMonitoringStat(user, examId: string, centerId: string) {
    try {
      const examCenter = await ExamCenter.findOne({
        where: { examId: examId, centerId: centerId },
      });
      if (!examCenter) {
        return {
          status: 400,
          message: 'Invalid Exam Id or centerId',
          error: true,
        };
      }
      const exam = await Exam.findByPk(examId);
      let Candidates = await CandidateExam.findAll({
        where: { examId: examId },
      });
      Candidates = Candidates.filter(async (c) => {
        let person = await Candidate.findByPk(c.candidateId);
        return person.centerId === centerId;
      });
      let loginAttempts = 0;
      let networkFailures = 0;
      let candidatesWhoStarted;
      let submissions;
      if (Candidates && Candidates.length !== 0) {
        let today = moment();
        candidatesWhoStarted = Candidates.filter((c) => {
          return c.startTime !== null && today.isAfter(moment(exam.startTime));
        });
        submissions = Candidates.filter((c) => {
          return c.isSubmitted === true;
        });

        for (let person of Candidates) {
          let progress = await this.getCandidateProgress(
            person.candidateId,
            examId,
          );
          if (progress) {
            loginAttempts += progress.loginAttempts;
            networkFailures += progress.networkFailures;
          }
        }
      }
      //  const center = await Center.findByPk(centerId);
      if (user.roles.includes('local-admin')) {
        if (examCenter && examCenter.adminId !== user.sub) {
          return {
            status: 403,
            message:
              'you are not authorized to perform this action in this center',
            error: true,
          };
        }
      }
      return {
        status: 200,
        message: 'Exam monitoring statistics retrieved successfully',
        data: {
          loginAttempts,
          networkFailures,
          noOfCandidates: Candidates.length || 0,
          candidatesWhoStarted: candidatesWhoStarted.length || 0,
          totalSubmissions: submissions.length || 0,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'Exam monitoring statistics retrieved successfully',
        error: true,
      };
    }
  }
  async getNextQuestion(
    examId,
    sectionId,
    candidateId,
    currentQuestionId?: string,
    questionNum?: number,
  ): Promise<ApiResponse> {
    try {
      // const attemptedQuestions = await this.getAttemptedQuestions(examId, sectionId, candidateId);
      const progress = await CandidateProgress.findOne({
        where: { examId: examId, candidateId: candidateId },
      });

      //  const  nextQuestion = progress.questionStatus.filter((q) => ( (q.sectionId == sectionId) && (q.attempted == false)))
      let currentQuestionIndex = progress.questionStatus.findIndex(
        (q) => q.sectionId == sectionId && q.question.id == currentQuestionId,
      );
      let nextQuestionNum =
        Number(progress.questionStatus[currentQuestionIndex].questionNum) + 1;
      
      let nextQuestion = progress.questionStatus[currentQuestionIndex+1];
      console.log(nextQuestion);
      let remainingSectionQuestions = progress.questionStatus.filter(
        (q) => q.sectionId == nextQuestion.sectionId && q.attempted == false,
      );
      let sectionQuestions = await this.getSectionQuestionNonPaginated(
        nextQuestion?.sectionId,
      );
      return {
        status: 200,
        message: 'Next question retrieved successfully',
        data: {
          nextQuestion: nextQuestion,
          questionsLeftInSection: Math.max(
            remainingSectionQuestions.length - 1,
          ),
          totalQuestionInSection: sectionQuestions.questions.length,
        },
        error: false,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: error.message,
        error: true,
      };
    }
  }

  async getExamSubjects(examId) {
    try {
      const exam = await Exam.findByPk(examId, {
        include: { model: Item },
      });

      const subjects = [
        ...new Set(
          exam.items.map((item) => item.questionSubject.toLowerCase()),
        ),
      ];

      return {
        status: 200,
        message: 'Exam subjects retrieved successfully',
        data: subjects,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async enableExamReLogin(allowDto: AllowReLoginDto) {
    try {
      const exam = await Exam.findByPk(allowDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      await Exam.update(
        { allowReLogin: allowDto.allow },
        { where: { id: allowDto.examId } },
      );
      return {
        status: 200,
        message: 'exam setting updated successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  async enableShowResult(allowDto: AllowReLoginDto) {
    try {
      const exam = await Exam.findByPk(allowDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      await Exam.update(
        { showResult: allowDto.allow },
        { where: { id: allowDto.examId } },
      );
      return {
        status: 200,
        message: 'exam setting updated successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  async enableShowBreakdown(allowDto: AllowReLoginDto) {
    try {
      const exam = await Exam.findByPk(allowDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      await Exam.update(
        { showBreakdown: allowDto.allow },
        { where: { id: allowDto.examId } },
      );
      return {
        status: 200,
        message: 'exam setting updated successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }
  async enableComputerChange(allowDto: AllowReLoginDto) {
    try {
      const exam = await Exam.findByPk(allowDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      await Exam.update(
        { allowComputerChange: allowDto.allow },
        { where: { id: allowDto.examId } },
      );
      return {
        status: 200,
        message: 'exam setting updated successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  async getAttemptedQuestions(examId, sectionId, candidateId) {
    try {
      const candidateProgress = await this.getCandidateProgress(
        candidateId,
        examId,
      );

      const attemptedQuestions = [];
      for (let record of candidateProgress.questionStatus) {
        attemptedQuestions.push(record);
      }
      return attemptedQuestions;
    } catch (e) {
      throw e;
    }
  }

  // async startExamTimer(startExam: StartExamDto, examTimeLimitInMilliseconds) {
  //   try {
  //     const { candidateId, examId } = startExam;
  //     const currentTime = Date.now();
  //     //const currentTime = Number(process.hrtime.bigint()) / 1e6;
  //     const gracePeriod = 4;

  //     let delayMinutes = 1; 
  //     let examRestarted = await this.cacheManager.get(`examRestarted:${candidateId}-${examId}`);
  //     console.log(examRestarted);
  //     if(examRestarted)  delayMinutes +=2;
  //     let delayMilliseconds = delayMinutes * 60 * 1000
     
    
  //     const endTime =
  //       currentTime + examTimeLimitInMilliseconds + gracePeriod * 1000;

  //     const existingRemainingTime = await this.cacheManager.get(
  //       `examTimer:${candidateId}-${examId}`,
  //     );
  //     if (existingRemainingTime) {
  //       return existingRemainingTime;
  //     }
      
  //     const examTimerRefKey = `examTimeoutRef:${candidateId}-${examId}`;
  //     const existingExamTimerRef = ExamService.examTimers.get(examTimerRefKey);
  //     console.log("existingTimeRef", existingExamTimerRef)

  //     if (examRestarted && existingExamTimerRef) {
  //         clearTimeout(Number(existingExamTimerRef));
  //         ExamService.examTimers.delete(examTimerRefKey);
  //         await this.cacheManager.del(`examRestarted:${candidateId}-${examId}`);
  //     }

  //     console.log("existingTimerAfter", existingExamTimerRef)
  //     const examTimer = setTimeout(async () => {

  //       ExamService.examTimers.delete(examTimerRefKey);
  //       await this.submitExam(examId, candidateId);

  //       console.log(`Exam ended for candidate: ${candidateId}`);
  //       await this.cacheManager.del(`examTimer:${candidateId}-${examId}`);
  //     }, (endTime - currentTime) + delayMilliseconds);
     

  //     await this.cacheManager.set(
  //       `examTimer:${candidateId}-${examId}`,
  //       endTime,
  //       0,
  //     );
  //     console.log("timer set", examTimer)
     
  //     ExamService.examTimers.set(`examTimeoutRef:${candidateId}-${examId}`, examTimer);
  //     console.log(
  //       await this.cacheManager.get(`examTimer:${candidateId}-${examId}`),
  //     );
  //   } catch (error) {
  //     console.error(`Error in startExamTimer: ${error}`);
  //     throw error;
  //   }
  // }

  async startExamTimer(startExam: StartExamDto, examTime) {
    try {
      const { candidateId, examId } = startExam;
      let startTime = new Date().toISOString();
      const [hours, minutes, seconds] = examTime.split(":").map(Number);
      const timerMilliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000;
      let endTime = new Date(new Date(startTime).getTime() + timerMilliseconds).toISOString();
      
      const candExam = await CandidateExam.findOne({where:{candidateId, examId}});
      if(candExam && (candExam.startTime) && (candExam.endTime)){
         startTime = candExam.startTime
         endTime = candExam.endTime
      }
      // Update CandidateExam with endTime
        await CandidateExam.update(
          { 
            startTime: startTime,
            endTime: endTime,
          },
          { where: { candidateId,examId } },
        );

     
    } catch (error) {
      console.error(`Error in startExamTimer: ${error}`);
      throw error;
    }
  }


  // async extendExamTimer(examId, candidateId, examTimeExtensionInMilliseconds) {
  //   try {
  //     const exam = await Exam.findByPk(examId);
  //     if (!exam) {
  //       return {
  //         status: 400,
  //         message: 'Exam not found',
  //         error: true,
  //       };
  //     }
  //     const currentEndTime = await this.cacheManager.get(
  //       `examTimer:${candidateId}-${examId}`,
  //     );

  //     if (!currentEndTime) {
  //       return;
  //       // throw new Error(`No active timer found for candidate: ${candidateId}`);
  //     }

  //     // Calculate the new end time by adding the extension
  //     const remainingTime = await this.getExamRemainingTime(
  //       candidateId,
  //       examId,
  //     );
  //     let candidateExam = await CandidateExam.findOne({
  //       where: { candidateId: candidateId, examId: examId },
  //     });
  //     let overallTimer =
  //       candidateExam && candidateExam.timer
  //         ? candidateExam.timer
  //         : exam.timeLimit;
  //     const examTime = await this.convertTimeToMilliseconds(overallTimer);
  //     const remainingTimeInMillisecs = await this.convertTimeToMilliseconds(
  //       remainingTime.data.remainingTime,
  //     );
  //     const spentTime = examTime - remainingTimeInMillisecs;
  //     let newEndTime = examTimeExtensionInMilliseconds - spentTime;

  //     if (newEndTime > 0) {
  //       await this.cacheManager.del(`examTimer:${candidateId}-${examId}`);
       
  //       const examTimerRef  = ExamService.examTimers.get(`examTimeoutRef:${candidateId}-${examId}`);

  //       if (examTimerRef) {
  //         clearTimeout(Number(examTimerRef));
  //         ExamService.examTimers.delete(examTimerRef);
  //       }

  //       // const examTimer = setTimeout(async () => {
  //       //   await this.submitExam(examId, candidateId);
  //       //   console.log(`Exam ended for candidate: ${candidateId}`);
  //       // // await this.cacheManager.del(`examTimer:${candidateId}-${examId}`);
  //       // }, newEndTime - Date.now());
  //       await this.startExamTimer(
  //         { candidateId: candidateId, examId: examId },
  //         newEndTime,
  //       );
     
  //       //  await this.cacheManager.set(`examTimer:${candidateId}-${examId}`, newEndTime, oneWeekInSeconds);
  //       let timeLeft = await this.getExamRemainingTime(candidateId, examId);
  //       this.emitToClient(
  //         `${candidateId}_${examId}`,
  //         'remaining-exam-time',
  //         timeLeft,
  //       );
  //     } else {
  //       this.emitToClient(`${candidateId}_${examId}`, 'remaining-exam-time', {
  //         status: 200,
  //         message: 'Exam time extended',
  //         data: { remainingTime: '00:00:00' },
  //         error: false,
  //       });
  //     }

  //     console.log(
  //       `Extended exam timer for candidate: ${candidateId} until ${new Date(
  //         newEndTime,
  //       )}`,
  //     );
  //   } catch (error) {
  //     console.error(`Error in extendExamTimer: ${error}`);
  //     throw error;
  //   }
  // }



  async extendExamTimer(examId, candidateId, examTimeExtensionInMilliseconds) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Exam not found',
          error: true,
        };
      }
 
      // Calculate the new end time by adding the extension
      const remainingTime = await this.getExamRemainingTime(
        candidateId,
        examId,
      );
      let candidateExam = await CandidateExam.findOne({
        where: { candidateId: candidateId, examId: examId },
      });
      if (!candidateExam) {
        return;
      }
      let overallTimer =
        candidateExam && candidateExam.timer
          ? candidateExam.timer
          : exam.timeLimit;
      const examTime = await this.convertTimeToMilliseconds(overallTimer);
      const remainingTimeInMillisecs = await this.convertTimeToMilliseconds(
        remainingTime.data.remainingTime,
      );
      const spentTime = examTime - remainingTimeInMillisecs;
      let newEndTime = examTimeExtensionInMilliseconds - spentTime;
      console.log("newEndTime", newEndTime);
      if (newEndTime > 0) {
   

         if(candidateExam.endTime){
          let currentTime = new Date().toISOString();
          let endTime = new Date(new Date(currentTime).getTime() + newEndTime).toISOString();
          console.log(endTime);
  
          await CandidateExam.update({endTime: endTime},{ where:{candidateId: candidateId, examId: examId} } )
         }
   
        let timeLeft = await this.getExamRemainingTime(candidateId, examId);
        this.emitToClient(
          `${candidateId}_${examId}`,
          'remaining-exam-time',
          timeLeft,
        );
      } else {
        this.emitToClient(`${candidateId}_${examId}`, 'remaining-exam-time', {
          status: 200,
          message: 'Exam time extended',
          data: { remainingTime: '00:00:00' },
          error: false,
        });
      }

      console.log(
        `Extended exam timer for candidate: ${candidateId} until ${new Date(
          newEndTime,
        )}`,
      );
    } catch (error) {
      console.error(`Error in extendExamTimer: ${error}`);
      throw error;
    }
  }

  async formatMilliseconds(milliseconds: number): Promise<string> {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
  }



  async getExamRemainingTime(
    candidateId: string,
    examId: string,
  ): Promise<ApiResponse> {
    try {
      const candExam = await CandidateExam.findOne({where:{examId, candidateId}})
      let formattedRemainingTime = "00:00:00"
      if (candExam && candExam.endTime) {
        const currentTime = new Date().getTime(); // Current time in milliseconds
        const endTime = new Date(candExam.endTime).getTime(); // End time of the exam in milliseconds
      
        const remainingTimeMilliseconds = endTime - currentTime; 
      
        // Format remaining time in milliseconds to 'HH:mm:ss' format
       formattedRemainingTime = await this.formatMilliseconds(remainingTimeMilliseconds);
       
      } 
      return {
        status: 200,
        message: 'remaining time retrieved successfully',
        data: { remainingTime: formattedRemainingTime },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }



 
    async getSectionRemainingTime(
      candidateId: string,
      sectionId: string,
      examId: string,
    ): Promise<ApiResponse> {
      try {
        const progress = await CandidateProgress.findOne({ where: { examId, candidateId } });
        const candidateSection = await CandidateSection.findOne({ where: { sectionId, candidateId } });
        let formattedRemainingTime = "00:00:00";
        console.log("endTime retrieved", candidateSection.endTime)
        if (candidateSection && candidateSection.endTime) {
         
          const currentTime = new Date().getTime(); 
          const endTime = new Date(candidateSection.endTime).getTime(); 
        
          const remainingTimeMilliseconds = endTime - currentTime;
          formattedRemainingTime = await this.formatMilliseconds(remainingTimeMilliseconds);      
        }

        return {
          status: 200,
          message: 'Remaining time retrieved successfully',
          data: { remainingTime: formattedRemainingTime },
          error: false,
        };
      } catch (e) {
        console.log(e);
        return {
          status: 500,
          message: `Internal server error: ${e.message}`,
          error: true,
        };
      }
    }

  
  

  async submitSection(
    candidateId: string,
    examId: string,
    sectionId: string,
    client?: Socket,
  ) {
    console.log("client", client)
    const progress = await this.getCandidateProgress(candidateId, examId);
    if(!progress){
      return {
         status: 400,
         message:"No exam record with this details!",
         error: true
      }
    }
    let sectionIndex = progress.sectionStatus.findIndex(
      (d) => d.sectionId == sectionId,
    );
  
    progress.sectionStatus[sectionIndex].completed = true;
    if(progress.sectionStatus[sectionIndex].endTime===""){
      progress.sectionStatus[sectionIndex].endTime = moment().format('YYYY-MM-DD HH:mm:ss');
    } 
 
    await CandidateProgress.update(
      {
        sectionStatus: progress.sectionStatus,
      },
      { where: { candidateId: candidateId, examId: examId } },
    );
    const exam = await Exam.findByPk(examId);
    const nextSection = progress.sectionStatus[sectionIndex + 1];
    console.log(nextSection);
 
    if (exam.setSectionTimer && !nextSection) {
      await this.submitExam(examId, candidateId);

      let remainingSectionTime = await this.getSectionRemainingTime(
        candidateId,
        sectionId,
        examId
      );
      this.emitToClient(`${candidateId}_${examId}`, 'remaining-section-time', {
        status: 200,
        message: 'remaining time retrieved successfully',
        data: {
          remainingTime: remainingSectionTime.data.remainingTime,
        },
        error: false,
      });
    } else if (nextSection) {
      console.log(nextSection);
      const availableQuestions = progress.questionStatus.filter(
        (p) => p.sectionId == nextSection.sectionId,
      );
      const unAttemptedQuestionsInSection = progress.questionStatus.filter(
        (p) => p.sectionId == nextSection.sectionId && p.attempted == false,
      );
      let responseData = {
        questionNum: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].questionNum
          : 0,
        question: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].question
          : null,
        questionsLeftInSection:
          unAttemptedQuestionsInSection.length > 0
            ? unAttemptedQuestionsInSection.length - 1
            : 0,
        totalQuestionsInSection: availableQuestions
          ? availableQuestions.length
          : 0,
        currentSectionId: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].sectionId
          : sectionId,
        sectionSubmitted: nextSection ? nextSection.completed : false,
        questionSubmitted: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].attempted
          : false,
        firstExamQuestion: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].firstExamQuestion
          : false,
        lastExamQuestion: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].lastExamQuestion
          : false,
        answer: unAttemptedQuestionsInSection[0]
          ? unAttemptedQuestionsInSection[0].response
          : null,
      };
      let [sectionDetails, candidateSection ] = await Promise.all([
        Section.findByPk(nextSection.sectionId),
        CandidateSection.findOne({
          where: { candidateId: candidateId, sectionId: nextSection.sectionId },
        })
      ]);
   
      let sectionTimer =
        candidateSection && candidateSection.timer
          ? candidateSection.timer
          : sectionDetails.timeLimit;
      let duration = await this.convertTimeToMilliseconds(sectionTimer);
      await this.startSectionTimer(
        nextSection.sectionId,
        candidateId,
        duration,
        examId,
        client,
        true,
      );
      // let remainingTime = await this.getSectionRemainingTime(
      //   candidateId,
      //   nextSection.sectionId,
      // );
      let remainingTime = await this.getSectionRemainingTime(
        candidateId,
        nextSection.sectionId,
        examId
      );
      console.log(remainingTime)
      console.log(client);

      this.emitToClient(`${candidateId}_${examId}`, 'question', {
        status: 200,
        message: 'Question retrieved successfully',
        data: responseData,
        error: false,
      });
      this.emitToClient(`${candidateId}_${examId}`, 'remaining-section-time', {
        status: 200,
        message: 'remaining time retrieved successfully',
        data: {
          remainingTime: remainingTime.data.remainingTime,
        },
        error: false,
      });
   
    }
  }


  async startSectionTimer(
    sectionId,
    candidateId,
    sectionTimeLimitInMilliseconds,
    examId: string,
    client?: Socket,
    ignoreExisting?: boolean,
  ) {
    try {
       console.log("inside section timer")
      
      const startTime = new Date().toISOString();
      let endTime = new Date(new Date(startTime).getTime() + sectionTimeLimitInMilliseconds).toISOString();


     // let progress = await this.getCandidateProgress(candidateId, examId);
      let progress = await CandidateProgress.findOne({where: {examId:examId, candidateId:candidateId}});
      const sectionIndex = progress.sectionStatus.findIndex(
        (s) => s.sectionId === sectionId,
      );
      let candidateSection = await CandidateSection.findOne({where: {sectionId:sectionId, candidateId:candidateId}})
      console.log(candidateSection);
      // if(progress && progress.sectionStatus[sectionIndex].startTime =="" && progress.sectionStatus[sectionIndex].endTime==""){
      //   console.log("in")
      //   progress.sectionStatus[sectionIndex].startTime = startTime;
      //   progress.sectionStatus[sectionIndex].endTime = endTime;
     
      // }
    if(candidateSection && (candidateSection.endTime)){
        endTime = candidateSection.endTime
     }
     await CandidateSection.update(
      {
        endTime:endTime
      },
      { where: { candidateId,sectionId } }
    );
      // console.log("startTime",progress.sectionStatus[sectionIndex].startTime)
      // console.log("endTime",progress.sectionStatus[sectionIndex].endTime)
      // console.log(progress.sectionStatus[sectionIndex]);
      // await CandidateProgress.update(
      //   {
      //     sectionStatus: progress.sectionStatus,
      //   },
      //   { where: { candidateId: candidateId, examId: examId } },
      // );

    } catch (error) {
      console.log(`Error in startSectionTimer: ${error}`);
      throw error;
    }
  }
  async populateExamResources(dto: SpecificCandidateExamDto) {
    try {
      const [exam, candidateExam] = await Promise.all([
        Exam.findByPk(dto.examId),
        CandidateExam.findOne({ where: { examId: dto.examId, candidateId: dto.candidateId } }),
      ]);
  
      if (!exam || !candidateExam) {
        return {
          status: 400,
          message: "Invalid examId or candidateId",
          error: true,
        };
      }
  
      const existingProgress = await CandidateProgress.findOne({
        where: { candidateId: dto.candidateId, examId: dto.examId },
      });
  
      if (existingProgress) {
        return {
          status: 200,
          message: "Exam resources retrieved successfully",
          data: existingProgress,
          error: false,
        };
      }
  
      const examSections = await this.getExamSections(exam.id);
      const assignedSubjects = candidateExam.assignedSubjects.toLowerCase();
      const candidatSectionNames = assignedSubjects.split(',').map((sect) => sect.toLowerCase().trim());
      const sectionStatus = [];
      const questionStatus = [];
  
      for (const section of examSections.data) {
        if (!candidatSectionNames.includes(section.subject.toLowerCase().trim())) {
          continue;
        }
  
        sectionStatus.push({
          sectionId: section.id,
          completed: false,
          noOfQuestions: section.noOfQuestions,
          subject: section.subject,
          startTime: '',
          endTime: '',
        });
  
        const sectionQuestions = await this.getSectionQuestionNonPaginated(section.id);
        let preparedQuestions = sectionQuestions.questions;
  
        if (exam.randomizeOverall === true || exam.randomizePerSection === true) {
          preparedQuestions = this.shuffleArray(sectionQuestions.questions);
        }
  
        let questionNum = 1;
  
        for (const q of preparedQuestions) {
          const firstExamQuestion = questionStatus.length === 0;
          const lastExamQuestion = questionNum === preparedQuestions.length;
  
          questionStatus.push({
            questionNum: questionNum++,
            question: {
              id: q.id,
              content: q.content,
              type: q.type,
              options: q.options.map((o)=>({ file:o.file, text:o.text } )),
              embeddedMedia: q.embeddedMedia,
            },
            attempted: false,
            sectionId: section.id,
            response: null,
            firstExamQuestion,
            lastExamQuestion,
            current: false,
            totalQuestionsInSection: preparedQuestions.length,
          });
        }
      }
  
      questionStatus[questionStatus.length - 1].lastExamQuestion = true;
  
      const progress = {
        candidateId: dto.candidateId,
        examId: exam.id,
        currentSectionId: "",
        questionStatus: questionStatus,
        sectionStatus: sectionStatus,
        loginAttempts: 1,
        lastLogin: new Date().toISOString(),
        networkFailures: 0,
      };
  
      await CandidateProgress.create({ ...progress });
  
      return {
        status: 200,
        message: "Exam resources retrieved successfully",
        data: progress,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Error occurred while retrieving exam resource: ${e.message}`,
        error: true,
      };
    }
  }

  async updateResponseInBulk(dto:BulkResponseDto){
     try{
        const [candidateExam, candidateProgress] = await Promise.all([
          CandidateExam.findOne({where:{examId:dto.examId, candidateId:dto.candidateId}}),
          CandidateProgress.findOne({where:{examId:dto.examId, candidateId:dto.candidateId}}),
        ]);
        if(!candidateExam){
          return {
            status: 400,
            message:"Invalid candidateId or examId!",
            error: true
          }
        }

        if(!candidateProgress){
          return {
            status: 400,
            message:"No progress found with this details!",
            error: true
          }
         }
         await CandidateProgress.update({
          currentSectionId:dto.currentSectionId,
          questionStatus: dto.questionStatus,
          sectionStatus:dto.sectionStatus,
          networkFailures:dto.networkFailures
         },{where:{examId:dto.examId, candidateId:dto.candidateId}});
        
         return {
          status: 200,
          message:"Response submitted successfully!",
          error: false
        }
        
     }
     catch(e){
      return {
        status: 500,
        message:`An Error occurred while submitting response: ${e.message}`,
        error: false
      }
     }
  }
  
  async initializeCandidateProgress(
    candidateId,
    sectionId,
    exam,
    client?: Socket,
  ) {
    try {
      const examSections = await this.getExamSections(exam.id);
      const examQuestions = await this.getAllQuestionsForExam(exam.id);
      const candidateExam = await CandidateExam.findOne({
        where: { candidateId: candidateId, examId: exam.id },
      });
      if (!candidateExam) {
        throw 'Invalid canidate exam';
      }
      const candidate = await Candidate.findByPk(candidateId);
      let assignedSubjects = candidateExam.assignedSubjects.toLowerCase();
      let candidatSectionNames = assignedSubjects.split(',').map(sect => sect.toLowerCase().trim());
      let candidateQuestions = await this.getCandidateExamQuestions(
        exam.id,
        candidateId,
        candidatSectionNames,
      );

      const sectionStatus = [];
      const questionStatus = [];
      let preparedSections = examSections.data;
      // if((exam.randomizeOverall === true)){
      //   preparedSections = this.shuffleArray(examSections.data);
      // }
      for (let i = 0; i < preparedSections.length; i++) {
        let section = await Section.findByPk(examSections.data[i].id);
  
        console.log(examSections.data[i].subject.toLowerCase());
        console.log(
          candidatSectionNames.includes(
            examSections.data[i].subject.toLowerCase().trim(),
          ),
        );
        if (
          section &&
          candidatSectionNames.includes(
            examSections.data[i].subject.toLowerCase().trim()
          ) == false
        ) {
          continue;
        }
        sectionStatus.push({
          sectionId: examSections.data[i].id,
          completed: false,
          noOfQuestions: examSections.data[i].noOfQuestions,
          subject: examSections.data[i].subject,
          startTime: '',
          endTime: '',
        });
        let questionNum = 1;
        let sectionQuestions = await this.getSectionQuestionNonPaginated(
          examSections.data[i].id,
        );
        let preparedQuestions = sectionQuestions.questions;
        if (
          exam.randomizeOverall === true ||
          exam.randomizePerSection == true
        ) {
          preparedQuestions = this.shuffleArray(sectionQuestions.questions);
        }

        console.log(preparedQuestions);
        for (let q of preparedQuestions) {
          let firstExamQuestion = false;
          let lastExamQuestion = false;
          if (questionStatus.length == 0) {
            firstExamQuestion = true;
          }

          questionStatus.push({
            questionNum: questionNum++,
            question: {
              id: q.id,
              content: q.content,
              type: q.type,
              options: q.options,
              embeddedMedia: q.embeddedMedia,
            },
            attempted: false,
            sectionId: examSections.data[i].id,
            response: null,
            firstExamQuestion,
            lastExamQuestion,
            current: false,
          });
        }
      }
     
      console.log(sectionStatus);
      questionStatus[questionStatus.length - 1].lastExamQuestion = true;

      const progress = {
        candidateId,
        examId: exam.id,
        currentSectionId: sectionId,
        questionStatus: questionStatus,
        sectionStatus: sectionStatus,
        loginAttempts: 1,
        lastLogin: new Date().toISOString(),
        networkFailures: 0,
      };

      // await this.cacheManager.set(candidateId, progress,0);
      const existingProgress = await CandidateProgress.findOne({
        where: { examId: exam.id, candidateId: candidateId },
      });
      if (!existingProgress) {
        await CandidateProgress.create({ ...progress });
      }
    } catch (e) {
      throw e;
    }
  }

  
  shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    console.log(array);
    return array;
  }

  async updateCandidateProgress(
    candidateId: string,
    questionId: string,
    response: string,
    sectionId: string,
    client,
    networkFailures?: number,
    examId?: string,
  ) {
    try {
      const candidateProgress = await this.getCandidateProgress(
        candidateId,
        examId,
      );

      let updatedQuestionStatus;

      let nextSectionId;
      if (candidateProgress) {
        let submittedQuestion = candidateProgress.questionStatus.find(
          (q) => q.question.id === questionId && q.sectionId === sectionId,
        );

        if (submittedQuestion) {
          submittedQuestion.attempted = true;
          submittedQuestion.response = response;

          // If you want to update the array with the modified object, find its index and replace it.
          const index = candidateProgress.questionStatus.findIndex(
            (q) => q.question.id === questionId && q.sectionId === sectionId,
          );

          candidateProgress.questionStatus[index] = submittedQuestion;
          candidateProgress.questionStatus[index].current = false;
          updatedQuestionStatus = candidateProgress.questionStatus;
        }
        // let existingSectionTime = await this.getSectionRemainingTime(
        //   candidateId,
        //   sectionId,
        // );
         let existingSectionTime = await this.getSectionRemainingTime(
          candidateId,
          sectionId,
          examId
        );
        const exam = await Exam.findByPk(examId);
        if (
          exam.setSectionTimer &&
          existingSectionTime &&
          existingSectionTime.data.remainingSectionTime === '00:00:00'
        ) {
          let sectionStatusIndex = candidateProgress.sectionStatus.findIndex(
            (s) => s.sectionId === sectionId,
          );
          candidateProgress.sectionStatus[sectionStatusIndex].completed = true;
          candidateProgress.sectionStatus[sectionStatusIndex].endTime =
            moment().format('YYYY-MM-DD HH:mm:ss');
        }

        await CandidateProgress.update(
          {
            questionStatus: candidateProgress.questionStatus,
            sectionStatus: candidateProgress.sectionStatus,
            currentSectionId: sectionId,
            networkFailures: candidateProgress.networkFailures,
            loginAttempts: candidateProgress.loginAttempts,
          },
          { where: { candidateId: candidateId, examId: examId } },
        );

        // Check if all questions in the current section have been attempted
        const sectionQuestions = candidateProgress.questionStatus.filter(
          (s) => s.sectionId === sectionId,
        );

        if (sectionQuestions) {
          const attemptedInSection = candidateProgress.questionStatus.filter(
            (status) =>
              status.sectionId === sectionId && status.attempted === true,
          );
          console.log('attempted in section', attemptedInSection.length);
          if (sectionQuestions.length === attemptedInSection.length) {
            const currentSectionIndex =
              candidateProgress.sectionStatus.findIndex(
                (s) => s.sectionId === sectionId,
              );
            const nextSectionIndex = currentSectionIndex + 1;

            candidateProgress.sectionStatus[currentSectionIndex].completed =
              true;
            if(candidateProgress.sectionStatus[currentSectionIndex].endTime===""){
              candidateProgress.sectionStatus[currentSectionIndex].endTime = moment().format('YYYY-MM-DD HH:mm:ss');
            } 
            console.log('set endTime ', new Date().toISOString());
            let updatedSectionStatus = candidateProgress.sectionStatus;

            if (nextSectionIndex < candidateProgress.sectionStatus.length) {
              // Set the next section as the currentSection
              nextSectionId =
                candidateProgress.sectionStatus[nextSectionIndex].sectionId;
              candidateProgress.currentSectionId = nextSectionId;
              let sect = await Section.findByPk(nextSectionId);
              if (sect && sect.timeLimit) {
                let candidateSection = await CandidateSection.findOne({
                  where: { sectionId: sect.id, candidateId: candidateId },
                });
                let sectionTimer =
                  candidateSection && candidateSection.timer
                    ? candidateSection.timer
                    : sect.timeLimit;
                let time = await this.convertTimeToMilliseconds(sectionTimer);
                if (time) {
                  await this.startSectionTimer(
                    nextSectionId,
                    candidateId,
                    time,
                    examId,
                    client,
                  );
                }
              }
            }

            // Save the updated progress
            //await this.cacheManager.set(candidateId, updatedCandidateProgress,0);
            console.log(candidateProgress.currentSectionId);
            await CandidateProgress.update(
              {
                questionStatus: updatedQuestionStatus,
                sectionStatus: updatedSectionStatus,
                currentSectionId: nextSectionId,
                networkFailures: candidateProgress.networkFailures,
                loginAttempts: candidateProgress.loginAttempts,
              },
              { where: { candidateId: candidateId, examId: examId } },
            );
          }
        }
      }
    } catch (e) {
      throw e;
    }
  }

  private convertTimeToMilliseconds(timeValue) {
    const [hours, minutes, seconds] = timeValue.split(':').map(Number);
    const totalMilliseconds =
      hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
    return totalMilliseconds;
  }

  async getCandidateProgress(
    candidateId: string,
    examId?: string,
  ): Promise<CandidateProgress> {
    return await CandidateProgress.findOne({
      where: { candidateId: candidateId, examId: examId },
    });
  }

  async createLocalAdmin(
    currentUser,
    createAdminDto: AddLocalAdminDto,
  ): Promise<ApiResponse> {
    try {
      const { email, firstName, lastName, centerId, examId } = createAdminDto;
      const examCenter = await ExamCenter.findOne({
        where: {
          centerId: centerId,
          examId: examId,
        },
      });
      if (!examCenter) {
        return {
          status: 400,
          message: 'Invalid ExamId or CenterId',
          error: true,
        };
      }

      const existingUser = await User.findOne({ where: { email: email } });
      if (existingUser) {
        const existingAdmin = await ExamCenter.findOne({
          where: {
            examId: examId,
            centerId: centerId,
            adminId: existingUser.id,
          },
        });
        if (existingAdmin) {
          return {
            status: 400,
            message: 'Admin has already been added for this center',
            error: true,
          };
        } else {
          await ExamCenter.update(
            {
              adminId: existingUser.id,
            },
            { where: { id: examCenter.id } },
          );
          // await Center.update({
          //   adminId: newUser.id
          // },{where:{id:centerId}});
          const html = `Hello ${firstName}, An  existing account was found. please, proceed to login with your existing details`;
          // await this.emailService.sendEmailSendgrid(
          //   html,
          //   email,
          //   'Account Creation',
          // );
          await this.emailService.sendEmail(
            email,
            'Account Creation',
            html
          );
          await AuditLog.create({
            action: `Created Local Admin:${email}`,
            userId: currentUser.sub,
          });
          return {
            status: 200,
            message: 'Local admin Created Successfully',
            error: false,
          };
        }
      }

      let username = await this.generateUsernameForLocalAdmin(
        createAdminDto.firstName,
      );
      let password = await this.generatePasswordForLocalAdmin();
      const hashedPassword = await hash(password, 10);

      let role = await Role.findOne({ where: { name: 'local-admin' } });
      if (!role) {
        role = await Role.create({ name: 'local-admin' });
      }

      const newUser = await User.create({
        email,
        firstName,
        lastName,
        username,
        password: hashedPassword,
        roleId: role.id,
        isActive: true,
      });

      const center = await Center.findByPk(createAdminDto.centerId);
      if (!center) {
        return {
          status: 400,
          message: 'center not found',
        };
      }
      await ExamCenter.update(
        {
          adminId: newUser.id,
        },
        { where: { id: examCenter.id } },
      );
      await Center.update(
        {
          adminId: newUser.id,
        },
        { where: { id: centerId } },
      );
      const body = `Hello,${firstName},\n An Account has been created for you with the following details: username:${username}  password:${password}`;
      // await this.emailService.sendEmailSendgrid(
      //   html,
      //   email,
      //   'Account Creation',
      // );
      await this.emailService.sendEmail(
        email,
        'Account Creation',
        body,
      );
      await AuditLog.create({
        action: `Created Local Admin:${email}`,
        userId: currentUser.sub,
      });
      return {
        status: 200,
        message: 'Local admin Created Successfully',
        error: false,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async localAdminLogin(loginDto: LocalAdminLoginDto): Promise<ApiResponse> {
    try {
      const admin = await User.findOne({
        where: { username: loginDto.username },
      });
      if (!admin || !(await compare(loginDto.password, admin.password))) {
        return {
          status: 400,
          message: 'Invalid username/password',
          error: true,
        };
      }

      const center = await Center.findOne({ where: { adminId: admin.id } });
      if (!center) {
        return {
          status: 400,
          message: 'Admin not assigned to center',
          error: true,
        };
      }
      let role = await Role.findOne({ where: { name: 'local-admin' } });
      let rolePermissions = await RolePermission.findAll({
        where: { roleId: role.id },
      });
      let userPermissions = [];
      for (let p of rolePermissions) {
        let priviledge = await Permission.findOne({
          where: { id: p.permissionId },
        });
        userPermissions.push(priviledge.name);
      }

      const accessToken = this.generateJwtTokenForAdmin(admin, userPermissions);
      const refreshToken = this.generateRefreshToken(admin);
      return {
        status: 200,
        message: 'login successful!',
        data: {
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          username: admin.username,
          adminId: admin.id,
          centerId: center.id,
          centerName: center.name,
          centerLocation: center.location,
          role: 'local-admin',
          isActive: true,
          accessToken: accessToken,
          refreshToken: refreshToken,
          priviledges: userPermissions,
        },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: `An error occured :${err.message}`,
        error: true,
      };
    }
  }

  async resizeBase64Image(base64Image, width, height) {
    try {
      // console.log(base64Image)
      // Read the base64 image
      const image = await Jimp.read(base64Image);

      // Resize the image
      image.resize(width, height);

      // Convert the image back to base64
      const resizedBase64Image = await image.getBase64Async(Jimp.AUTO);

      return resizedBase64Image;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  }

  async getLocalAdmin(adminId: string): Promise<ApiResponse> {
    try {
      const admin = await User.findByPk(adminId);
      if (!admin) {
        return {
          status: 400,
          message: 'Invalid admin id',
          error: true,
        };
      }
      const center = await Center.findOne({ where: { adminId: adminId } });
      if (!center) {
        return {
          status: 400,
          message: "This admin isn't assigned to center",
          error: true,
        };
      }

      return {
        status: 200,
        message: 'Local admin details retrieved successfully',
        data: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          username: admin.username,
          createdAt: admin.createdAt,
          centerName: center.name,
          centerId: center.id,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error:${e.message}`,
        error: true,
      };
    }
  }

  async getCenterExams(currentUser, centerId: string) {
    try {
      const center = await Center.findByPk(centerId);
      if (!center) {
        return { status: 400, message: 'Invalid center id', error: true };
      }
      const examIds = await ExamCenter.findAll({
        where: { centerId: centerId, adminId: currentUser.sub },
      });
      let exams = [];

      for (let ec of examIds) {
        let exam = await Exam.findByPk(ec.examId);
        let sections = await Section.findAll({
          where: { examId: ec.examId },
          include: [
            {
              model: Item,
              include: [{ model: Question }],
            },
          ],
        });
        let examItems = await ExamItem.findAll({ where: { examId: exam.id } });
        let questions = [];
        for (let e of examItems) {
          let itemQuestions = await Question.findAll({
            where: { itemId: e.itemId },
          });
          questions.push(...itemQuestions);
        }
        exams.push({
          exam,
          isDownloaded: ec.isDownloaded,
          isSynced: ec.isSynced,
          noOfSections: sections.length,
          noOfQuestions: questions.length,
        });
      }

      return {
        status: 200,
        message: 'Center Exams retrieved successfully',
        data: {
          centerExams: exams,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async getAllLocalExams() {
    try {
      const now = new Date();
      const exams = await Exam.findAll({
        where: {
          endTime: {
            [Op.gt]: now
          }
        }
      });
      let newExams = [];
      for(let exam of exams){
        let sections = await Section.findAll({where:{examId:exam.id}});
        let noOfQuestions = 0;
        for(let section of sections){
           let chosenQuestions  = await this.getSectionQuestionNonPaginated(section.id);
           noOfQuestions += chosenQuestions.questions.length;
        }
        newExams.push({
          ...exam.dataValues,
          noOfSections:sections.length,
          noOfQuestions:noOfQuestions
        })
      
      }
      return {
        status: 200,
        message: 'LocalExams retrieved successfully',
        data: {
          exams:newExams
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  // async getCandidateExams(user, candidateId: string) {
  //   try {
  //     const examIds = await CandidateExam.findAll({
  //       where: { candidateId: candidateId },
  //     });
  //     const exams = [];

  //     for (let ec of examIds) {
  //       let exam = await Exam.findByPk(ec.examId);
  //       console.log(user);
  //       if (user.roles[0] == 'candidate') {
  //         if (exam.deliveryMode == 'online' && this.appInstance == 'local') {
  //           continue;
  //         } else if (
  //           exam.deliveryMode == 'on-premise' &&
  //           this.appInstance == 'online'
  //         ) {
  //           continue;
  //         }
  //       }
  //       let AllSections = await this.getExamSections(ec.examId);
  //       //let AllSections = await Section.findAll({where:{examId:ec.examId}})
  //       let assignedSubjects = ec.assignedSubjects
  //         ? ec.assignedSubjects.toLowerCase()
  //         : '';
  //         let candidatSectionNames = assignedSubjects
  //         .split(',')
  //         .map(section => section.toLowerCase().trim());
  //       let Sections = AllSections.data.filter((s) => {
  //         return candidatSectionNames.includes(s.subject.toLowerCase());
  //       });
  //       let items = await this.getExamItems(ec.examId);
  //       let noOfQuestions = 0;
  //       for (let s of items.data) {
  //         let questions = await Question.findAll({ where: { itemId: s.id } });
  //         noOfQuestions += questions.length;
  //       }
  //       let center;
  //       if (ec.centerId) {
  //         center = await Center.findByPk(ec.centerId);
  //       }

   
  //       let noOfChosenOfQuestions = 0;
  //       for(let section of Sections){
  //         let chosenQuestions  = await this.getSectionQuestionNonPaginated(section.id);
  //         noOfChosenOfQuestions += chosenQuestions.questions.length;
  //       }
  //       console.log("noOfChosen", noOfChosenOfQuestions);
  //       exams.push({
  //         ...exam.dataValues,
  //         noOfQuestions: noOfChosenOfQuestions,
  //         noOfSections: Sections.length,
  //         isSubmitted: ec.isSubmitted,
  //         candidateStartTime: ec.startTime,
  //         candidateEndTime: ec.endTime,
  //         candidateFace: ec.faceCaptured,
  //         centerName: center ? center.name : '',
  //         centerLocation: center ? center.location : ' ',
  //       });
  //     }

  //     return {
  //       status: 200,
  //       message: 'Candidate Exams retrieved successfully',
  //       data: {
  //         candidateExams: exams,
  //         serverTime: this.getCurrentTimeInWAT(),
  //       },
  //       error: false,
  //     };
  //   } catch (e) {
  //     return {
  //       status: 500,
  //       message: `Internal server error: ${e.message}`,
  //       error: true,
  //     };
  //   }
  // }
  async getCandidateExams(user, candidateId: string) {
    try {
      const examIds = await CandidateExam.findAll({
        where: { candidateId },
      });
  
      const exams = [];
  
      for (const ec of examIds) {
        const exam = await Exam.findByPk(ec.examId);
  
        if (!exam) {
          continue; 
        }
  
        if (user.roles[0] === 'candidate') {
          if (
            (exam.deliveryMode === 'online' && this.appInstance === 'local') ||
            (exam.deliveryMode === 'on-premise' && this.appInstance === 'online')
          ) {
            continue; // Skip if delivery mode and app instance mismatch
          }
        }
        let center;
        if (ec.centerId) {
          center = await Center.findByPk(ec.centerId);
        }
  
        const AllSections = await this.getExamSections(ec.examId);
        const assignedSubjects = ec.assignedSubjects
          ? ec.assignedSubjects.toLowerCase()
          : '';
        const candidatSectionNames = assignedSubjects
          .split(',')
          .map(section => section.toLowerCase().trim());
    
        const Sections = AllSections.data.filter(s =>
          candidatSectionNames.includes(s.subject.toLowerCase())
        );
  
        let noOfChosenOfQuestions = 0;
        for (const section of Sections) {
          const chosenQuestions = await this.getSectionQuestionNonPaginated(section.id);
          noOfChosenOfQuestions += chosenQuestions.questions.length;
        }
  
        exams.push({
          ...exam.dataValues,
          noOfQuestions: noOfChosenOfQuestions,
          noOfSections: Sections.length,
          isSubmitted: ec.isSubmitted,
          candidateStartTime: ec.startTime,
          candidateEndTime: ec.endTime,
          candidateFace: ec.faceCaptured,
          centerName: ec.centerId ? center?.name : '',
          centerLocation: ec.centerId ? center?.location : '',
        });
      }
  
      return {
        status: 200,
        message: 'Candidate Exams retrieved successfully',
        data: {
          candidateExams: exams,
          serverTime: this.getCurrentTimeInWAT(),
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }
  
  async getSpecificCandidateExam(dto: SpecificCandidateExamDto) {
    try {
    
      const [existingCandidateExam, exam, candidate] = await Promise.all([
        CandidateExam.findOne({ where: { candidateId: dto.candidateId, examId: dto.examId } }),
        Exam.findByPk(dto.examId),
        Candidate.findByPk(dto.candidateId),
      ]);
      const details = [];

      if (!exam || !candidate || !existingCandidateExam) {
        return {
          status: 400,
          message: 'Invalid ExamId or candidateId',
          error: true,
        };
      }
      let AllSections = await this.getExamSections(dto.examId);
      //let AllSections = await Section.findAll({where:{examId:dto.examId}})
      let assignedSubjects =
        existingCandidateExam.assignedSubjects;
        let candidatSectionNames = assignedSubjects
        .split(',')
        .map(section => section.toLowerCase().trim());
 
      let Sections = AllSections.data.filter((s) => {
        return candidatSectionNames.includes(s.subject.toLowerCase().trim());
      });
      let progress = await this.getCandidateProgress(
        dto.candidateId,
        dto.examId,
      );

      let sectionWithStatuses = [];
      for (let s of Sections) {
        let isSubmitted = false;
        if (progress) {
          let section = progress.sectionStatus.find(
            (sect) => sect.sectionId == s.id,
          );
          if (section && section.completed == true) {
            isSubmitted = true;
          }
        }
        let questions = await this.getSectionQuestionNonPaginated(s.id);
        let noOfQuestions = questions.questions.length;
        sectionWithStatuses.push({
          ...s,
          noOfQuestions,
          isSubmitted: isSubmitted,
        });
      }
      details.push({
        exam: exam.dataValues,
        sections: sectionWithStatuses,
        candidate: candidate.dataValues,
        isSubmitted: existingCandidateExam.isSubmitted,
        faceCaptured: existingCandidateExam.faceCaptured,
      });
    
      if(exam && exam.setSectionTimer && progress){
         let progressSections = progress.sectionStatus;
         for(let sect of progressSections){
           if(!(sect.completed) && (sect.endTime!=='')){
            const endTime = new Date(sect.endTime).getTime();
            const currentTime = new Date().getTime();
            if(currentTime >  endTime){
              let index = progressSections.findIndex((s) => s.sectionId ==  sect.sectionId);
              progressSections[index].completed = true
            }
           }
         }
         await CandidateProgress.update({sectionStatus: progressSections},{where:{examId:dto.examId, candidateId:dto.candidateId}});

      }

      return {
        status: 200,
        message: 'Candidate Exam retrieved successfully',
        data: {
          candidateExams: details,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }
 
  

  async getAllOnlineExams(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    filter,
    searchValue,
  ) {
    try {
      const offset = (page - 1) * limit;
      let { rows, count } = await Exam.findAndCountAll({
        where: { deliveryMode: 'online' },
        limit: Number(limit),
        offset: offset,
        order: [['createdAt', 'DESC']],
      });

      let results = [];
      for (let exam of rows) {
        const candidates = await CandidateExam.findAll({
          where: { examId: exam.id },
        });
        results.push({
          ...exam.dataValues,
          noOfCandidates: candidates.length,
        });
      }

      if (filter && searchValue) {
        let filteredResult = await this.searchExams(
          filter,
          searchValue,
          results,
        );
        count = filteredResult.length;
        results = filteredResult;
      }
      if (sortBy) {
        results = await this.sortResults(results, sortBy);
      }

      return {
        status: 200,
        message: 'Online exams retrieved successfully',
        error: false,
        data: results,
        pageInfo: {
          totalItems: results.length,
          totalPages: Math.ceil(results.length / limit),
          currentPage: page,
        },
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async getAnsweredQuestions(dto: SpecificCandidateExamDto) {
    try {
      const exam = await Exam.findByPk(dto.examId);
      const candidate = await Candidate.findByPk(dto.candidateId);
      const candidateExam = await CandidateExam.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      const progress = await CandidateProgress.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      const grade = await Grade.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      if (!exam || !candidate || !candidateExam) {
        return {
          status: 400,
          message: 'Invalid candidate Id  or examId',
          error: true,
        };
      }

      if (!progress) {
        return {
          status: 400,
          message: 'Candidates result not found',
          error: true,
        };
      }
      const sectionStat = await this.getCandidateSectionStatistics(
        dto.examId,
        dto.candidateId,
        grade,
      );
      
      // Fetch violations for this candidate and exam
      const violations = await Violation.findAll({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      
      let questions = [];
      for (let s of progress.questionStatus) {
        questions.push(s);
      }

      return {
        status: 200,
        message: 'Questions retrieved successfully',
        data: {
          ...candidate.dataValues,
          questions,
          sections: sectionStat,
          // New fields for enhanced transcript - using distinct names to avoid conflicts
          faceCaptured: candidateExam.faceCaptured,
          examStartTime: candidateExam.startTime,
          examEndTime: candidateExam.endTime,
          violations: violations.map(v => ({
            violationType: v.violationType,
            violationReason: v.violationReason,
            timestamp: v.createdAt,
          })),
        },
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async getCandidateProgressQuestionIds(dto: SpecificCandidateExamDto) {
    try {
      const exam = await Exam.findByPk(dto.examId);
      const candidate = await Candidate.findByPk(dto.candidateId);
      const candidateExam = await CandidateExam.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      const progress = await CandidateProgress.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      const grade = await Grade.findOne({
        where: { examId: dto.examId, candidateId: dto.candidateId },
      });
      if (!exam || !candidate || !candidateExam) {
        return {
          status: 400,
          message: 'Invalid candidate Id  or examId',
          error: true,
        };
      }

      if (!progress) {
        return {
          status: 400,
          message: 'Candidates result not found',
          error: true,
        };
      }

      let questions = [];
      for (let s of progress.questionStatus) {
        questions.push({
          questionId: s.question.id,
          sectionId: s.sectionId,
          questionNum: s.questionNum,
          attempted: s.attempted,
          answer: s.response,
        });
      }

      return {
        status: 200,
        message: 'QuestionIds  retrieved successfully',
        data: {
          username: candidate.dataValues.username,
          email: candidate.dataValues.email,
          id: candidate.dataValues.id,
          questions,
        },
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async updateExamNotificationSettings(
    examId: string,
    dto: SetExamNotificationSettingsDto,
  ) {
    try {
      console.log(examId);
      const exam = await Exam.findByPk(examId);
      console.log(exam);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      await Exam.update(
        { notificationSettings: dto },
        { where: { id: examId } },
      );
      return {
        status: 200,
        message: 'Exam notification seettings updated successfully',
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `Internal server error: ${e.message}`,
        error: true,
      };
    }
  }

  async scheduleExamReminders(examId: string) {}
  async getAllOnPremiseExams(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    filter,
    searchValue,
  ) {
    try {
      const offset = (page - 1) * limit;
      let { rows, count } = await Exam.findAndCountAll({
        where: { deliveryMode: 'on-premise' },
        limit: Number(limit),
        offset: offset,
        order: [['createdAt', 'DESC']],
      });

      let results = [];
      for (let exam of rows) {
        const candidates = await CandidateExam.findAll({
          where: { examId: exam.id },
        });
        results.push({
          ...exam.dataValues,
          noOfCandidates: candidates.length,
        });
      }

      if (filter && searchValue) {
        let filteredResult = await this.searchExams(
          filter,
          searchValue,
          results,
        );
        count = filteredResult.length;
        results = filteredResult;
      }
      if (sortBy) {
        results = await this.sortResults(results, sortBy);
      }

      return {
        status: 200,
        message: 'On-premise exams retrieved successfully',
        error: false,
        data: results,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async examMonitoringStat(examId: string) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }
      const Candidates = await CandidateExam.findAll({
        where: { examId: examId },
      });
      let today = moment();
      let candidatesWhoStarted = Candidates.filter((c) => {
        return (
          c.startTime !== null&&
          today.isAfter(moment(exam.startTime))
        );
      });
      let loginAttempts = 0;
      let networkFailures = 0;

      for (let person of Candidates) {
        let progress = await this.getCandidateProgress(
          person.candidateId,
          examId,
        );
        if (progress) {
          loginAttempts += progress.loginAttempts;
          networkFailures += progress.networkFailures;
        }
      }

      return {
        status: 200,
        message: 'Exam monitoring statistics retrieved successfully',
        data: {
          loginAttempts,
          networkFailures,
          noOfCandidates: Candidates.length,
          candidatesWhoStarted: candidatesWhoStarted.length || 0,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'Exam monitoring statistics retrieved successfully',
        error: true,
      };
    }
  }

  /**
   * Get submission statistics for an exam - breakdown by submission type
   */
  async getSubmissionStatistics(examId: string): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidates = await CandidateExam.findAll({
        where: { examId: examId, isSubmitted: true },
      });

      // Initialize counters for each submission type
      const submissionStats = {
        total: candidates.length,
        manual: 0,
        timeout: 0,
        inactivity: 0,
        fullscreen: 0,
        window_exit: 0,
        app_switching: 0,
        violation: 0,
        other: 0,
      };

      // Count submissions by type
      for (const candidate of candidates) {
        const type = candidate.submissionType?.toLowerCase();
        
        switch (type) {
          case 'manual':
            submissionStats.manual++;
            break;
          case 'timeout':
          case 'time_elapsed':
            submissionStats.timeout++;
            break;
          case 'inactivity':
          case 'inactive':
            submissionStats.inactivity++;
            break;
          case 'fullscreen':
          case 'fullscreen_exit':
            submissionStats.fullscreen++;
            break;
          case 'window_exit':
          case 'window_exit_attempt':
            submissionStats.window_exit++;
            break;
          case 'app_switching':
          case 'tab_switch':
            submissionStats.app_switching++;
            break;
          case 'violation':
            submissionStats.violation++;
            break;
          default:
            // For any other type or null/undefined
            if (!type || type === 'null' || type === 'undefined') {
              // If no submission type recorded, count as manual
              submissionStats.manual++;
            } else {
              submissionStats.other++;
            }
        }
      }

      // Calculate percentages
      const total = submissionStats.total;
      const statsWithPercentage = {
        ...submissionStats,
        manualPercentage: total > 0 ? ((submissionStats.manual / total) * 100).toFixed(1) : 0,
        timeoutPercentage: total > 0 ? ((submissionStats.timeout / total) * 100).toFixed(1) : 0,
        inactivityPercentage: total > 0 ? ((submissionStats.inactivity / total) * 100).toFixed(1) : 0,
        fullscreenPercentage: total > 0 ? ((submissionStats.fullscreen / total) * 100).toFixed(1) : 0,
        windowExitPercentage: total > 0 ? ((submissionStats.window_exit / total) * 100).toFixed(1) : 0,
        appSwitchingPercentage: total > 0 ? ((submissionStats.app_switching / total) * 100).toFixed(1) : 0,
        violationPercentage: total > 0 ? ((submissionStats.violation / total) * 100).toFixed(1) : 0,
        otherPercentage: total > 0 ? ((submissionStats.other / total) * 100).toFixed(1) : 0,
      };

      return {
        status: 200,
        message: 'Submission statistics retrieved successfully',
        data: statsWithPercentage,
        error: false,
      };
    } catch (e) {
      console.error('Error getting submission statistics:', e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  /**
   * Get candidates who violated exam rules (attempted to leave fullscreen, etc.)
   */
  async getViolationCandidates(examId: string): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      // Get all submitted candidates with non-manual submission types (violations)
      const candidates = await CandidateExam.findAll({
        where: {
          examId: examId,
          isSubmitted: true,
        },
        include: [Candidate],
      });

      // Filter to get only actual violations (not timeout/manual)
      const violations = candidates.filter(c => {
        const type = c.submissionType?.toLowerCase();
        return type && 
               type !== 'manual' && 
               type !== 'timeout' && 
               type !== 'time_elapsed';
      });

      // Get violation details for each candidate
      const violationCandidates = [];
      
      for (const candidate of violations) {
        const progress = await this.getCandidateProgress(
          candidate.candidateId,
          examId,
        );

        const attemptedQuestions = progress?.questionStatus?.filter(
          q => q.attempted === true
        ).length || 0;
        
        const totalQuestions = progress?.questionStatus?.length || 0;

        violationCandidates.push({
          id: candidate.id,
          candidateId: candidate.candidateId,
          username: candidate.candidate?.username || 'Unknown',
          email: candidate.candidate?.email || '',
          submissionType: candidate.submissionType,
          submissionReason: candidate.submissionReason,
          submittedAt: candidate.updatedAt || candidate.endTime,
          attemptedQuestions,
          totalQuestions,
          progressPercentage: totalQuestions > 0 
            ? ((attemptedQuestions / totalQuestions) * 100).toFixed(1) 
            : 0,
        });
      }

      // Sort by submission date (most recent first)
      violationCandidates.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      return {
        status: 200,
        message: 'Violation candidates retrieved successfully',
        data: {
          count: violationCandidates.length,
          violations: violationCandidates,
        },
        error: false,
      };
    } catch (e) {
      console.error('Error getting violation candidates:', e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  /**
   * Get all candidates with their submission details for analysis report
   */
  async getCandidatesSubmissionDetails(examId: string): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      // Get all candidates registered for this exam
      const candidates = await CandidateExam.findAll({
        where: { examId: examId },
        include: [Candidate],
      });

      // Get detailed submission info for each candidate
      const candidateDetails = [];

      for (const candidate of candidates) {
        const progress = await this.getCandidateProgress(
          candidate.candidateId,
          examId,
        );

        const attemptedQuestions = progress?.questionStatus?.filter(
          q => q.attempted === true
        ).length || 0;

        const totalQuestions = progress?.questionStatus?.length || 0;

        // Get grade info if submitted
        let gradeInfo = null;
        if (candidate.isSubmitted) {
          const grade = await Grade.findOne({
            where: {
              candidateId: candidate.candidateId,
              examId: examId,
            },
          });
          
          if (grade) {
            gradeInfo = {
              nonEssayGrade: grade.nonEssayGrade,
              essayGrade: grade.essayGrade,
              totalNoOfQuestion: grade.totalNoOfQuestion,
              noOfAttemptedQuestions: grade.noOfAttemptedQuestions,
            };
          }
        }

        candidateDetails.push({
          id: candidate.id,
          candidateId: candidate.candidateId,
          username: candidate.candidate?.username || 'Unknown',
          email: candidate.candidate?.email || '',
          isSubmitted: candidate.isSubmitted,
          isLoggedIn: candidate.isLoggedIn,
          submissionType: candidate.submissionType,
          submissionReason: candidate.submissionReason,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          attemptedQuestions,
          totalQuestions,
          progressPercentage: totalQuestions > 0
            ? ((attemptedQuestions / totalQuestions) * 100).toFixed(1)
            : 0,
          gradeInfo,
        });
      }

      // Sort by submission status (submitted first), then by end time
      candidateDetails.sort((a, b) => {
        if (a.isSubmitted && !b.isSubmitted) return -1;
        if (!a.isSubmitted && b.isSubmitted) return 1;
        if (a.endTime && b.endTime) {
          return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
        }
        return 0;
      });

      return {
        status: 200,
        message: 'Candidates submission details retrieved successfully',
        data: {
          totalCandidates: candidateDetails.length,
          submitted: candidateDetails.filter(c => c.isSubmitted).length,
          inProgress: candidateDetails.filter(c => !c.isSubmitted && c.attemptedQuestions > 0).length,
          notStarted: candidateDetails.filter(c => !c.isSubmitted && c.attemptedQuestions === 0).length,
          candidates: candidateDetails,
        },
        error: false,
      };
    } catch (e) {
      console.error('Error getting candidates submission details:', e);
      return {
        status: 500,
        message: `Internal Server Error: ${e.message}`,
        error: true,
      };
    }
  }

  async examReportDashboard(examId: string) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }
      const examSections = await this.getExamSections(examId);
      const Candidates = await CandidateExam.findAll({
        where: { examId: examId },
      });
      let today = moment();
      let loginAttempts = 0;
      let networkFailures = 0;
      let totalDuration = 0;
      let totalEndTime = 0;

      let candidatesWhoStarted = Candidates.filter((c) => {
        return c.startTime !== null && today.isAfter(moment(exam.startTime));
      });
      let submissions = Candidates.filter((c) => {
        return c.isSubmitted === true;
      });

      for (let person of Candidates) {
        let progress = await this.getCandidateProgress(
          person.candidateId,
          examId,
        );
        const startTime = moment(person.startTime, 'YYYY-MM-DD HH:mm:ss');
        const endTime = moment(person.endTime, 'YYYY-MM-DD HH:mm:ss');

        const durationInSeconds = endTime.diff(startTime, 'seconds');
        totalDuration += durationInSeconds;

        const endTimeInSeconds = endTime.unix();
        totalEndTime += endTimeInSeconds;
        if (progress) {
          loginAttempts += progress.loginAttempts;
          networkFailures += progress.networkFailures;
        }
      }
      const averageDurationInSeconds = totalDuration / Candidates.length;
      // Format the average duration in "HH:mm:ss" format
      const averageDurationFormatted = moment
        .utc()
        .startOf('day')
        .seconds(averageDurationInSeconds)
        .format('HH:mm:ss');

      const averageEndTimeInSeconds = totalEndTime / Candidates.length;
      const averageEndTimeFormatted = moment
        .unix(averageEndTimeInSeconds)
        .format('YYYY-MM-DD HH:mm:ss');

      return {
        status: 200,
        message: 'Exam Report statistics retrieved successfully',
        data: {
          examType: exam.type,
          examLocation: exam.deliveryMode,
          started: exam.startTime,
          ended: exam.endTime,
          loginAttempts,
          networkFailures,
          noOfCandidates: Candidates.length,
          candidatesWhoStarted: candidatesWhoStarted.length || 0,
          submittedCandidates: submissions.length || 0,
          averageDuration: averageDurationFormatted,
          totalSections: examSections.data ? examSections.data.length : 0,
          averageEndTime: averageEndTimeFormatted,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: 'Exam monitoring statistics retrieved successfully',
        error: true,
      };
    }
  }

  async getCandidateSectionStatistics(examId, candidateId, grade) {
    const progress = await CandidateProgress.findOne({
      where: { examId: examId, candidateId: candidateId },
    });

    if (!progress) {
      return [];
    }

    let sectionStat = [];

    for (const section of progress.sectionStatus) {
      // if (!section.startTime) {
      //   continue;
      // }

      const sectionStart = moment(section.startTime, 'YYYY-MM-DD HH:mm:ss');
      const sectionEnded = moment(section.endTime, 'YYYY-MM-DD HH:mm:ss');
      const durationInSeconds = sectionEnded.diff(sectionStart, 'seconds');
      const sectionDuration = moment
        .utc()
        .startOf('day')
        .seconds(durationInSeconds)
        .format('HH:mm:ss');

      const sectionGrade = grade
        ? grade.sectionGrades.find((g) => g.sectionId === section.sectionId)
        : null;

      let candidateScore = 0;
      let obtainableScore = 0;
      let noOfQuestions = 0;
      let questionsAnswered = 0;
      let questionsUnanswered = 0;

      if (sectionGrade) {
        candidateScore = sectionGrade.candidateScore;
        obtainableScore = sectionGrade.totalObtainableScore;
        noOfQuestions = sectionGrade.totalQuestions || 0;
        if (sectionGrade.essayResponses.length > 0) {
          //  obtainableScore += Number(sectionGrade.essayResponses.reduce((total, section) => total + section.obtainableScore, 0));
          let essayScore = Number(
            sectionGrade.essayResponses.reduce(
              (total, section) => total + Number(section.score),
              0,
            ),
          );
          if (!isNaN(essayScore)) {
            candidateScore += essayScore;
          }
        }
      }

      if (progress.questionStatus) {
        questionsAnswered = progress.questionStatus.filter(
          (q) => q.sectionId === section.sectionId && q.attempted === true,
        ).length;
        questionsUnanswered = progress.questionStatus.filter(
          (q) => q.sectionId === section.sectionId && q.attempted === false,
        ).length;
      }

      console.log(sectionGrade);
      sectionStat.push({
        course: sectionGrade ? sectionGrade.subject : 'N/A',
        started: sectionStart,
        submitted: sectionEnded,
        duration: sectionDuration,
        score: sectionGrade
          ? `${Number(sectionGrade.correctAnswers)}/${Number(noOfQuestions)}`
          : 'N/A',
        noOfQuestions: noOfQuestions,
        questionsAnswered: questionsAnswered,
        questionsUnanswered: questionsUnanswered,
      });
    }

    return sectionStat;
  }
  async getAllCandidatesExamReports(
    examId,
    page = 1,
    pageSize = 10,
    filter,
    searchValue,
    sortBy,
  ) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidates = await Grade.findAll({
        where: { examId: examId },
        offset: (page - 1) * pageSize,
        limit: Number(pageSize),
      });

      let candidateData = [];

      for (const candidate of candidates) {
        const profile = await Candidate.findByPk(candidate.candidateId);
        const candExam = await CandidateExam.findOne({
          where: {
            examId: candidate.examId,
            candidateId: candidate.candidateId,
          },
        });
        const startTime = moment(candExam.startTime, 'YYYY-MM-DD HH:mm:ss');
        const endTime = moment(candExam.endTime, 'YYYY-MM-DD HH:mm:ss');
        const durationInSeconds = endTime.diff(startTime, 'seconds');
        const averageDurationFormatted = moment
          .utc()
          .startOf('day')
          .seconds(durationInSeconds)
          .format('HH:mm:ss');

        // const grade = await Grade.findOne({ where: { candidateId: candidate.candidateId, examId: candidate.examId } });
        const sectionStat = await this.getCandidateSectionStatistics(
          examId,
          candidate.candidateId,
          candidate,
        );
        const progress = await CandidateProgress.findOne({
          where: {
            candidateId: candidate.candidateId,
            examId: candidate.examId,
          },
        });
        if (!progress) {
          continue;
        }
        const questionsAttempted = progress?.questionStatus?.filter(
          (q) => q.attempted === true,
        ) || [];
        const questionTypesSet = new Set();

        questionsAttempted.forEach((q) => {
          if (q.question) {
            questionTypesSet.add(q.question.type);
          }
        });
        const uniqueQuestionTypes = Array.from(questionTypesSet);

        candidateData.push({
          candidate: profile.id,
          username: profile ? profile.username : 'N/A',
          startedAt: startTime,
          endedAt: endTime,
          totalDuration: averageDurationFormatted,
          sectionGrades: sectionStat,
          questionTypes: uniqueQuestionTypes,
        });
      }

      let totalNoOfItems = await CandidateExam.count({
        where: { examId: examId },
      });
      if (filter && searchValue) {
        let filteredResult = await this.searchReports(
          filter,
          searchValue,
          candidateData,
        );
        totalNoOfItems = filteredResult.length;
        candidateData = filteredResult;
      }

      console.log(candidateData.length);

      return {
        status: 200,
        message: 'Candidate grade reports retrieved successfully',
        data: candidateData,
        pageInfo: {
          totalItems: candidateData.length,
          totalPages: Math.ceil(candidateData.length / pageSize),
          currentPage: page,
        },
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  async getAllCandidatesExamReportsNonPaginated(
    examId,
    filter,
    searchValue,
    sortBy,
  ) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      // Get all candidate exams for the candidate
      const candidateExams = await CandidateExam.findAll({
        where: { examId: examId },
      });

      let candidateData = [];

      for (const candidateExam of candidateExams) {
        const profile = await Candidate.findByPk(candidateExam.candidateId);
        const grade = await Grade.findOne({
          where: {
            examId: candidateExam.examId,
            candidateId: candidateExam.candidateId,
          },
        });
        const startTime = moment(candidateExam.startTime, 'YYYY-MM-DD HH:mm:ss');
        const endTime = moment(candidateExam.endTime, 'YYYY-MM-DD HH:mm:ss');
        const durationInSeconds = endTime.diff(startTime, 'seconds');
        const averageDurationFormatted = moment
          .utc()
          .startOf('day')
          .seconds(durationInSeconds)
          .format('HH:mm:ss');

        const sectionStat = await this.getCandidateSectionStatistics(
          candidateExam.examId,
          candidateExam.candidateId,
          grade,
        );

        const progress = await CandidateProgress.findOne({
          where: {
            candidateId: candidateExam.candidateId,
            examId: candidateExam.examId,
          },
        });

        if (!progress) {
          continue;
        }

        const questionsAttempted = progress.questionStatus.filter(
          (q) => q.attempted === true,
        );
        const questionTypesSet = new Set();

        questionsAttempted.forEach((q) => {
          questionTypesSet.add(q.question.type);
        });
        const uniqueQuestionTypes = Array.from(questionTypesSet);

        // Calculate unanswered questions
        const totalQuestions = progress.questionStatus.length;
        const questionsAnswered = questionsAttempted.length;
        const questionsUnanswered = totalQuestions - questionsAnswered;

        // Get raw score, maximum score, and score gotten from candidate grade
        const rawScore = grade ? grade.nonEssayGrade || 0 : 0;
        const maxScore = grade ? grade.totalNoOfQuestion || 0 : 0;
        const scoreGotten = grade ? grade.nonEssayGrade || 0 : 0;

        // Merge questionsAnswered and questionsUnanswered into sectionGrades
        let enrichedSectionGrades = [];
        if (grade && grade.sectionGrades) {
          enrichedSectionGrades = grade.sectionGrades.map((section) => {
            const answeredCount = progress.questionStatus.filter(
              (q) => q.sectionId === section.sectionId && q.attempted === true,
            ).length;
            const unansweredCount = progress.questionStatus.filter(
              (q) => q.sectionId === section.sectionId && q.attempted === false,
            ).length;
            // Preserve all original fields and add the new ones
            return {
              ...section,
              course: section.subject,
              started: section.started,
              submitted: section.submitted,
              duration: section.duration,
              score: section.score,
              noOfQuestions: section.totalQuestions || 0,
              questionsAnswered: answeredCount,
              questionsUnanswered: unansweredCount,
            };
          });
        }

        // Prepare exam-specific data object
        const examData = {
          examName: exam.title,
          startedAt: startTime,
          endedAt: endTime,
          totalDuration: averageDurationFormatted,
          percentage: this.calculateTotalPercentage(sectionStat),
          rawScore: rawScore,
          maxScore: maxScore,
          scoreGotten: scoreGotten,
          totalQuestions: totalQuestions,
          questionsAnswered: questionsAnswered,
          questionsUnanswered: questionsUnanswered,
          sectionGrades: enrichedSectionGrades.map((section) => {
            const matchingStat = sectionStat.find(
              (stat) => stat.course === section.subject || stat.sectionId === section.sectionId,
            );
            return {
              ...section,
              course: matchingStat ? matchingStat.course : section.subject,
              started: matchingStat ? matchingStat.started : '',
              submitted: matchingStat ? matchingStat.submitted : '',
              duration: matchingStat ? matchingStat.duration : '',
              score: matchingStat ? matchingStat.score : section.score,
              noOfQuestions: matchingStat ? matchingStat.noOfQuestions : section.totalQuestions || 0,
            };
          }),
          questionTypes: uniqueQuestionTypes,
        };

        // Check if candidate already exists in candidateData
        let existingCandidate = candidateData.find(
          (c) => c.candidateId === candidateExam.candidateId,
        );

        if (existingCandidate) {
          // Append exam data to existing candidate's exams array
          existingCandidate.exams.push(examData);
        } else {
          // Add new candidate with exams array
          candidateData.push({
            candidateId: profile.id,
            username: profile ? profile.username : 'N/A',
            firstName: profile.firstName,
            lastName: profile.lastName,
            exams: [examData],
          });
        }
      }

      let totalNoOfItems = await CandidateExam.count({
        where: { examId: examId },
      });
      if (filter && searchValue) {
        let filteredResult = await this.searchReports(
          filter,
          searchValue,
          candidateData,
        );
        totalNoOfItems = filteredResult.length;
        candidateData = filteredResult;
      }

      console.log(candidateData.length);

      return {
        status: 200,
        message: 'Candidate grade reports retrieved successfully',
        data: candidateData,
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  private calculateTotalPercentage(grades) {
    let totalEarned = 0;
    let totalPossible = 0;
  
    grades.forEach(grade => {
      const [earned, possible] = grade.score.split('/').map(Number);
      totalEarned += earned;
      totalPossible += possible;
    });
  
    const totalPercentage = (totalEarned / totalPossible) * 100;
    return totalPercentage.toFixed(2) + '%'; // Format the percentage to 2 decimal places
  }

  private flattenExamReportData(data: any[]): any[] {
    const flattenedData = [];

    data.forEach((item) => {
      const flatItem: any = {
        candidateId: item.candidateId,
        username: item.username,
        firstName: item.firstName,
        lastName: item.lastName,
      };

      // Iterate over each exam and add exam-specific columns
      item.exams.forEach((exam, index) => {
        flatItem[`Exam_${index + 1}_Name`] = exam.examName;
        flatItem[`Exam_${index + 1}_StartedAt`] = exam.startedAt;
        flatItem[`Exam_${index + 1}_EndedAt`] = exam.endedAt;
        flatItem[`Exam_${index + 1}_TotalDuration`] = exam.totalDuration;
        flatItem[`Exam_${index + 1}_Percentage`] = exam.percentage;
        flatItem[`Exam_${index + 1}_RawScore`] = exam.rawScore;
        flatItem[`Exam_${index + 1}_MaxScore`] = exam.maxScore;
        flatItem[`Exam_${index + 1}_ScoreGotten`] = exam.scoreGotten;
        flatItem[`Exam_${index + 1}_TotalQuestions`] = exam.totalQuestions;
        flatItem[`Exam_${index + 1}_QuestionsAnswered`] = exam.questionsAnswered;
        flatItem[`Exam_${index + 1}_QuestionsUnanswered`] = exam.questionsUnanswered;

        // Add exam section grades as separate columns with detailed fields
        exam.sectionGrades.forEach((grade, gradeIndex) => {
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_Course`] = grade.course || grade.subject || '';
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_Started`] = grade.started
            ? (grade.started.format
              ? grade.started.format('YYYY-MM-DD HH:mm:ss')
              : typeof grade.started === 'string'
              ? grade.started
              : '')
            : '';
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_Submitted`] = grade.submitted
            ? (grade.submitted.format
              ? grade.submitted.format('YYYY-MM-DD HH:mm:ss')
              : typeof grade.submitted === 'string'
              ? grade.submitted
              : '')
            : '';
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_Duration`] = grade.duration || '';
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_Score`] = grade.score || grade.candidateScore || 0;

          // Add requested columns for each section
          const scoreGotten = grade.candidateScore || 0;
          const rawScore = grade.totalObtainableScore || 0;
          const percentage = rawScore > 0 ? ((scoreGotten / rawScore) * 100).toFixed(2) + '%' : 'N/A';
          const questionsAnswered = grade.questionsAnswered || 0;
          const questionsUnanswered = grade.questionsUnanswered || 0;

          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_ScoreGotten`] = scoreGotten;
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_RawScore`] = rawScore;
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_Percentage`] = percentage;
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_QuestionsAnswered`] = questionsAnswered;
          flatItem[`Exam_${index + 1}_Section_${gradeIndex + 1}_QuestionsUnanswered`] = questionsUnanswered;
        });
      });

      flattenedData.push(flatItem);
    });

    return flattenedData;
  }
  private flattenScoreReportData(data: any[]): any[] {
    const flattenedData = [];

    data.forEach((item) => {
      const flatItem = {
        candidateId: item.candidateId,
        username: item.username,
        firstName:item.firstName,
        lastName:item.firstName,
        total: item.total,
        weightedScore: item.weightedScore,
      };

      item.courseAndScore.forEach((course, index) => {
        flatItem[`${course.subject}_score`] = course.score;
      });

      flattenedData.push(flatItem);
    });

    return flattenedData;
  }
  async downloadExcelForAllCandidateReports(
    examId,
    filter,
    searchValue,
    sortBy,
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`ExamReport-${examId}`);

      // Fetch the exam details to get the exam title
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        throw new Error('Exam not found');
      }

      const reports = await this.getAllCandidatesExamReportsNonPaginated(
        examId,
        filter,
        searchValue,
        sortBy,
      );

      const allCandidates = await CandidateExam.findAll({ where: { examId } });
      const gradedCandidates = await Grade.findAll({ where: { examId } });
      const gradedCandidateIds = new Set(gradedCandidates.map(g => g.candidateId));

      // Process non-participating candidates
      const nonParticipatingCandidates = [];
      for (const candidateExam of allCandidates) {
        if (!gradedCandidateIds.has(candidateExam.candidateId)) {
          const profile = await Candidate.findByPk(candidateExam.candidateId);
          if (profile) {
            nonParticipatingCandidates.push({
              candidateId: candidateExam.candidateId,
              username: profile.username,
              firstName: profile.firstName,
              lastName: profile.lastName,
              exams: [{
                examName: exam.title,
                startedAt: null,
                endedAt: null,
                totalDuration: '00:00:00',
                percentage: '0.00%',
                rawScore: 0,
                maxScore: 0,
                scoreGotten: 0,
                totalQuestions: 0,
                questionsAnswered: 0,
                questionsUnanswered: 0,
                sectionGrades: [],
                questionTypes: []
              }]
            });
          }
        }
      }
//Process non-participating candidate
// const flatData = this.flattenExamReportData(reports.data).concat(
//   this.flattenExamReportData(nonParticipatingCandidates)
// );
const flatData = this.flattenExamReportData(reports.data)
;

      const headers = Object.keys(flatData[0]);
      worksheet.addRow(headers);

      flatData.forEach((row) => worksheet.addRow(Object.values(row)));

      const buffer = await workbook.xlsx.writeBuffer();

      return buffer;
    } catch (e) {
      throw e;
    }
  }

  async downloadExcelForAllScoreReports(examId) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`ScoreReport-${examId}`);

      const reports = await this.getAllScoreReport(examId);

      const flatData = this.flattenScoreReportData(reports.data);

      const headers = Object.keys(flatData[0]);
      worksheet.addRow(headers);

      flatData.forEach((row) => worksheet.addRow(Object.values(row)));

      const buffer = await workbook.xlsx.writeBuffer();

      return buffer;
    } catch (e) {
      throw e;
    }
  }

  async searchReports(filter, searchValue, result) {
    try {
      const filterProperty = (record, property) =>
        record[property].toLowerCase().startsWith(searchValue.toLowerCase()) ||
        record[property].toLowerCase().includes(searchValue.toLowerCase());

      let filteredResult = [];

      switch (filter) {
        case 'username':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'username'),
          );
          break;
        default:
          console.error('Invalid filter type');
      }

      return filteredResult;
    } catch (err) {
      throw err;
    }
  }

  async searchCandidateProgress(filter, searchValue, result) {
    try {
      const filterProperty = (record, property) =>
        record[property].toLowerCase().startsWith(searchValue.toLowerCase()) ||
        record[property].toLowerCase().includes(searchValue.toLowerCase());

      let filteredResult = [];

      switch (filter) {
        case 'username':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'username'),
          );
          break;
        case 'email':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'email'),
          );
          break;
        case 'candidateId':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'candidateId'),
          );
          break;
        default:
          console.error('Invalid filter type');
      }

      return filteredResult;
    } catch (err) {
      throw err;
    }
  }


  async searchExams(filter, searchValue, result) {
    try {
      const filterProperty = (record, property) =>
        record[property].toLowerCase().startsWith(searchValue.toLowerCase()) ||
        record[property].toLowerCase().includes(searchValue.toLowerCase());

      let filteredResult = [];

      switch (filter) {
        case 'type':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'type'),
          );
          break;
        case 'title':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'title'),
          );
          break;
        case 'deliveryMode':
          filteredResult = result.filter((record) =>
            filterProperty(record, 'deliveryMode'),
          );
          break;
        default:
          console.error('Invalid filter type');
      }

      return filteredResult;
    } catch (err) {
      throw err;
    }
  }

  async sortResults(results, sortBy) {
    if (!results || !sortBy) {
      return results;
    }

    if (sortBy === 'createdAt') {
      return results.sort((a, b) => moment(b[sortBy]).diff(moment(a[sortBy])));
    } else {
      return results.sort((a, b) => {
        const fieldA = String(a[sortBy]).toLowerCase();
        const fieldB = String(b[sortBy]).toLowerCase();
        return fieldA.localeCompare(fieldB);
      });
    }
  }

  async getAllEssayResponses(examId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }
      const essayResponses = [];
      const candidateGrades = await Grade.findAll({ where: { examId } });
      for (let grade of candidateGrades) {
        let candidate = await Candidate.findByPk(grade.candidateId);
        let response = {
          username: candidate.username,
          email: candidate.email,
          responses: [],
        };
        for (let item of grade.sectionGrades) {
          response.responses.push({
            subject: item.subject,
            sectionId: item.sectionId,
            essayResponses: item.essayResponses,
          });
        }
        essayResponses.push(response);
      }

      return {
        status: 200,
        message: 'Essay Responses retrieved successfully',
        data: essayResponses,
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: 'An Error Occured',
        error: true,
      };
    }
  }

  async getCandidateEssayResponse(examId, candidateId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      const candidateExam = await CandidateExam.findOne({
        where: { examId: examId, candidateId: candidateId },
      });
      if (!candidateExam) {
        return {
          status: 400,
          message: 'Invalid exam or candidate id',
          error: true,
        };
      }
      const essayResponses = [];
      const grade = await Grade.findOne({
        where: { examId: examId, candidateId: candidateId },
      });
      let candidate = await Candidate.findByPk(grade.candidateId);
      let response = {
        username: candidate.username,
        email: candidate.email,
        responses: [],
      };
      for (let item of grade.sectionGrades) {
        response.responses.push({
          subject: item.subject,
          sectionId: item.sectionId,
          essayResponses: item.essayResponses,
        });
      }
      essayResponses.push(response);

      return {
        status: 200,
        message: 'Essay Responses retrieved successfully',
        data: essayResponses,
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: 'An Error Occured',
        error: true,
      };
    }
  }

  async downloadEssayGradeSheet(examId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        `gradesheet-${examId.split('-')[0]}`,
      );
      let columns = [
        { header: 'username', key: 'username', width: 20 },
        { header: 'questionId', key: 'questionId', width: 20 },
        { header: 'question', key: 'question', width: 20 },
        { header: 'response', key: 'response', width: 20 },
        { header: 'score', key: 'score', width: 20 },
        {
          header: 'maxScore',
          key: 'maxScore',
          width: 20,
          formula: 'TEXT(maxScore, "0")',
        },
      ];
      worksheet.columns = columns;
      const essayResponses = [];
      const candidateGrades = await Grade.findAll({ where: { examId } });

      for (let grade of candidateGrades) {
        let candidate = await Candidate.findByPk(grade.candidateId);
        let candidateProgress = await CandidateProgress.findOne({
          where: { examId: grade.examId, candidateId: grade.candidateId },
        });
        let essayQuestionsTaken = candidateProgress.questionStatus.filter(
          (q) => q.question.type.toLowerCase() == 'essay',
        );

        for (let essayQuestion of essayQuestionsTaken) {
          // let answer = grade.sectionGrades.find(s =>
          //   s.essayResponses?.find(e => e.questionId === essayQuestion.question.id)?.response !== null
          // )?.essayResponses.find(e => e.questionId === essayQuestion.question.id)?.response ?? "";
          let question = await Question.findByPk(essayQuestion.question.id);

          let response = {
            username: candidate.username,
            questionId: essayQuestion.question.id,
            question: essayQuestion.question.content,
            response: essayQuestion.response ? essayQuestion.response : '',
            maxScore: question.score,
          };
          worksheet.addRow(response);
        }
      }
      return {
        status: 200,
        message: '',
        data: workbook,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        message: `An error occurred ${err.message}`,
        error: true,
      };
    }
  }

  async downloadCandidateEssayGradeSheet(examId, candidateId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid exam id',
          error: true,
        };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        `gradesheet-${examId.split('-')[0]}`,
      );
      let columns = [
        { header: 'username', key: 'username', width: 20 },
        { header: 'questionId', key: 'questionId', width: 20 },
        { header: 'question', key: 'question', width: 20 },
        { header: 'response', key: 'response', width: 20 },
        { header: 'score', key: 'score', width: 20 },
        {
          header: 'maxScore',
          key: 'maxScore',
          width: 20,
          formula: 'TEXT(maxScore, "0")',
        },
      ];
      worksheet.columns = columns;
      const essayResponses = [];
      const candidateGrade = await Grade.findOne({
        where: { examId, candidateId },
      });

      let candidate = await Candidate.findByPk(candidateId);
      let candidateProgress = await CandidateProgress.findOne({
        where: { examId: examId, candidateId: candidateId },
      });
      let essayQuestionsTaken = candidateProgress.questionStatus.filter(
        (q) => q.question.type.toLowerCase() == 'essay',
      );

      for (let essayQuestion of essayQuestionsTaken) {
        let question = await Question.findByPk(essayQuestion.question.id);
        let response = {
          username: candidate.username,
          questionId: essayQuestion.question.id,
          question: essayQuestion.question.content,
          response: essayQuestion.response ? essayQuestion.response : '',
          maxScore: question.score,
        };
        worksheet.addRow(response);
      }

      return {
        status: 200,
        message: '',
        data: workbook,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        message: `An error occurred ${err.message}`,
        error: true,
      };
    }
  }

  async uploadEssayGrade(gradeDto: UploadEssayGradeDto, worksheet: any) {
    try {
      const exam = await Exam.findByPk(gradeDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Exam with this id does not exist',
          error: true,
        };
      }

      const rows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }

        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const columnHeader = worksheet.getCell(1, colNumber).value;
          const cellValue = cell.value;
          rowData[columnHeader] = cellValue;
        });
        rows.push(rowData);
      });

      let essayGrades = [];

      for (let item of rows) {
        console.log(item);
        let candidate = await Candidate.findOne({
          where: { username: item.username },
        });
        if (!candidate) {
          continue;
        }
        let existingRecord = essayGrades.find(
          (q) => q.username == item.username,
        );
        let grad = await Grade.findOne({
          where: { examId: gradeDto.examId, candidateId: candidate.id },
        });
        let sectionGradeToUpdate = grad.sectionGrades;
        let essayResponseIndex = sectionGradeToUpdate;
        let obtainableScore = (
          await Question.findOne({ where: { id: item.questionId } })
        ).score;
        for (let t = 0; t < sectionGradeToUpdate.length; t++) {
          let index = sectionGradeToUpdate[t].essayResponses.findIndex(
            (q) => q.questionId == item.questionId,
          );

          if (index !== -1) {
            essayResponseIndex = index;

            sectionGradeToUpdate[t].essayResponses[index] = {
              content: sectionGradeToUpdate[t].essayResponses[index].content,
              questionId:
                sectionGradeToUpdate[t].essayResponses[index].questionId,
              score: item.score,
              obtainableScore: obtainableScore,
            };
          }

          await Grade.update(
            { sectionGrades: sectionGradeToUpdate },
            { where: { examId: gradeDto.examId, candidateId: candidate.id } },
          );
        }

        //  sectionGradeToUpdate[essayResponseIndex]["score"] = item.score;
        //  sectionGradeToUpdate[essayResponseIndex]["obtainableScore"] = obtainableScore;
        console.log(sectionGradeToUpdate);

        if (Number(item.score) > Number(item.maxScore)) {
          return {
            status: 400,
            message: `candidate score for question: ${item.questionId} cannot be more than the maxScore`,
            error: false,
          };
        }
        if (existingRecord) {
          existingRecord.score += item.score;
        } else {
          essayGrades.push({
            username: item.username,
            candidateId: candidate.id,
            score: item.score,
          });
        }
      }
      for (let g of essayGrades) {
        let grade = await Grade.findOne({
          where: { examId: gradeDto.examId, candidateId: g.candidateId },
        });
        if (grade) {
          await Grade.update(
            {
              essayGrade: g.score,
            },
            { where: { id: grade.id } },
          );
        }
      }

      return {
        status: 200,
        message: `You have successfully uploaded essay scores for this exam`,
        error: false,
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: e.message,
        error: true,
      };
    }
  }

  async getCandidateExamReport(examId, candidateId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidate = await CandidateExam.findOne({
        where: { examId, candidateId },
      });

      if (!candidate) {
        return {
          status: 400,
          message: 'Invalid Candidate Id for the specified exam',
          error: true,
        };
      }

      const progress = await CandidateProgress.findOne({
        where: { examId, candidateId },
      });

      const profile = await Candidate.findByPk(candidate.candidateId);
      const startTime = moment(candidate.startTime, 'YYYY-MM-DD HH:mm:ss');
      const endTime = moment(candidate.endTime, 'YYYY-MM-DD HH:mm:ss');
      const durationInSeconds = endTime.diff(startTime, 'seconds');
      const averageDurationFormatted = moment
        .utc()
        .startOf('day')
        .seconds(durationInSeconds)
        .format('HH:mm:ss');

      const grade = await Grade.findOne({
        where: { candidateId: candidate.candidateId, examId: candidate.examId },
      });

      const sectionStat = await this.getCandidateSectionStatistics(
        examId,
        candidate.candidateId,
        grade,
      );

      let candidateScore = 0;
      let obtainableScore = 0;

      const breakdown = grade.sectionGrades.map((g) => {
        candidateScore += Number(g.candidateScore);
        obtainableScore += Number(g.totalObtainableScore);

        let candidateEssayScore = grade.essayGrade
          ? g.essayResponses.reduce(
              (total, section) => total + section.score,
              0,
            )
          : 0;

        if (!isNaN(candidateEssayScore)) candidateScore += candidateEssayScore;
        return {
          subject: g.subject,
          correct: g.correctAnswers,
          score: g.essayGrade
            ? `${
                Number(g.candidateScore) + Number(candidateEssayScore)
              }/${Number(g.totalObtainableScore)}`
            : `${Number(g.candidateScore)}/${Number(g.totalObtainableScore)}`,
        };
      });

      const percent = (Number(candidateScore) / Number(obtainableScore)) * 100;

      // const totalObtainableScore = breakdown.reduce((total, section) => total + section.obtainableScore, 0);
      // const totalCandidateScore = breakdown.reduce((total, section) => total + section.candidateScore, 0);

      return {
        status: 200,
        message: 'Candidate grade report retrieved successfully',
        data: {
          candidate: profile?.id || 'N/A',
          username: profile?.username || 'N/A',
          examType: exam.type,
          examLocation: exam.deliveryMode,
          loggedIn: progress?.lastLogin || 'N/A',
          loginAttempts: progress?.loginAttempts || 'N/A',
          networkFailures: progress?.networkFailures || 'N/A',
          startedAt: startTime,
          endedAt: endTime,
          totalDuration: averageDurationFormatted,
          sectionGrades: sectionStat,
          totalScore: `${Number(candidateScore)}/${Number(obtainableScore)}`,
          weightedScore: percent.toFixed(2),
        },
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  async getCandidateSectionQuestionsAndTypes(examId, candidateId) {
    const progress = await CandidateProgress.findOne({
      where: { examId: examId, candidateId: candidateId },
    });

    const sectionStat = [];

    if (progress) {
      for (const section of progress.sectionStatus) {
        const sectionQuestions = await this.getSectionQuestionNonPaginated(
          section.sectionId,
        );
        const grade = await Grade.findOne({
          where: { candidateId: candidateId, examId: examId },
        });
        const sectionGrade = grade
          ? grade.sectionGrades.find((g) => g.sectionId === section.sectionId)
          : null;
        const questionTypesSet = new Set();
        if (!grade) {
          continue;
        }
        if (sectionQuestions && sectionQuestions.questions) {
          sectionQuestions.questions.forEach((question) => {
            questionTypesSet.add(question.type);
          });
        }
        const uniqueQuestionTypes = Array.from(questionTypesSet);

        sectionStat.push({
          noOfQuestions: (sectionQuestions && sectionQuestions.questions) ? sectionQuestions.questions.length : 0,
          course: sectionGrade ? sectionGrade.subject : null,
          questionTypes: uniqueQuestionTypes,
        });
      }
    }

    return sectionStat;
  }
  async getAllCandidatesExamReportSummary(
    examId,
    page = 1,
    pageSize = 10,
    filter,
    searchValue,
    sortBy,
  ) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidates = await CandidateExam.findAll({
        where: { examId: examId },
        offset: (page - 1) * pageSize,
        limit: Number(pageSize),
      });

      let candidateData = [];
      let totalNoOfItems = await CandidateExam.count({
        where: { examId: examId },
      });
      let count = totalNoOfItems;
      for (const candidate of candidates) {
        const profile = await Candidate.findByPk(candidate.candidateId);

        const sectionStat = await this.getCandidateSectionQuestionsAndTypes(
          examId,
          candidate.candidateId,
        );
        if (!sectionStat) {
          count--;
          continue;
        }
        candidateData.push({
          candidateId: profile.id,
          username: profile ? profile.username : 'N/A',
          sections: sectionStat,
        });
      }

      if (filter && searchValue) {
        let filteredResult = await this.searchReports(
          filter,
          searchValue,
          candidateData,
        );
        count = filteredResult.length;
        candidateData = filteredResult;
      }

      if (sortBy) {
        candidateData = await this.sortResults(candidateData, 'createdAt');
      }

      return {
        status: 200,
        message: 'Candidate report preview retrieved successfully',
        data: candidateData,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / pageSize),
          currentPage: page,
        },
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: 'An Error occurred',
        error: true,
      };
    }
  }

  async getAllScoreReport(examId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidates = await CandidateExam.findAll({
        where: { examId: examId },
      });

      const candidateData = [];

      for (const candidate of candidates) {
        const profile = await Candidate.findByPk(candidate.candidateId);
        const grade = await Grade.findOne({
          where: { examId: examId, candidateId: candidate.candidateId },
        });
        if (!grade) {
          continue;
        }
        let candidateScore = 0;
        let obtainableScore = 0;
        let breakdown = grade.sectionGrades.map((g) => {
          candidateScore += Number(g.candidateScore);
          obtainableScore += Number(g.totalObtainableScore);
          let candidateEssayScore = grade.essayGrade
            ? g.essayResponses.reduce(
                (total, section) => total + section.score,
                0,
              )
            : 0;
          candidateScore += candidateEssayScore;
          return {
            subject: g.subject,
            score: `${Number(g.candidateScore + candidateEssayScore)}/${Number(
              g.totalObtainableScore,
            )}`,
          };
        });
        let percent = (Number(candidateScore) / Number(obtainableScore)) * 100;
        candidateData.push({
          candidateId: profile.id,
          username: profile ? profile.username : 'N/A',
          firstName:profile.firstName,
          lastName:profile.lastName,
          courseAndScore: breakdown,
          total: `${Number(candidateScore)}/${Number(obtainableScore)}`,
          weightedScore: percent.toFixed(2),
        });
      }

      return {
        status: 200,
        message: 'All score reports retrieved successfully',
        data: candidateData,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async getScoreAnalysis(examId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidates = await CandidateExam.findAll({
        where: { examId: examId },
      });

      const candidateData = [];

      for (const candidate of candidates) {
        const profile = await Candidate.findByPk(candidate.candidateId);
        const grade = await Grade.findOne({
          where: { examId: examId, candidateId: candidate.candidateId },
        });
        if (!grade) {
          continue;
        }

        const totalScore = parseFloat(
          grade.sectionGrades.reduce(
            (total, section) => total + parseFloat(section.candidateScore),
            0,
          ),
        );
        console.log('totalScore:' + totalScore);
        const sectionScores = {};
        grade.sectionGrades.forEach((section) => {
          const sectionName = section.subject;
          if (!sectionScores[sectionName]) {
            sectionScores[sectionName] = {
              scores: [],
            };
          }
          if (sectionScores[sectionName].scores.length > 0) {
            let sum = sectionScores[sectionName].scores.reduce(
              (acc, score) => acc + score,
              0,
            );
            sectionScores[sectionName].scores = [sum];
          } else {
            let candidateEssayScore = grade.essayGrade
              ? section.essayResponses.reduce(
                  (total, section) => total + section.score,
                  0,
                )
              : 0;
            sectionScores[sectionName].scores.push(
              section.candidateScore + candidateEssayScore,
            );
          }
        });

        candidateData.push({
          candidateId: profile.id,
          username: profile ? profile.username : 'N/A',
          totalScore: grade.essayGrade
            ? (totalScore + Number(grade.essayGrade)).toFixed(2)
            : totalScore.toFixed(2),
          sectionScores,
        });
      }

      // Calculate the highest score, lowest score, average score, and median score
      const scores = candidateData.map((candidate) =>
        parseFloat(candidate.totalScore),
      );
      console.log('scores' + scores);
      const highestScore = Math.max(...scores).toFixed(0);
      const lowestScore = Math.min(...scores).toFixed(0);
      const averageScore = (
        scores.reduce((acc, score) => acc + score, 0) / scores.length
      ).toFixed(0);
      console.log(averageScore);
      const medianScore = this.calculateMedianScore(scores).toFixed(0);

      // Calculate section averages as percentages
      const sectionAverages = {};
      for (const candidate of candidateData) {
        for (const section in candidate.sectionScores) {
          const scoresInSection = candidate.sectionScores[section].scores;
          const sectionName = section;
          if (!sectionAverages[sectionName]) {
            sectionAverages[sectionName] = {
              totalScore: 0,
              candidateCount: 0,
            };
          }
          sectionAverages[sectionName].totalScore += scoresInSection.reduce(
            (acc, score) => acc + score,
            0,
          );
          sectionAverages[sectionName].candidateCount += scoresInSection.length;
        }
      }

      let overallScore = 0;
      for (let section in sectionAverages) {
        overallScore += sectionAverages[section].totalScore;
      }
      for (const section in sectionAverages) {
        const totalScore = sectionAverages[section].totalScore;
        const candidateCount = sectionAverages[section].candidateCount;
        sectionAverages[section].averageScore = (
          (totalScore / overallScore) *
          100
        ).toFixed(0); // Calculate average weighted score as a percentage
        delete sectionAverages[section].totalScore;
        delete sectionAverages[section].candidateCount;
      }

      // Calculate section score distributions
      const sectionScoreDistributions = {};
      for (const candidate of candidateData) {
        for (const section in candidate.sectionScores) {
          const scoresInSection = candidate.sectionScores[section].scores;
          const sectionName = section;
          if (!sectionScoreDistributions[sectionName]) {
            sectionScoreDistributions[sectionName] = {
              highestScorers: 0,
              lowestScorers: 0,
            };
          }
          console.log(scoresInSection);
          const maxScore = Math.max(...scoresInSection);
          const minScore = Math.min(...scoresInSection);
          const highestScorers = scoresInSection.filter(
            (score) => score === maxScore,
          ).length;
          const lowestScorers = scoresInSection.filter(
            (score) => score === minScore,
          ).length;
          sectionScoreDistributions[sectionName].highestScorers +=
            highestScorers;
          sectionScoreDistributions[sectionName].lowestScorers += lowestScorers;
        }
      }

      return {
        status: 200,
        message: 'Score analysis retrieved successfully',
        data: {
          highestScore,
          lowestScore,
          averageScore,
          medianScore,
          sectionAverages,
          sectionScoreDistributions,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  private calculateMedianScore(scores) {
    const sortedScores = scores.slice().sort((a, b) => a - b);
    const middle = Math.floor(sortedScores.length / 2);
    if (sortedScores.length % 2 === 0) {
      const lowerMiddle = sortedScores[middle - 1];
      const upperMiddle = sortedScores[middle];
      return (lowerMiddle + upperMiddle) / 2;
    } else {
      return sortedScores[middle];
    }
  }

  private calculateSectionAverages(candidateData) {
    const sectionAverages = {};
    candidateData.forEach((candidate) => {
      for (const section in candidate.sectionScores) {
        const totalScore = candidate.sectionScores[section].totalScore;
        const candidateCount = candidate.sectionScores[section].candidateCount;
        if (!sectionAverages[section]) {
          sectionAverages[section] = 0;
        }
        sectionAverages[section] += totalScore / candidateCount;
      }
    });
    for (const section in sectionAverages) {
      sectionAverages[section] = sectionAverages[section].toFixed(2);
    }
    return sectionAverages;
  }

  private calculateSectionDistributions(candidateData) {
    const sectionDistributions = {};
    candidateData.forEach((candidate) => {
      for (const section in candidate.sectionScores) {
        if (!sectionDistributions[section]) {
          sectionDistributions[section] = {
            highestScore: parseFloat(candidate.totalScore),
            lowestScore: parseFloat(candidate.totalScore),
          };
        } else {
          const totalScore = parseFloat(candidate.totalScore);
          if (totalScore > sectionDistributions[section].highestScore) {
            sectionDistributions[section].highestScore = totalScore;
          }
          if (totalScore < sectionDistributions[section].lowestScore) {
            sectionDistributions[section].lowestScore = totalScore;
          }
        }
      }
    });
    for (const section in sectionDistributions) {
      sectionDistributions[section].highestScore =
        sectionDistributions[section].highestScore.toFixed(2);
      sectionDistributions[section].lowestScore =
        sectionDistributions[section].lowestScore.toFixed(2);
    }
    return sectionDistributions;
  }

  async getAllScoreReportPaginated(examId, page = 1, pageSize = 10) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidates = await CandidateExam.findAll({
        where: { examId: examId },
        offset: (page - 1) * pageSize,
        limit: Number(pageSize),
      });

      const candidateData = [];

      for (const candidate of candidates) {
        const profile = await Candidate.findByPk(candidate.candidateId);
        const grade = await Grade.findOne({
          where: { examId: examId, candidateId: candidate.candidateId },
        });
        if (!grade) {
          continue;
        }
        let candidateScore = 0;
        let obtainableScore = 0;
        let breakdown = grade.sectionGrades.map((g) => {
          candidateScore += Number(g.candidateScore);
          obtainableScore += Number(g.totalObtainableScore);
          let candidateEssayScore = grade.essayGrade
            ? g.essayResponses.reduce(
                (total, section) => total + section.score,
                0,
              )
            : 0;
          candidateScore += candidateEssayScore;
          return {
            subject: g.subject,
            correct: g.correctAnswers,
            score: `${Number(g.candidateScore + candidateEssayScore)}/${Number(
              g.totalObtainableScore,
            )}`,
          };
        });
        let percent = (Number(candidateScore) / Number(obtainableScore)) * 100;
        candidateData.push({
          candidateId: profile.id,
          username: profile ? profile.username : 'N/A',
          courseAndScore: breakdown,
          total: `${Number(candidateScore)}/${Number(obtainableScore)}`,
          weightedScore: percent.toFixed(2),
        });
      }
      const totalNoOfItems = await CandidateExam.count({
        where: { examId: examId },
      });
      return {
        status: 200,
        message: 'All score reports retrieved successfully',
        data: candidateData,
        pageInfo: {
          totalItems: totalNoOfItems,
          totalPages: Math.ceil(totalNoOfItems / pageSize),
          currentPage: page,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async getIndividualScoreReport(examId, candidateId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidate = await CandidateExam.findOne({
        where: { examId: examId, candidateId: candidateId },
      });

      const candidateData = [];

      const profile = await Candidate.findByPk(candidate.candidateId);
      const grade = await Grade.findOne({
        where: { examId: examId, candidateId: candidate.candidateId },
      });

      let candidateScore = 0;
      let obtainableScore = 0;
      let breakdown = grade.sectionGrades.map((g) => {
        candidateScore += Number(g.candidateScore);
        obtainableScore += Number(g.totalObtainableScore);
        let candidateEssayScore = grade.essayGrade
          ? g.essayResponses.reduce(
              (total, section) => total + section.score,
              0,
            )
          : 0;
        candidateScore += candidateEssayScore;
        return {
          subject: g.subject,
          correct: g.correctAnswers,
          score: `${Number(g.candidateScore + candidateEssayScore)}/${Number(
            g.totalObtainableScore,
          )}`,
        };
      });
      let percent = (Number(candidateScore) / Number(obtainableScore)) * 100;
      candidateData.push({
        candidateId: candidateId,
        username: profile ? profile.username : 'N/A',
        courseAndScore: breakdown,
        total: `${Number(candidateScore)}/${Number(obtainableScore)}`,
        weightedScore: percent.toFixed(2),
      });

      return {
        status: 200,
        message: 'individual score reports retrieved successfully',
        data: candidateData,
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async getSingleCandidateScoreAnalysis(examId, candidateId) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }

      const candidate = await CandidateExam.findOne({
        where: { examId: examId, candidateId: candidateId },
      });

      if (!candidate) {
        return {
          status: 400,
          message: 'Invalid Candidate Id for the specified exam',
          error: true,
        };
      }

      const profile = await Candidate.findByPk(candidate.candidateId);
      const grade = await Grade.findOne({
        where: { examId: examId, candidateId: candidate.candidateId },
      });

      if (!grade) {
        return {
          status: 400,
          message: 'No grade found for the specified candidate and exam',
          error: true,
        };
      }

      const sectionScores = {};
      grade.sectionGrades.forEach((section) => {
        const sectionName = section.subject;
        if (!sectionScores[sectionName]) {
          sectionScores[sectionName] = {
            scores: [],
          };
        }
        let candidateEssayScore = grade.essayGrade
          ? section.essayResponses.reduce(
              (total, section) => total + section.score,
              0,
            )
          : 0;

        sectionScores[sectionName].scores.push(
          parseFloat(section.candidateScore + candidateEssayScore),
        );
      });

      const sectionStatistics = {};
      for (const section in sectionScores) {
        const scoresInSection = sectionScores[section].scores;
        sectionStatistics[section] = {
          highestScore: Math.max(...scoresInSection).toFixed(2),
          lowestScore: Math.min(...scoresInSection).toFixed(2),
          medianScore: this.calculateMedianScore(scoresInSection).toFixed(2),
          averageScore: (
            scoresInSection.reduce((acc, score) => acc + score, 0) /
            scoresInSection.length
          ).toFixed(2),
        };
      }

      // Calculate percentile distribution for each section
      for (const section in sectionScores) {
        const scoresInSection = sectionScores[section].scores;
        const overallScores =
          sectionScores[Object.keys(sectionScores)[0]].scores; // Example: Use the first section's scores for overall comparison

        // Calculate percentile for each score in the section
        const percentiles = scoresInSection.map((score) => {
          const percentile = (
            (overallScores.filter((overallScore) => overallScore <= score)
              .length /
              overallScores.length) *
            100
          ).toFixed(2);
          return percentile;
        });

        sectionStatistics[section].percentileDistribution = percentiles;
      }

      return {
        status: 200,
        message: 'Score analysis retrieved successfully',
        data: {
          sectionStatistics,
        },
        error: false,
      };
    } catch (e) {
      return {
        status: 500,
        message: `An Error occurred: ${e.message}`,
        error: true,
      };
    }
  }

  async getAllCandidatesProgresses(
    examId: string,
    page: number = 1,
    limit: number = 10,
    filter?: string,
    searchValue?: string,
    sortBy: string  = "createdAt"
  ) {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Invalid Exam Id',
          error: true,
        };
      }
      const offset = (page - 1) * limit;
      let count, progresses;

      if (filter && searchValue) {
        ({ count, rows: progresses } = await CandidateProgress.findAndCountAll({
          where: { examId },
          include: [Candidate]
        }));
      } else {
        ({ count, rows: progresses } = await CandidateProgress.findAndCountAll({
          where: { examId },
          include: [Candidate],
          limit: Number(limit),
          offset: Number(offset),
        }));
      }



      let allProgresses = [];

      for (let progress of progresses) {
        // let progress = await this.getCandidateProgress(person.candidateId,person.examId);
        // if(!progress) continue;
        const examSections = progress ? progress.sectionStatus : [];

        let candidate = await Candidate.findByPk(progress.candidateId);
        let candidateExam = await CandidateExam.findOne({
          where: { examId: progress.examId, candidateId: candidate.id },
        });
        if (progress) {
          allProgresses.push({
            candidateId: progress.candidateId,
            username: candidate.username,
            email: candidate.email,
            id: candidate.id,
            loggedIn: progress ? progress.lastLogin : null,
            startedAt: candidateExam.startTime,
            attempted: progress
              ? progress.questionStatus.filter((q) => q.attempted == true)
                  .length
              : 0,
            totalQuestions:progress?.questionStatus.length,
            isSubmitted:candidateExam.isSubmitted
          });
        }
      }

      if (filter && searchValue) {
        let filteredResult = await this.searchCandidateProgress(
          filter,
          searchValue,
          allProgresses,
        );
        count = filteredResult.length;
        allProgresses = filteredResult;
      }
      if (sortBy) {
        allProgresses = await this.sortResults(allProgresses, sortBy);
      }

      return {
        status: 200,
        message: 'Candidates progresses retrieved successfully',
        data: allProgresses,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
      };
    } catch (e) {
      console.log(e);
      return {
        status: 500,
        message: `An Error occured: ${e.message}`,
        error: true,
      };
    }
  }

  private generateJwtTokenForAdmin(
    localAdmin: User,
    userPermissions: any[],
  ): string {
    const payload = {
      sub: localAdmin.id,
      email: localAdmin.email,
      username: localAdmin.username,
      roles: ['local-admin'],
      permissions: userPermissions,
    };
    return this.jwtService.sign(payload, {
      secret: `${this.jwtSecret}`,
      expiresIn: '24h',
    });
  }

  private generateRefreshToken(localAdmin: User): string {
    const payload = {
      sub: localAdmin.id,
      email: localAdmin.email,
      username: localAdmin.username,
      roles: ['local-admin'],
    };
    return this.jwtService.sign(payload, {
      secret: `${this.jwtSecret}`,
      expiresIn: '7d',
    });
  }

  private async generateUsernameForLocalAdmin(firstName) {
    const min = 10;
    const max = 99;
    const randomTwoDigitNumber =
      Math.floor(Math.random() * (max - min + 1)) + min;
    let username = `${firstName}${randomTwoDigitNumber}`;
    const candidate = await User.findOne({ where: { username: username } });
    if (candidate) {
      username = await this.generateUsernameForLocalAdmin(firstName);
    }
    return username;
  }

  private generatePasswordForLocalAdmin(length = 6) {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  async verifyUnlockPassword(examId: string, password: string): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return {
          status: 400,
          message: 'Exam not found',
          error: true,
        };
      }

      if (!exam.lockedScreenEnabled) {
        return {
          status: 400,
          message: 'Locked screen is not enabled for this exam',
          error: true,
        };
      }

      if (!exam.lockedScreenPassword) {
        return {
          status: 400,
          message: 'No unlock password set for this exam',
          error: true,
        };
      }

      if (exam.lockedScreenPassword === password) {
        return {
          status: 200,
          message: 'Password verified successfully',
          error: false,
        };
      } else {
        return {
          status: 400,
          message: 'Invalid unlock password',
          error: true,
        };
      }
    } catch (error) {
      return {
        status: 500,
        message: `Internal server error: ${error.message}`,
        error: true,
      };
    }
  }

  async submitSectionEndTimes(
    candidateId: string,
    examId: string,
    sectionEndTimes: { sectionId: string; startTime?: string; endTime?: string; completed: boolean }[]
  ): Promise<ApiResponse> {
    try {
      // Update each candidate section with the provided end time
      for (const sectionEndTime of sectionEndTimes) {
        const candidateSection = await CandidateSection.findOne({
          where: {
            candidateId: candidateId,
            sectionId: sectionEndTime.sectionId
          }
        });

        if (candidateSection) {
          // Update the endTime if provided
          if (sectionEndTime.endTime) {
            await CandidateSection.update(
              { endTime: sectionEndTime.endTime },
              { where: { id: candidateSection.id } }
            );
          }
        } else {
          // If no candidate section exists, create one with the end time
          await CandidateSection.create({
            candidateId: candidateId,
            sectionId: sectionEndTime.sectionId,
            endTime: sectionEndTime.endTime || new Date().toISOString(),
            timer: null // Timer will be set based on exam configuration
          });
        }
      }

      return {
        status: 200,
        message: 'Section end times submitted successfully',
        error: false,
      };
    } catch (error) {
      console.error('Error submitting section end times:', error);
      return {
        status: 500,
        message: `Internal server error: ${error.message}`,
        error: true,
      };
    }
  }
}
