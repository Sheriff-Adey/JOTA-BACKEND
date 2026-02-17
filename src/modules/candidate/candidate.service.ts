import { Injectable, Inject } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CandidateStatus, ImportCandidateDto, InviteCandidateDto, InviteMethod } from './dto/import-candidate.dto';
import { Exam } from '../exam/exam.entity';
import { Candidate } from './candidate.entity';
import { hash, compare } from 'bcryptjs';
import { Center } from '../exam/center.entity';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/shared/notifications/email.service';
import * as config from 'config';
import { candidateWelcomeTemplate } from '../notification/notification.template';
import { CandidateExam } from '../candidate-exam/candidate-exam.entity';
import { ReassignSubjectDto, ReassignToCenterDto, RegisterCandidateForOnlineDto, RegisterCandidateForPremiseDto } from './dto/register-candidate.dto';
import { ApiResponse } from 'src/app.interface';
import { User } from '../user/user.entity';
import { CancelInviteDto, ResendInviteDto } from './dto/invite.dto';
import { OpenExamLoginDto, PasswordedExamLoginDto } from './dto/candidate-login.dto';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ExamService } from '../exam/exam.service';
import { FaceCaptureDto } from './dto/face-capture.dto';
import { ExamCenter } from '../exam/exam-center.entity';
import { Item } from '../item/item.entity';
import { Role } from '../role/role.entity';
import { RolePermission } from '../role/role-permission.entity';
import { Permission } from '../role/permission.entity';
import { ExamType } from '../exam/dto/create-exam.dto';
import { TwilioService } from 'src/shared/notifications/sms.service';
import { NotificationService } from '../notification/notification.service';
import * as moment from 'moment';
import * as path from 'path';
import * as fs from 'fs';
import { Setting } from '../settings/setting.entity';
import { CandidateSection } from './candidate-section.entity';
import { Length, isObject } from 'class-validator';
import { ExamHistory } from '../audit/history.entity';
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

@Injectable()
export class CandidateService {
  constructor(
    private emailService: EmailService,
    private jwtService:JwtService,
    private examService:ExamService,
    private smsService:TwilioService,
    private notificationService:NotificationService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}
  private appUrl = `${process.env.APP_URL}`;
  private appPhone = `${process.env.TWILLIO_PHONE_NO}`;
  private candidateUrl = process.env.CANDIDATE_URL;
  private jwtSecret = config.get("jwtSecret");
  async downloadCandidateTemplate(){
    try{
    
       const workbook = new ExcelJS.Workbook();
       const worksheet = workbook.addWorksheet('Candidates');

       worksheet.columns = [
         { header: 'CandidateId', key: 'candidateId', width: 30 },
         { header: 'Email', key: 'email', width: 25 },
         { header: 'FirstName', key: 'firstName', width: 20 },
         { header: 'LastName', key: 'lastName', width: 30 },
         { header: 'PhoneNo', key: 'phoneNo', width: 30 },
         { header: 'Photo', key: 'photo', width: 30 },
         { header: 'Subjects', key: 'subjects', width: 20 },
         { header: 'PlainPassword', key: 'plainpassword', width: 20 }
       ];

      // Add descriptions as comments
      worksheet.getCell('A1').note = 'Email Address';
      worksheet.getCell('B1').note = 'First Name';
      worksheet.getCell('C1').note = 'Last Name';
      worksheet.getCell('D1').note = 'Phone Number(+234)';
      worksheet.getCell('E1').note = 'Subjects';
     return workbook;
    }
    catch(err){
      console.log(err);
    }
   
  }
  
  // New method to update candidate password
  async updateCandidatePassword(candidateId: string, password: string): Promise<ApiResponse> {
    try {
if (!password || password.trim().length < 3) {
  return {
    status: 400,
    message: 'Password must be at least 3 characters long',
    error: true,
  };
}
      const candidate = await Candidate.findByPk(candidateId);
      if (!candidate) {
        return {
          status: 404,
          message: 'Candidate not found',
          error: true,
        };
      }
      const hashedPassword = await hash(password, 10);
      await Candidate.update(
        { password: hashedPassword, plainPassword: password },
        { where: { id: candidateId } }
      );
      return {
        status: 200,
        message: 'Password updated successfully',
        error: false,
      };
    } catch (error) {
      console.error(error);
      return {
        status: 500,
        message: 'Internal server error',
        error: true,
      };
    }
  }
  
  

  
  
  // async importCandidates(importDto: ImportCandidateDto, worksheet: any): Promise<ApiResponse> {
  //   try {
      
  //     const exam = await Exam.findByPk(importDto.examId);
  //     if (!exam) {
  //       return {
  //         status: 400,
  //         message: "Exam with this id does not exist",
  //         error: true,
  //       };
  //     }
  //     //const examSubjects = await this.getExamSubjects(importDto.examId);
   
  //     const rows = [];
  //     worksheet.eachRow((row, rowNumber) => {
  //       if (rowNumber === 1) {
  //         return;
  //       }
  
  //       const rowData = {};
  //       row.eachCell((cell, colNumber) => {
  //         const columnHeader = worksheet.getCell(1, colNumber).value;
  //         const cellValue = cell.value;
  //         rowData[columnHeader] = cellValue;
  //       });
  //       rows.push(rowData);
  //     });
  
 
  
  //     for (const item of rows) {


  //      console.log(item)
  //       const email = item.Email?.toString()||item.Email?.text;
  //       console.log(`${item.Email.text}`);
  //       if(!email) continue;
  //       const photo = (item.Photo)?item.Photo.text:'';
  //       const existingCandidate= await Candidate.findOne({where:{email:email}});
  //       const existingCandidateId = await Candidate.findOne({where:{id:item.CandidateId}});
  //       const existingUser = await User.findOne({where:{email: email}});
  //       let examSections = await this.examService.getExamSections(exam.id);
  //       if(existingCandidate || existingCandidateId  || existingUser){
  //         let candidateIdToCheck = existingCandidate
  //           ? existingCandidate.id
  //           : existingCandidateId
  //           ? existingCandidateId.id
  //           : existingUser
  //           ? existingUser.id
  //           : null; 

  //         const candExam = await CandidateExam.findOne({where:{examId:importDto.examId,candidateId:candidateIdToCheck}});
  //         if(candExam){
  //             return {
  //               status: 400,
  //               message:`This email: ${email} has been registered for this exam already`,
  //               error: true
  //           }
  //         }
  //         else{
  //           let candidateSectionNames = item.Subjects.split(",");
  //           let candidateSections = examSections.data.filter((s) => {
  //               return (candidateSectionNames.includes(s.subject))
  //           });
  //           for(let sub of candidateSectionNames){
  //              let isIncluded = examSections.data.find((s) => s.subject.trim().replace(/\s+/g, '').toLowerCase() === sub.trim().replace(/\s+/g, '').toLowerCase())
  //               if(!isIncluded){
  //                  return {
  //                    status: 400,
  //                    message:`Invalid subject: ${sub} for ${email}`,
  //                    error:true
  //                  }
  //               }
  //             }
  //           await Candidate.update({
  //             picture:photo,
  //             firstName:item.FirstName,
  //             lastName:item.LastName,
  //             imported:true
  //           },{where:{id:candidateIdToCheck }})
            
  //           await CandidateExam.create({
  //             examId: importDto.examId,
  //             candidateId: candidateIdToCheck,
  //             isOnline: false,
  //             isSubmitted: false,
  //             assignedSubjects:item.Subjects,
  //             timer: (exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null,
  //             centerId:(importDto.centerId)?importDto.centerId:null
  //           })

          
            
          
  //            for(let c of candidateSections ){
  //             await CandidateSection.create({
  //               candidateId:candidateIdToCheck ,
  //               sectionId:c.id,
  //               timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
  //             })
  //           }
            
          
  //         }
  //       }
  //       else{
            
  //             let username = await this.generateUsername(item.FirstName);

  //             let candidateSectionNames = item.Subjects.split(",");
  //             let candidateSections = examSections.data.filter((s) => {
  //                 return (candidateSectionNames.includes(s.subject))
  //             });
  //             for(let sub of candidateSectionNames){
  //                 let isIncluded = examSections.data.find((s) => s.subject.trim().replace(/\s+/g, '').toLowerCase() === sub.trim().replace(/\s+/g, '').toLowerCase())
  //                 if(!isIncluded){
  //                     return {
  //                       status: 400,
  //                       message:`Invalid subject: ${sub} for ${email}`,
  //                       error:true
  //                     }
  //                 }
  //               }
            
              
  //             // let resizedPhoto = await this.examService.resizeBase64Image(registerDto.photo, 200,200);
  //             let candidateData = {
  //               username: username,
  //               password: "",
  //               lastName:item.LastName,
  //               firstName:item.FirstName,
  //               centerId:item.centerId,
  //               email: email,
  //               assignedSubjects:item.Subjects,
  //               token: this.generateVerificationToken(),
  //               status:CandidateStatus.PENDING,
  //               picture: photo,
  //               imported:true
  //             }
  //             if(item.CandidateId!== null || item.CandidateId !== ""){
  //               candidateData["id"] = item.CandidateId
  //               candidateData.username =  item.CandidateId
  //             }
  //             const candidate = await Candidate.create(candidateData);
  //           console.log(candidateData);
              
  //             await CandidateExam.create({
  //               examId: importDto.examId,
  //               candidateId: candidate.id,
  //               isOnline: false,
  //               isSubmitted: false,
  //               assignedSubjects:item.Subjects,
  //               timer: (exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null,
  //               centerId:(importDto.centerId)?importDto.centerId:null
  //             });

  //               for(let c of candidateSections ){
  //                 await CandidateSection.create({
  //                   candidateId:candidate.id,
  //                   sectionId:c.id,
  //                   timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
  //                 })
  //               }
      
  //       }
  
  //     }
  
  
  //     return {
  //       status: 200,
  //       message: `You have successfully imported ${rows.length} candidates for this exam`,
  //       error: false,
  //     };
  //   } catch (e) {
  //     console.log(e);
  //     return {
  //       status: 500,
  //       message: e.message,
  //       error: true,
  //     };
  //   }
  // }
 isObject(value: any): boolean {
    return value !== null && typeof value === 'object';
  }
  
  async importCandidates(importDto: ImportCandidateDto, worksheet: any): Promise<ApiResponse> {
    try {
      const exam = await Exam.findByPk(importDto.examId);
      if (!exam) {
        return {
          status: 400,
          message: "Exam with this id does not exist",
          error: true,
        };
      }
   
      if (exam.deliveryMode==="on-premise"&& !importDto.centerId) {
        return {
          status: 400,
          message: "You must specify a center for on-premise exam",
          error: true,
        };
      }
  
  
      const examSubjects = await this.getExamSubjects(importDto.examId);
      console.log(examSubjects);
  
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
  
      const candidatesToCreate = [];
      const candidateExamsToCreate = [];
      const candidateSectionsToCreate = [];
  
      const errors = [];
  
      for (const item of rows) {
        console.log("item",item);
        let email = this.isObject(item.Email)?item.Email?.text:item.Email;
        let candidateId = this.isObject(item.CandidateId)?item.CandidateId?.richText[0]?.text:item.CandidateId;
       
        console.log("candidateId",candidateId);
        let photo = (item.Photo);
        console.log(photo)

        // New: handle plainpassword column
        let plainPasswordRaw = item.plainpassword || item.PlainPassword || item.Plainpassword || item.PLAINPASSWORD || item.PLAINPassword || item.plainPassword;
        let plainPassword = null;
        let hashedPassword = '';
        if (plainPasswordRaw && typeof plainPasswordRaw === 'string' && plainPasswordRaw.trim() !== '') {
          plainPassword = plainPasswordRaw.trim();
        // Validate plainPassword length (minimum 3 characters)
          if (plainPassword.length < 3) {
            return {
              status: 400,
              message: `Password for candidate ${email} must be at least 3 characters long`,
              error: true,
            };
          }
          hashedPassword = await hash(plainPassword, 10);
        }

        const existingCandidate = email ? await Candidate.findOne({ where: { email } }) : null;
        const existingCandidateId = await Candidate.findByPk(candidateId);
        const existingUser = email ? await User.findOne({ where: { email } }) : null;
        let examSections = await this.examService.getExamSections(exam.id);
        let candidateSectionNames = item.Subjects.toLowerCase().trim().split(",");
        let candidateSections = examSections.data.filter((s) => {
            return (candidateSectionNames.includes(s.subject.toLowerCase().trim()))
        });
        if(existingCandidate || existingCandidateId  || existingUser){
          let candidateIdToCheck = existingCandidate
            ? existingCandidate.id
            : existingCandidateId
            ? existingCandidateId.id
            : existingUser
            ? existingUser.id
            : null; 

          const candExam = await CandidateExam.findOne({where:{examId:importDto.examId,candidateId:candidateIdToCheck}});
          if(candExam){
              return {
                status: 400,
                message:`This candidate: ${email} with ${candidateIdToCheck} has been registered for this exam already, check for duplicate candidateId or email`,
                error: true
            }
          }
          else{
          
            for(let sub of candidateSectionNames){
               let isIncluded = examSections.data.find((s) => s.subject.trim().replace(/\s+/g, '').toLowerCase() === sub.trim().replace(/\s+/g, '').toLowerCase())
                if(!isIncluded){
                   return {
                     status: 400,
                     message:`Invalid subject: ${sub} for ${email}`,
                     error:true
                   }
                }
              }
            await Candidate.update({
              firstName:item.FirstName,
              lastName:item.LastName,
              imported:true,
              password: hashedPassword || undefined,
              plainPassword: plainPassword || undefined,
            },{where:{id:candidateIdToCheck }})
            
            candidateExamsToCreate.push({
              examId: importDto.examId,
              candidateId: candidateIdToCheck,
              isOnline: false,
              isSubmitted: false,
              assignedSubjects:item.Subjects,
              timer: (exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null,
              centerId:(importDto.centerId)?importDto.centerId:null
            })

          
            
          
             for(let c of candidateSections ){
              candidateSectionsToCreate.push({
                candidateId:candidateIdToCheck ,
                sectionId:c.id,
                timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
              })
            }
            
          
          }
        } else {
          //const username = await this.generateUsername(item.FirstName);
          const photoPath = `../../../../uploads/candidates-pictures/${photo}`
          const dataUrl = await this.convertToBase64DataURL(photoPath);
          console.log(dataUrl);

          const candidateData = {
            username:(candidateId !== null && candidateId !== '' )? candidateId : (await this.generateUsername(item.FirstName)),
            password: hashedPassword || '',
            lastName: item.LastName,
            firstName: item.FirstName,
            centerId: item.centerId,
            email,
            assignedSubjects: item.Subjects,
            token: this.generateVerificationToken(),
            status: CandidateStatus.PENDING,
            picture:dataUrl,
            imported: true,
            plainPassword: plainPassword || null,
            id:(candidateId !== null && candidateId !== '' )? candidateId : uuidv4()

          };
  
          candidatesToCreate.push(candidateData);
  
          candidateExamsToCreate.push({
            examId: importDto.examId,
            candidateId: candidateData.id,
            isOnline: false,
            isSubmitted: false,
            assignedSubjects: item.Subjects,
            timer: (exam.setOverallTimer || exam.timeLimit) ? exam.timeLimit : null,
            centerId:(importDto.centerId)?importDto.centerId:null,
            id:uuidv4()
          });
  
 
      
          for(let sub of candidateSectionNames){
            let isIncluded = examSections.data.find((s) => s.subject.trim().replace(/\s+/g, '').toLowerCase() === sub.trim().replace(/\s+/g, '').toLowerCase())
            if(!isIncluded){
                return {
                  status: 400,
                  message:`Invalid subject: ${sub} for ${email}`,
                  error:true
                }
            }
          }
          for (const c of candidateSections) {
            candidateSectionsToCreate.push({
              id:uuidv4(),
              candidateId: candidateData.id,
              sectionId: c.id,
              timer: (exam.setSectionTimer || c.timeLimit) ? c.timeLimit : null,
            });
          }

        }
      }
  
      // Perform bulk inserts with individual error handling
      await Candidate.bulkCreate(candidatesToCreate);
  
      await CandidateExam.bulkCreate(candidateExamsToCreate);
  
      await CandidateSection.bulkCreate(candidateSectionsToCreate);
  
      if(importDto.centerId){
        const examDownloaded = await ExamCenter.findOne({where:{examId:importDto.examId, centerId:importDto.centerId, isDownloaded:true}});
        if(examDownloaded){
          await this.createExamHistory('Candidate', 'INSERT', importDto.examId, candidatesToCreate);
          await this.createExamHistory('CandidateExam', 'INSERT', importDto.examId, candidateExamsToCreate);
          await this.createExamHistory('CandidateSection', 'INSERT', importDto.examId, candidateSectionsToCreate);
        }
      }
  
  
      return {
        status: 200,
        message: `You have successfully imported ${rows.length} candidates for this exam`,
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: e.message,
        error: true,
      };
    }
  }
  
  private async createExamHistory(tableName: string, operation: string, examId: string, recordsToCreate: any[]): Promise<void> {
    for (const record of recordsToCreate) {
      await ExamHistory.create({
        tableName,
        operation,
        examId,
        recordId: record.id,
        isActive: true,
      });
    }
  }
async inviteCandidates(inviteDto: InviteCandidateDto): Promise<ApiResponse> {
  try {
    // Check if exam exists]
    const exam = await Exam.findByPk(inviteDto.examId);
    if (!exam) {
      return {
        status: 400,
        message: "Exam with this id does not exist",
        error: true
      };
    }
   
    const candidateExams = await CandidateExam.findAll({where:{examId:inviteDto.examId}});
    console.log(candidateExams);
    let candidates = [];
    
    for(let c of candidateExams){
       const cand = await Candidate.findOne({where:{id:c.candidateId, imported:true,status:CandidateStatus.PENDING}});
       if(cand===null) continue;
       candidates.push(cand);
    }
    let title = exam.title;
    let startDate = exam.startTime;
    let endDate = exam.endTime;
    for(let candidate  of candidates){
      let token = this.generateVerificationToken();
      let loginLink = `${this.candidateUrl}auth/login?id=${exam.id}`;
      //let rejectLink = `${this.appUrl}/candidate/decline-invite?token=${token}?username?=${candidate.username}`;
      let firstName = candidate.FirstName;
   
      let username = candidate.username;
      let password = "";
      let plainPassword = "";
      if(exam.type === ExamType.PASSWORDED){
         plainPassword = await this.generatePassword(8);
         password =  await hash(plainPassword,10);
      }

    
      const html = await candidateWelcomeTemplate({
        loginLink,
        username,
        password,
        firstName,
        title,
        startDate,
        endDate
      });
      
      let to = candidate.phoneNo;
      let from = this.appPhone;
      let body = `Congratulations, ${candidate.firstName}, 
                  you have been invited to take ${exam.title} exam scheduled to hold
                  between ${exam.startTime} and ${exam.endTime}. 
                  Your username is ${candidate.username} and password is ${password}. 
                  Login here:${loginLink}`
     
      if(inviteDto.method === InviteMethod.EMAIL){
        // await this.emailService.sendEmailSendgrid(
        //   html,
        //   candidate.email,
        //   'Exam Invite',
        // );
        await this.emailService.sendEmail(
          candidate.email,
          'Exam Invite',
          html,
          true
        );
      }
      else if(inviteDto.method === InviteMethod.SMS){
        
        let res = await this.smsService.sendMessage(to, from,body);
         
      }
      else if(inviteDto.method === InviteMethod.BOTH){
        // await this.emailService.sendEmailSendgrid(
        //   html,
        //   candidate.email,
        //   'Exam Invite',
        // );
        await this.emailService.sendEmail(
          candidate.email,
          'Exam Invite',
          html,
          true
        );
        let res = await this.smsService.sendMessage(to, from,body);
        
      }
       
      await Candidate.update({
        password: password,
        plainPassword: plainPassword,
        token: token,
        status:CandidateStatus.INVITED
      },{where:{id:candidate.id}});

      await Exam.update({
        inviteSent: true
      },{where:{id:exam.id}});
     
    }


    return {
      status: 200,
      message: `You have successfully invited ${candidates.length} candidates for this exam`,
      error: false
    };
  } catch (e) {
    console.log(e);
    return {
      status: 500,
      message: e.message,
      error: true
    };
  }
}
  
  async getExamSubjects(examId) {
    try {
      const exam = await Exam.findByPk(examId, {
        include: { model: Item },
      });
  
      const subjects = [...new Set(exam.items.map((item) => item.questionSubject.toLowerCase()))];
      return subjects;
    } catch (e) {
      throw e;
    }
  }
  async faceCapturing(user,faceDto: FaceCaptureDto){
    try{
       const exam = await Exam.findByPk(faceDto.examId);
       if(!exam){
         return {
           status: 400,
           message:"Invalid Exam id",
           error: true
         }
       }
       if(exam && !exam.faceCaptureRequired){
         return {
           status: 400,
           message:"face capturing is not required for this exam",
           error: true
         }
       }
       if(faceDto.centerId){
        const examCenter = await ExamCenter.findOne({where:{examId: faceDto.examId, centerId:faceDto.centerId}});
        if(!examCenter){
          return {
            status: 400,
            message:"Invalid exam center",
            error: true
          }
        }

        if(user.roles.includes("local-admin")){
          const center = await Center.findByPk(faceDto.centerId);
          if(examCenter && examCenter.adminId !== user.sub){
             return {
               status:403,
               message: "you do not have enough priviledges to capture faces for exam in this center",
               error: true
             }
          }
         }
       }
     
       const candidateExam = await CandidateExam.findOne({where: {
        candidateId: faceDto.candidateId,
        examId: faceDto.examId,
      }});
       if(!candidateExam){
         return {
           status: 400,
           message:"There is no candidate with the specified id for this exam",
           error: true
         }
       }
       //let resizedPhoto = await this.examService.resizeBase64Image(faceDto.capturedFace, 200,200);
       await CandidateExam.update({faceCaptured:faceDto.capturedFace}, {
        where:{id: candidateExam.id}})
       return {
         status: 200,
         message:"face captured successfully",
         error: false
       }
    }
    catch(e){
      return {
        status: 500,
        message:"An Error occurred",
        error: true
      }
    }
  }
  
  async registerCandidateForOnPremise(registerDto: RegisterCandidateForPremiseDto){
    try{
        const exam = await Exam.findByPk(registerDto.examId);
        if(!exam){
            return {
                status: 400,
                message: "Exam with this id does not exist",
                error: true
            }
        }
        if(exam.deliveryMode!=='on-premise'){
          return {
              status:400,
              message:"The specified exam is not  on-premise",
              error: true
          }
        }
   
        var center = await Center.findByPk(registerDto.centerId);
        if(!center){
            return {
                 status: 400,
                 message:"Center with this id does not exist",
                 error: true
            }
        }
        registerDto.email = registerDto.email?.trim() || null;
        const existingCandidate = registerDto.email ? await Candidate.findOne({where:{email:registerDto.email}}) : null;
        const existingUser = registerDto.email ? await User.findOne({where:{email: registerDto.email}}) : null;
        if(existingUser){
          return {
            status: 400,
            message:"Only a candidate's email can be registered for an exam, please use a new email or an existing candidate's email",
            error: true
          }
        }
        if(existingCandidate){
          const candExam = await CandidateExam.findOne({where:{examId:registerDto.examId,candidateId:existingCandidate.id}})
          if(candExam){
              return {
                status: 400,
                message:"This email has been registered for this exam already",
                error: true
            }
          }
          else{
        
         
          //   const html = `<div>Congratulations ${existingCandidate.firstName}, you have been registered for this exam. proceed to login with your existing details
          //  </div>`
        
            
            await CandidateExam.create({
              examId: registerDto.examId,
              candidateId: existingCandidate.id,
              isOnline: false,
              isSubmitted: false,
              assignedSubjects:registerDto.subject.join(","),
              timer: (exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null,
              centerId:registerDto.centerId
            })

            let examSections = await this.examService.getExamSections(exam.id);
            let candidateSectionNames = registerDto.subject;
            let candidateSections = examSections.data.filter((s) => {
                return (candidateSectionNames.includes(s.subject.toLowerCase().trim()))
            });

            console.log("candidateSections", candidateSections)
            console.log("candidateSectionNames", candidateSectionNames)
          
             for(let c of candidateSections ){
              await CandidateSection.create({
                candidateId:existingCandidate.id,
                sectionId:c.id,
                timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
              })
            }
          //  await this.emailService.sendEmailSendgrid(
          //    html,
          //    registerDto.email,
          //    'Exam Registration',
          //  );

          const text = `Congratulations ${existingCandidate.firstName}, you have been registered for this exam. Proceed to login with your existing details.`;

          await this.emailService.sendEmail(
            registerDto.email,
            'Exam Registration',
            text
          );
           
           const settings = await Setting.findAll();
           if(settings[0].notificationPreferences.forOnlineExamReg){
             const currentDateTime = moment();
             const currentDate = currentDateTime.format('DD-MMM-YYYY');
             const currentTime = currentDateTime.format('h:mma');
             await this.notificationService.createNotification({
               subject: `${existingCandidate.firstName} ${existingCandidate.lastName} registered for ${exam.title} exam online`,
               message:`registration completed on ${currentDate} at ${currentTime}`,
               isScheduled:false,
               sentOn:new Date().toISOString()
             })
           }
                
           return {
               status: 200,
               message:`You have registered successfully`,
               error: false
           }
          }
        }
    
      
 
       // Use the provided candidateId as username instead of auto-generating
       let username = registerDto.candidateId;
       let password = '';
       let plainPassword = registerDto.plainPassword || '';
       
       if(exam.type === "passworded" && !plainPassword){
         plainPassword  = await this.generatePassword();
         password = await hash(plainPassword,10);
       } else if (plainPassword) {
         password = await hash(plainPassword,10);
       }
       
       const candidate = await Candidate.create({
        username: username,
        password: password,
        lastName:registerDto.lastName,
        firstName:registerDto.firstName,
        centerId:registerDto.centerId,
        email: registerDto.email,
        assignedSubjects:registerDto.subject.join(","),
        token: this.generateVerificationToken(),
        status:CandidateStatus.PENDING,
        picture: registerDto.photo,
        plainPassword: plainPassword,
        id: registerDto.candidateId
       })
     
      
      await CandidateExam.create({
         examId: registerDto.examId,
         candidateId: candidate.id,
         isOnline: false,
         isSubmitted: false,
         assignedSubjects:registerDto.subject.join(","),
         timer: (exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null,
         centerId:registerDto.centerId
       });
      

      let examSections = await this.examService.getExamSections(exam.id);
      let candidateSectionNames = registerDto.subject;
      let candidateSections = examSections.data.filter((s) => {
          return (candidateSectionNames.includes(s.subject.toLowerCase().trim()))
      });
    
       for(let c of candidateSections ){
        await CandidateSection.create({
          candidateId:candidate.id,
          sectionId:c.id,
          timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
        })
      }


 
      //  let token = this.generateVerificationToken();
      //  let acceptLink = `${this.appUrl}/candidate/accept-invite?token=${token}?username?=${username}`;
      //  let rejectLink = `${this.appUrl}/candidate/decline-invite?token=${token}?username?=${username}`
      //  let firstName = registerDto.firstName;
      //  const html = await candidateWelcomeTemplate({
      //   acceptLink,rejectLink,username,firstName
      //  });

    //   const html = `<div>Congratulations, your registration is successful. proceed to login with the following details:
    //   <p><b>username: ${username}</b></p>
    //  <p><b>password:${plainPassword}</b></p>
    //  </div>`
    //  await this.emailService.sendEmailSendgrid(
    //    html,
    //    registerDto.email,
    //    'Exam Registration',
    //  );
    const text = `Congratulations, your registration is successful. Proceed to login with the following details:
      Username: ${username}
      Password: ${plainPassword}`;

    await this.emailService.sendEmail(
      registerDto.email,
      'Exam Registration',
      text
    );
    
     const settings = await Setting.findAll();
     if(settings[0].notificationPreferences.forOnlineExamReg){
       const currentDateTime = moment();
       const currentDate = currentDateTime.format('DD-MMM-YYYY');
       const currentTime = currentDateTime.format('h:mma');
       await this.notificationService.createNotification({
         subject: `${candidate.firstName} ${candidate.lastName} registered for ${exam.title} exam online`,
         message:`registration completed on ${currentDate} at ${currentTime}`,
         isScheduled:false,
         sentOn:new Date().toISOString()
       })
     }
          
     return {
         status: 200,
         message:`You have registered successfully`,
         error: false
     }
    }
    catch(e){
     console.log(e);
      return {
         status:500,
         message:e.message,
         error: true
      }
    }
   }

   async reAssignCandidateToCenter(reassignDto: ReassignToCenterDto){
    try{
        const exam = await Exam.findByPk(reassignDto.examId);
        if(!exam){
            return {
                status: 400,
                message: "Exam with this id does not exist",
                error: true
            }
        }
        if(exam.deliveryMode!=='on-premise'){
          return {
              status:400,
              message:"The specified exam is not  on-premise",
              error: true
          }
        }
   
       let center = await Center.findByPk(reassignDto.centerId);
        
      const examCenter = await ExamCenter.findOne({where:{examId:reassignDto.examId, centerId: reassignDto.centerId}})
      if(!center || !examCenter){
        return {
            status: 400,
            message:"Invalid exam center",
            error: true
        }
      }
      const candExam = await CandidateExam.findOne({where:{examId:reassignDto.examId, candidateId:reassignDto.candidateId}})
      if(!candExam){
        return {
            status: 400,
            message:"Candidate not registered for this exam",
            error: true
        }
      }
        await CandidateExam.update({
          centerId:reassignDto.centerId
        }, {where:{candidateId:reassignDto.candidateId, examId:reassignDto.examId}})
        
      
        if(examCenter && examCenter.isDownloaded){
          await ExamHistory.create({
            tableName:'CandidateExam',
            operation:'DELETE',
            examId:reassignDto.examId,
            recordId: candExam.id,
            isActive: true,
            centerAffected:candExam.centerId
          });

          await ExamHistory.create({
            tableName:'Candidate',
            operation:'DELETE',
            examId:reassignDto.examId,
            recordId: candExam.candidateId,
            isActive: true,
            centerAffected:candExam.centerId
          });
        }
        //to be removed 
        await Candidate.update({
          centerId:reassignDto.centerId
        }, {where:{id:reassignDto.candidateId}})
      

     return {
         status: 200,
         message:`You have successfully reassigned candidate`,
         error: false
     }
    }
    catch(e){
     console.log(e);
      return {
         status:500,
         message:e.message,
         error: true
      }
    }
   }

   async reAssignSubjectToCandidate(reassignDto: ReassignSubjectDto){
    try{
        const exam = await Exam.findByPk(reassignDto.examId);
        if(!exam){
            return {
                status: 400,
                message: "Exam with this id does not exist",
                error: true
            }
        }
        const candExam = await CandidateExam.findOne({where:{candidateId:reassignDto.candidateId, examId:reassignDto.examId}})
        if(!candExam){
          return {
              status: 400,
              message: "Invalid examId or candidateId",
              error: true
          }
        }
        let newSubjects = reassignDto.subjects.join(",")
        await CandidateExam.update({
          assignedSubjects:newSubjects
        }, {where:{candidateId:reassignDto.candidateId, examId:reassignDto.examId}})
       
        await ExamHistory.create({
          tableName:'CandidateExam',
          operation:'UPDATE',
          examId:reassignDto.examId,
          recordId: candExam.id,
          isActive: true
        });
  
     return {
         status: 200,
         message:`You have successfully reassigned candidate`,
         error: false
     }
    }
    catch(e){
     console.log(e);
      return {
         status:500,
         message:e.message,
         error: true
      }
    }
   }


  async registerCandidateForOnline(registerDto: RegisterCandidateForOnlineDto):Promise<ApiResponse>{
    try{
        const exam = await Exam.findByPk(registerDto.examId);
        if(!exam){
            return {
                status: 400,
                message: "Exam with this id does not exist",
                error: true
            }
         }
     
           if(exam.deliveryMode!=='online'){
            
               return {
                   status:400,
                   message:"specified exam is not an online exam",
                   error: true
               }
           }
         const existingCandidate = registerDto.email ? await Candidate.findOne({where:{email:registerDto.email}}) : null;
         const existingUser = registerDto.email ? await User.findOne({where:{email: registerDto.email}}) : null;
         if(existingUser){
          return {
            status: 400,
            message:"Only a candidate's email can be registered for an exam, please use a new email or an existing candidate's email",
            error: true
          }
        }
         if(existingCandidate){
          const candExam = await CandidateExam.findOne({where:{examId:registerDto.examId,candidateId:existingCandidate.id}})
          if(candExam){
              return {
                status: 400,
                message:"This email has been registered for this exam already",
                error: true
            }
          }
          else{
        
          //   const html = `<div>Congratulations ${existingCandidate.firstName}, you have been registered for this exam. proceed to login at <a href="${this.candidateUrl}auth/login?id=${registerDto.examId}">jota_exams</a> with your existing username and password
          //  </div>`
        
          const text = `Congratulations ${existingCandidate.firstName}, you have been registered for this exam. Proceed to login at jota_exams with your existing username and password.

             Login Link: ${this.candidateUrl}auth/login?id=${registerDto.examId}`;

          
            await CandidateExam.create({
              examId: registerDto.examId,
              candidateId: existingCandidate.id,
              isOnline: false,
              isSubmitted: false,
              assignedSubjects:registerDto.subject.join(","),
              timer:(exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null
            })
            let examSections = await this.examService.getExamSections(exam.id);
            let candidateSectionNames = registerDto.subject;
            console.log("candidateSectionNames", candidateSectionNames)
            let candidateSections = examSections.data.filter((s) => {
                return (candidateSectionNames.includes(s.subject.toLowerCase().trim()))
            });
            console.log("candidateSections", candidateSections)
          
             for(let c of candidateSections ){
              await CandidateSection.create({
                candidateId:existingCandidate.id,
                sectionId:c.id,
                timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
              })
            }
          //  await this.emailService.sendEmailSendgrid(
          //    html,
          //    registerDto.email,
          //    'Exam Registration',
          //  );
          await this.emailService.sendEmail(
            registerDto.email,
            'Exam Registration',
            text
          );
          
           
           const settings = await Setting.findAll();
           if(settings[0].notificationPreferences.forOnlineExamReg){
             const currentDateTime = moment();
             const currentDate = currentDateTime.format('DD-MMM-YYYY');
             const currentTime = currentDateTime.format('h:mma');
             await this.notificationService.createNotification({
               subject: `${existingCandidate.firstName} ${existingCandidate.lastName} registered for ${exam.title} exam online`,
               message:`registration completed on ${currentDate} at ${currentTime}`,
               isScheduled:false,
               sentOn:new Date().toISOString()
             })
           }
                
           return {
               status: 200,
               message:`You have registered successfully`,
               error: false
           }
          }
         }
        
          // Use the provided candidateId as username instead of auto-generating
          let username = registerDto.candidateId;
          let password = '';
          let plainPassword = registerDto.plainPassword || '';
          
          if(exam.type === "passworded" && !plainPassword){
            plainPassword  = await this.generatePassword();
            password = await hash(plainPassword,10);
          } else if (plainPassword) {
            password = await hash(plainPassword,10);
          }
          
          const candidate = await Candidate.create({
           username: username,
           password: password,
           lastName:registerDto.lastName,
           firstName:registerDto.firstName,
           email: registerDto.email,
           assignedSubjects:registerDto.subject.join(","),
           token: this.generateVerificationToken(),
           status:CandidateStatus.PENDING,
           picture: registerDto.photo,
           plainPassword:plainPassword,
           id: registerDto.candidateId
          })
        
         
         await CandidateExam.create({
            examId: registerDto.examId,
            candidateId: candidate.id,
            isOnline: true,
            isSubmitted: false,
            assignedSubjects: registerDto.subject.join(","),
            timer:(exam.setOverallTimer||exam.timeLimit)?exam.timeLimit:null
          })
    
       
          let examSections = await this.examService.getExamSections(exam.id);
          let candidateSectionNames = registerDto.subject;
          let candidateSections = examSections.data.filter((s) => {
              return (candidateSectionNames.includes(s.subject.toLowerCase().trim()))
          });
        
        
           for(let c of candidateSections ){
            await CandidateSection.create({
              candidateId:candidate.id,
              sectionId:c.id,
              timer:(exam.setSectionTimer||c.timeLimit)?c.timeLimit:null,
            })
          }
          // let token = this.generateVerificationToken();
          // let acceptLink = `${this.appUrl}/candidate/accept-invite?token=${token}?username?=${username}`;
          // let rejectLink = `${this.appUrl}/candidate/decline-invite?token=${token}?username?=${username}`
          // let firstName = registerDto.firstName;
          // const html = await candidateWelcomeTemplate({
          //  acceptLink,rejectLink,username,firstName
          // });

        //   const html = `<div>Congratulations, your registration is successful. proceed to login at <a href="${this.candidateUrl}auth/login?id=${registerDto.examId}">jota_exams</a> with the following details:
        //   <p><b>username: ${username}</b></p>
        //  <p><b>password:${plainPassword}</b></p>
        //  </div>`
          // await this.emailService.sendEmailSendgrid(
          //   html,
          //   registerDto.email,
          //   'Exam Registration',
          // );
          const text = `Congratulations, your registration is successful. Proceed to login at jota_exams with the following details:
                  username: ${username}
                  password: ${plainPassword}

                  Login Link: ${this.candidateUrl}auth/login?id=${registerDto.examId}`;

          try {
            await this.emailService.sendEmail(
              registerDto.email,
              'Exam Registration',
              text
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Do not fail registration due to email error
          }
          
           const settings = await Setting.findAll();
           if(settings[0].notificationPreferences.forOnlineExamReg){
             const currentDateTime = moment();
             const currentDate = currentDateTime.format('DD-MMM-YYYY');
             const currentTime = currentDateTime.format('h:mma');
             await this.notificationService.createNotification({
               subject: `${candidate.firstName} ${candidate.lastName} registered for ${exam.title} exam online`,
               message:`registration completed on ${currentDate} at ${currentTime}`,
               isScheduled:false,
               sentOn:new Date().toISOString()
             })
           }
          
        return {
            status: 200,
            message:`You have registered successfully`,
            error: false
        }
       }
       catch(e){
        console.log(e);
         return {
            status:500,
            message:e.message,
            error: true
         }
       }
  }

  async getOnlineImportedCandidates(examId:string, page: number = 1, limit: number = 10): Promise<ApiResponse> {
    const offset = (page - 1) * limit;
  
    try {
      let {rows, count} = await Candidate.findAndCountAll({
        limit: Number(limit),
        offset,
        where: {imported: true, isDeleted: false}
      });

      let candidateData = [];
      
      for(let person of rows){
   
        let candidateExam = await CandidateExam.findOne({where:{
          candidateId:person.id,
          examId: examId
        }})

        candidateData.push({
          ...person,
          assignedSubjects:candidateExam.assignedSubjects,
          faceCaptured:candidateExam.faceCaptured,
        })
      }
    
  
      return {
        status: 200,
        message: 'Online imported candidates retrieved successfully',
        data: candidateData,
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
  // async getAllImportedCandidates(examId:string, page: number = 1,limit: number = 10,sortBy:string="createdAt",filter?:string,searchValue?:string): Promise<ApiResponse> {
  //   const offset = (page - 1) * limit;
 
  //   try {
  //     let { rows, count } = await CandidateExam.findAndCountAll({
  //       limit: Number(limit),
  //       offset:offset,
  //       where:{examId:examId}
  //     });
   

   
  //    let newCount = 0;
  //     let result = [];
  //     for(let item of rows){
      
  //        const cand = await Candidate.findOne({
  //         where:{id:item.candidateId, imported:true, isDeleted:false},
  //         include: [
  //           {
  //             model: CandidateExam,
  //             where: { examId: examId },
  //           }
  //         ],
  //       })
        
  //        if(!cand){
  //          continue;
  //        }
  //       // let profile = rows.find((item) => item.id == cand.candidateId);
  //        result.push({
  //         ...cand.dataValues,
  //         faceCaptured:item.faceCaptured,
  //         assignedSubjects: item.assignedSubjects
  //       });
  //        newCount++;
  //     }
  //     let filteredCount = newCount;
  //     if(filter && searchValue){
  //       let filteredResult = await this.searchCandidate(filter, searchValue, result);
  //       count =  filteredResult.length;
  //       result = filteredResult;
  //       filteredCount = filteredResult.length;
  //     }
      
  //     if(sortBy){
  //       result = await this.sortResults(result, sortBy)
  //      }
  
  //     return {
  //       status: 200,
  //       message: 'imported candidates retrieved successfully',
  //       data: result,
  //       pageInfo: {
  //         totalItems: filteredCount,
  //         totalPages: Math.ceil(filteredCount / limit),
  //         currentPage: page,
  //       },
  //       error: false,
  //     };
  //   } catch (err) {
  //     return {
  //       status: 500,
  //       message: err.message,
  //       error: true,
  //     };
  //   }
  // }
  async getAllImportedCandidates(
    examId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    filter?: string,
    searchValue?: string
  ): Promise<ApiResponse> {
    try {
      const offset = (page - 1) * limit;
  
      let { rows, count } = await CandidateExam.findAndCountAll({
        limit: Number(limit),
        offset: offset,
        where: { examId: examId }
      });
      
      if(filter && searchValue){
        rows = await CandidateExam.findAll({
          where: { examId: examId }
        });
      }
      let result: any[] = [];
      const allImported = await Candidate.findAndCountAll({
        where: { imported: true, isDeleted: false },
        include: [
          {
            model: CandidateExam,
            where: { examId: examId }
          }
        ]
      });
      for (const item of rows) {
        const cand = await Candidate.findOne({
          where: { id: item.candidateId, imported: true, isDeleted: false },
          include: [
            {
              model: CandidateExam,
              where: { examId: examId }
            }
          ]
        });
  
        if (cand) {
          result.push({
            ...cand.dataValues,
            faceCaptured: item.faceCaptured,
            assignedSubjects: item.assignedSubjects
          });
        }
      }
  
      let filteredCount = result.length;
  
      if (filter && searchValue) {
        result = await this.searchCandidate(filter, searchValue, result);
        filteredCount = result.length;
      }
  
      if (sortBy) {
        result = await this.sortResults(result, sortBy);
      }
  
      const totalPages = Math.ceil(filteredCount / limit);
  
      return {
        status: 200,
        message: 'Imported candidates retrieved successfully',
        data: result,
        pageInfo: {
          totalItems: allImported.count,
          totalPages: totalPages,
          currentPage: page
        },
        error: false
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message || 'Internal server error',
        error: true
      };
    }
  }
  

  async searchCandidate(filter, searchValue, result) {
    try {
      const filterProperty = (record, property) => (
        record[property].toLowerCase().startsWith(searchValue.toLowerCase()) ||
        record[property].toLowerCase().includes(searchValue.toLowerCase())
      );
  
      let filteredResult = [];
  
      switch (filter) {
        case "email":
          filteredResult = result.filter((record) => filterProperty(record, "email"));
          break;                                                  
        case "username":
          filteredResult = result.filter((record) => filterProperty(record, "username"));
          break;
        case "firstName":
          filteredResult = result.filter((record) => filterProperty(record, "firstName"));
          break;
        case "lastName":
          filteredResult = result.filter((record) => filterProperty(record, "lastName"));
          break;
        default:
          console.error("Invalid filter type");
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
  

async getAllCandidates(examId:string,  page: number = 1, limit: number = 10,  sortBy:string = "createdAt",filter, searchValue): Promise<ApiResponse> {
  const offset = (page - 1) * limit;

  try {
     const  exam = await Exam.findByPk(examId);
     if(!exam){
       return {
         status:400,
         message:"Invalid Exam Id",
         error:true
       }
     }
   


    let {rows, count} = await CandidateExam.findAndCountAll({
      limit: Number(limit),
      offset,
      where: {examId:examId}
    });

    if(filter && searchValue){
      rows = await CandidateExam.findAll({
        where: { examId: examId }
      });
    }
    
    let candidates = [];
    for(let person of rows){
       let candidate = await Candidate.findByPk(person.candidateId);
       if(candidate.isDeleted === true) continue;
       candidates.push({
        ...candidate.dataValues,
        assignedSubjects: person.assignedSubjects,
        faceCaptured:person.faceCaptured
      });
    }

    
    if(filter && searchValue){
      let filteredResult = await this.searchCandidate(filter, searchValue, candidates);
      count =  filteredResult.length;
      candidates = filteredResult;     
    }

     if(sortBy){
      candidates = await this.sortResults(candidates, sortBy)
     }

    return {
      status: 200,
      message: 'candidates retrieved successfully',
      data: candidates,
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

async getCandidatesWithoutPagination( examId:string, sortBy:string = "createdAt",filter, searchValue): Promise<ApiResponse> {

  try {
     const  exam = await Exam.findByPk(examId);
     if(!exam){
       return {
         status:400,
         message:"Invalid Exam Id",
         error:true
       }
     }
   
   


    let rows = await CandidateExam.findAll({
      where: {examId: examId}
    });
    
    let candidates = [];
    for(let person of rows){
       let candidate = await Candidate.findByPk(person.candidateId);
       candidates.push({
        candidate,
        assignedSubjects: person.assignedSubjects,
        faceCaptured:person.faceCaptured
      });
    }

        
    if(filter && searchValue){
      let filteredResult = await this.searchCandidate(filter, searchValue, candidates);
      candidates = filteredResult;
    }

    if(sortBy){
      candidates = await this.sortResults(candidates, sortBy)
     }
    return {
      status: 200,
      message: 'candidates retrieved successfully',
      data: candidates,
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
  // async getOnlineRegisteredCandidates(examId:string, page: number = 1, limit: number = 10): Promise<ApiResponse> {
  //   const offset = (page - 1) * limit;
  
  //   try {
  //     let {rows, count} = await Candidate.findAndCountAll({
  //       limit: Number(limit),
  //       offset,
  //       where: {imported: false}
  //     });
      

  //      rows = rows.filter(async (person)=>{
  //        let candidateExam = await CandidateExam.findOne({where:{
  //           candidateId:person.id,
  //           isOnline: true,
  //           examId: examId
  //       }})
  //       if(candidateExam){
  //           return true
  //       }
  //       return false;
  //     })
  
  //     return {
  //       status: 200,
  //       message: 'Online registration candidates retrieved successfully',
  //       data: rows,
  //       pageInfo: {
  //         totalItems: count,
  //         totalPages: Math.ceil(count / limit),
  //         currentPage: page,
  //       },
  //       error: false,
  //     };
  //   } catch (err) {
  //     return {
  //       status: 500,
  //       message: err.message,
  //       error: true,
  //     };
  //   }
  // }




//   async getOnPremiseRegisteredCandidates(examId:string, page: number = 1, limit: number = 10): Promise<ApiResponse> {
//     const offset = (page - 1) * limit;
  
//     try {
//       let {rows, count} = await Candidate.findAndCountAll({
//         limit: Number(limit),
//         offset,
//         where: {imported: false}
//       });
      

//        rows = rows.filter(async (person)=>{
//          let candidateExam = await CandidateExam.findOne({where:{
//             candidateId:person.id,
//             isOnline: false,
//             examId: examId
//         }})
//         if(candidateExam){
//             return true
//         }
//         return false;
//       })
  
//       return {
//         status: 200,
//         message: 'Online registration candidates retrieved successfully',
//         data: rows,
//         pageInfo: {
//           totalItems: count,
//           totalPages: Math.ceil(count / limit),
//           currentPage: page,
//         },
//         error: false,
//       };
//     } catch (err) {
//       return {
//         status: 500,
//         message: err.message,
//         error: true,
//       };
//     }
//   }


async getOnlineRegisteredCandidates(examId: string, page: number = 1,limit: number = 10,sortBy:string="createdAt",filter?:string,searchValue?:string): Promise<ApiResponse> {
  const offset = (page - 1) * limit;

  try {
    let { count, rows } = await Candidate.findAndCountAll({
      limit: Number(limit),
      offset,
      where: { imported: false, isDeleted:false },
      include: [
        {
          model: CandidateExam,
          where: { examId: examId },
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    let result = rows;
    if(filter && searchValue){
      let filteredResult = await this.searchCandidate(filter, searchValue, result);
      count =  filteredResult.length;
      result = filteredResult;
    
    }
    

    return {
      status: 200,
      message: 'Online registration candidates for the specified exam retrieved successfully',
      data: result,
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


  async getOnPremiseImportedCandidates(examId:string, page: number = 1, limit: number = 10): Promise<ApiResponse> {
    const offset = (page - 1) * limit;
  
    try {
      let {rows, count} = await Candidate.findAndCountAll({
        limit: Number(limit),
        offset,
        where: {imported: true, isDeleted: false}
      });
      

       rows = rows.filter(async (person)=>{
         let candidateExam = await CandidateExam.findOne({where:{
            candidateId:person.id,
            isOnline: false,
            examId: examId
        }})
        if(candidateExam){
            return true
        }
        return false;
      })
  
      return {
        status: 200,
        message: 'Online registration candidates retrieved successfully',
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

 async acceptInvite(username:string , token:string){
    const candidate = await Candidate.findOne({where:{username,token}});
    if(!candidate ){
      return {
         status: 400,
         message: "Invalid Link",
         error:true
      }
    }
    await Candidate.update(
        {token:null,status:CandidateStatus.ACCEPTED},
        {where:{id: candidate.id}});

    const settings = await Setting.findAll();
    if((settings[0].notificationPreferences.allowAll)|| (settings[0].notificationPreferences.onInviteAcceptance)){
      const currentDateTime = moment();
      const currentDate = currentDateTime.format('DD-MMM-YYYY');
      const currentTime = currentDateTime.format('h:mma');
      await this.notificationService.createNotification({
        subject: `${candidate.firstName} ${candidate.lastName} accepted exam invite`,
        message:`invite accepted on ${currentDate} at ${currentTime}`,
        isScheduled:false,
        sentOn:new Date().toISOString()
      })
    }
    
    return {
        status:200,
        message:"Invited accepted",
        error: false
    }

 }

 async rejectInvite(username:string , token:string){
    const candidate = await Candidate.findOne({where:{username,token}});
    if(!candidate ){
      return {
         status: 400,
         message: "Invalid Link",
         error:true
      }
    }
    await Candidate.update(
        {token:null,status:CandidateStatus.DECLINED},
        {where:{id: candidate.id}});
    const currentDateTime = moment();
    const currentDate = currentDateTime.format('DD-MMM-YYYY');
    const currentTime = currentDateTime.format('h:mma');

    await this.notificationService.createNotification({
      subject: `${candidate.firstName} ${candidate.lastName} declined exam invite`,
      message:`invite declined on ${currentDate} at ${currentTime}`,
      isScheduled:false,
      sentOn:new Date().toISOString()
    })
    return {
        status:200,
        message:"Invited declined",
        error: false
    }

 }
 
 async cancelInvite(cancelDto: CancelInviteDto):Promise<ApiResponse>{
   const exam = await Exam.findByPk(cancelDto.examId);
   if(!exam){
     return {
         status:400,
         message:"Exam with this id does not exist",
         error:true
     }
   }

   cancelDto.candidateIds.forEach(async (id) =>{
        const candidate = await Candidate.findByPk(id);
        if(!candidate){
            return {
                status: 400,
                message:`candidate with id: ${id} does not exist `,
                error: true
            }
        }

        if(candidate.status !== CandidateStatus.PENDING){
            return {
                status: 400,
                message:`candidate ${candidate.email} has already ${candidate.status} invite `,
                error: true
            }
        }

        await Candidate.update(
            {token:null},
            {where:{
                id:id,
                status:CandidateStatus.PENDING
            }}
            )
    })

    return {
         status:200,
         message:"Invites cancelled successfully",
         error: false
     }
 }


 async viewDetails(candidateId: string){
    const candidate = await Candidate.findByPk(candidateId);
    if(!candidate){
         return {
             status:400,
             message:"candidate not found",
             error: true
         }
    }

    return {
         status:200,
         message:"candidate retrieved successfully",
         data: candidate,
         error: false
    }
 }

 async deleteCandidate(candidateId: string){
    const candidate = await Candidate.findByPk(candidateId);
    if(!candidate){
         return {
             status:400,
             message:"candidate not found",
             error: true
         }
    }
   await Candidate.update({isDeleted: true},{where:{id: candidateId}});
    return {
         status:200,
         message:"candidate deleted successfully",
         error: false
    }
 }

 async passwordedExamLogin(loginDto: PasswordedExamLoginDto): Promise<ApiResponse>{
   const candidate = await Candidate.findOne({
    where:{username:loginDto.username, isDeleted: false}
   });
    if(!candidate ||  !(await compare(loginDto.password, candidate.password))){
        return {
            status:400,
            message:"Invalid username/password",
            error: true
        }
    }
    
    // if((candidate.status !== CandidateStatus.ACCEPTED)){
    //     return {
    //         status: 400,
    //         message: "You haven't accepted the invite",
    //         error: true
    //     }
    // }
    const exams = [];
    const candidateExams = await CandidateExam.findAll({
        where:{
            candidateId:candidate.id,
            examId: loginDto.examId
        }
    })
   
    const currentExamInProgress  = await this.examService.getCandidateProgress(candidate.id, loginDto.examId);
    let examDetails = null;
    if(currentExamInProgress){
      let nextQuestion = await this.examService.getNextQuestion(currentExamInProgress.examId,currentExamInProgress.currentSectionId,currentExamInProgress.candidateId);
    
      examDetails = {
        examId:currentExamInProgress.examId,
        candidateId: currentExamInProgress.candidateId,
        currentSection: currentExamInProgress.currentSectionId,
        nextQuestion: nextQuestion
      }
      currentExamInProgress.loginAttempts += +1;
      currentExamInProgress.lastLogin 
      await this.cacheManager.set(candidate.id, currentExamInProgress,0);
    }
   
    for(let item of candidateExams){
       if(item.isLoggedIn){
         return{
           status:400,
           message:"multiple login is not allowed",
           error:true
         }
       }
        let exam = await Exam.findOne({where:{id: item.examId}});
        let center;
        if(item.centerId){
           center = await Center.findByPk(item.centerId);
        }
        exams.push({
          ...exam.dataValues,
          centerName:(center)?center.name:"",
          centerLocation:(center)?center.location:""
        });
       
     }
     let role = await Role.findOne({where:{name:"candidate"}});
     let rolePermissions = await RolePermission.findAll({where:{roleId:role.id}});
     let userPermissions = [];
     for(let p of rolePermissions){
       let priviledge = await Permission.findOne({where:{id:p.permissionId}});
       userPermissions.push(priviledge.name);
     }
    const accessToken = this.generateJwtToken(candidate,userPermissions);
    const refreshToken = this.generateRefreshToken(candidate,userPermissions);
     await this.cacheManager.set(`candidateToken:${candidate.id}`,accessToken)
     await CandidateExam.update({
      isLoggedIn:true
     },{where:{examId:loginDto.examId,candidateId:candidate.id}});

      return {
        status: 200,
        message:'Login successful',
        data: { 
          userId: candidate.id,
          email: candidate.email,
          username:loginDto.username,
          firstName:candidate.firstName,
          lastName:candidate.lastName,
          picture:candidate.picture,
          role:"candidate",
          exams,
          currentExam: examDetails?examDetails:null,
          isActive: true,
          accessToken:accessToken,
          refreshToken: refreshToken,
          priviledges:userPermissions
        },
        error: false
      };
   
 }

  async openExamLogin(loginDto: OpenExamLoginDto): Promise<ApiResponse>{
    const candidate = await Candidate.findOne({
     where:{username:loginDto.username, isDeleted:false}
    });

     if(!candidate){
         return {
             status:400,
             message:"Invalid username",
             error: true
         }
     }

    //  if((candidate.status !== CandidateStatus.ACCEPTED)){
    //      return {
    //          status: 400,
    //          message: "You haven't accepted the invite",
    //          error: true
    //      }
    //  }
     var exams = [];
     const candidateExams = await CandidateExam.findAll({
         where:{
             candidateId:candidate.id,
             examId:loginDto.examId
         }
     })

     const currentExamInProgress  = await this.examService.getCandidateProgress(candidate.id,loginDto.examId );
     let examDetails = null;
     if(currentExamInProgress){
       let nextQuestion = await this.examService.getNextQuestion(currentExamInProgress.examId,currentExamInProgress.currentSectionId,currentExamInProgress.candidateId);

       examDetails = {
         examId:currentExamInProgress.examId,
         candidateId: currentExamInProgress.candidateId,
         currentSectionId: currentExamInProgress.currentSectionId,
         nextQuestion: nextQuestion?nextQuestion:null
       }
       currentExamInProgress.loginAttempts += +1;
       currentExamInProgress.lastLogin = new Date().toISOString();
       await this.cacheManager.set(candidate.id, currentExamInProgress,0);
     }

     for(let item of candidateExams){
        console.log(item.isLoggedIn)
        if(item.isLoggedIn){
          return{
            status:400,
            message:"multiple login is not allowed",
            error:true
          }
        }
        let exam = await Exam.findOne({where:{id: item.examId}});
        let center;
        if(item.centerId){
           center = await Center.findByPk(item.centerId);
        }
        exams.push({
          ...exam.dataValues,
          centerName:(center)?center.name:"",
          centerLocation:(center)?center.location:""
        });
     }
     let role = await Role.findOne({where:{name:"candidate"}});
     let rolePermissions = await RolePermission.findAll({where:{roleId:role.id}});
     let userPermissions = [];
     for(let p of rolePermissions){
       let priviledge = await Permission.findOne({where:{id:p.permissionId}});
       userPermissions.push(priviledge.name);
     }

     const accessToken = this.generateJwtToken(candidate,userPermissions);
       const refreshToken = this.generateRefreshToken(candidate,userPermissions);
       await this.cacheManager.set(`candidateToken:${candidate.id}`,accessToken,0)
       await CandidateExam.update({
        isLoggedIn:true
       },{where:{examId:loginDto.examId,candidateId:candidate.id}});
       return {
         status: 200,
         message: 'Login successful',
         data: {
           userId: candidate.id,
           email: candidate.email,
           username:loginDto.username,
           firstName:candidate.firstName,
           lastName:candidate.lastName,
           picture:candidate.picture,
           role:"candidate",
           exams:exams,
           currentExam:examDetails?examDetails:null,
           isActive: true,
           accessToken:accessToken,
           refreshToken: refreshToken,
           priviledges:userPermissions
         },
         error: false
       };

  }

  async fingerprintExamLogin(loginDto: { examId: string; credentialId: string; authenticatorData: string; clientDataJSON: string; signature: string }): Promise<ApiResponse> {
    try {
      // Find candidate by fingerprint credential ID
      const candidate = await Candidate.findOne({
        where: { fingerprintCredentialId: loginDto.credentialId, isDeleted: false }
      });

      if (!candidate) {
        return {
          status: 400,
          message: "Invalid fingerprint credential",
          error: true
        };
      }

      // Verify the fingerprint signature (simplified - in production, use proper WebAuthn verification)
      // For now, just check if credential exists and candidate is registered for the exam
      const candidateExams = await CandidateExam.findAll({
        where: {
          candidateId: candidate.id,
          examId: loginDto.examId
        }
      });

      if (candidateExams.length === 0) {
        return {
          status: 400,
          message: "Candidate not registered for this exam",
          error: true
        };
      }

      const currentExamInProgress = await this.examService.getCandidateProgress(candidate.id, loginDto.examId);
      let examDetails = null;
      if (currentExamInProgress) {
        let nextQuestion = await this.examService.getNextQuestion(currentExamInProgress.examId, currentExamInProgress.currentSectionId, currentExamInProgress.candidateId);

        examDetails = {
          examId: currentExamInProgress.examId,
          candidateId: currentExamInProgress.candidateId,
          currentSectionId: currentExamInProgress.currentSectionId,
          nextQuestion: nextQuestion ? nextQuestion : null
        };
        currentExamInProgress.loginAttempts += 1;
        currentExamInProgress.lastLogin = new Date().toISOString();
        await this.cacheManager.set(candidate.id, currentExamInProgress, 0);
      }

      const exams = [];
      for (let item of candidateExams) {
        if (item.isLoggedIn) {
          return {
            status: 400,
            message: "Multiple login is not allowed",
            error: true
          };
        }
        let exam = await Exam.findOne({ where: { id: item.examId } });
        let center;
        if (item.centerId) {
          center = await Center.findByPk(item.centerId);
        }
        exams.push({
          ...exam.dataValues,
          centerName: (center) ? center.name : "",
          centerLocation: (center) ? center.location : ""
        });
      }

      let role = await Role.findOne({ where: { name: "candidate" } });
      let rolePermissions = await RolePermission.findAll({ where: { roleId: role.id } });
      let userPermissions = [];
      for (let p of rolePermissions) {
        let priviledge = await Permission.findOne({ where: { id: p.permissionId } });
        userPermissions.push(priviledge.name);
      }

      const accessToken = this.generateJwtToken(candidate, userPermissions);
      const refreshToken = this.generateRefreshToken(candidate, userPermissions);
      await this.cacheManager.set(`candidateToken:${candidate.id}`, accessToken, 0);

      await CandidateExam.update({
        isLoggedIn: true
      }, { where: { examId: loginDto.examId, candidateId: candidate.id } });

      return {
        status: 200,
        message: 'Fingerprint login successful',
        data: {
          userId: candidate.id,
          email: candidate.email,
          username: candidate.username,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          picture: candidate.picture,
          role: "candidate",
          exams: exams,
          currentExam: examDetails ? examDetails : null,
          isActive: true,
          accessToken: accessToken,
          refreshToken: refreshToken,
          priviledges: userPermissions
        },
        error: false
      };
    } catch (error) {
      return {
        status: 500,
        message: `Fingerprint login failed: ${error.message}`,
        error: true
      };
    }
  }

  async getFingerprintChallenge(examId: string): Promise<ApiResponse> {
    try {
      // Get all candidates registered for the exam
      const candidateExams = await CandidateExam.findAll({
        where: { examId: examId }
      });

      const allowCredentials = [];
      for (let ce of candidateExams) {
        const candidate = await Candidate.findByPk(ce.candidateId);
        if (candidate && candidate.fingerprintCredentialId) {
          allowCredentials.push({
            id: candidate.fingerprintCredentialId,
            type: 'public-key'
          });
        }
      }

      if (allowCredentials.length === 0) {
        return {
          status: 400,
          message: "No fingerprint credentials registered for this exam",
          error: true
        };
      }

      // Generate a random challenge as bytes
      const challenge = randomBytes(32);

      return {
        status: 200,
        message: "Fingerprint challenge generated",
        data: {
          challenge: challenge.toString('base64'),
          allowCredentials: allowCredentials
        },
        error: false
      };
    } catch (error) {
      return {
        status: 500,
        message: `Failed to generate fingerprint challenge: ${error.message}`,
        error: true
      };
    }
  }

  async registerFingerprint(candidateId: string, credentialId: string, publicKey: string): Promise<ApiResponse> {
    try {
      const candidate = await Candidate.findByPk(candidateId);
      if (!candidate) {
        return {
          status: 404,
          message: "Candidate not found",
          error: true
        };
      }

      await candidate.update({
        fingerprintCredentialId: credentialId,
        fingerprintPublicKey: publicKey
      });

      return {
        status: 200,
        message: "Fingerprint registered successfully",
        data: {
          candidateId: candidateId,
          fingerprintCredentialId: credentialId
        },
        error: false
      };
    } catch (error) {
      return {
        status: 500,
        message: `Failed to register fingerprint: ${error.message}`,
        error: true
      };
    }
  }

  async removeFingerprint(candidateId: string): Promise<ApiResponse> {
    try {
      const candidate = await Candidate.findByPk(candidateId);
      if (!candidate) {
        return {
          status: 404,
          message: "Candidate not found",
          error: true
        };
      }

      await candidate.update({
        fingerprintCredentialId: null,
        fingerprintPublicKey: null
      });

      return {
        status: 200,
        message: "Fingerprint removed successfully",
        data: {
          candidateId: candidateId
        },
        error: false
      };
    } catch (error) {
      return {
        status: 500,
        message: `Failed to remove fingerprint: ${error.message}`,
        error: true
      };
    }
  }
 
  async resendInvite(resendDto:ResendInviteDto){
     try{
            
            const exam = await Exam.findByPk(resendDto.examId);
            if(!exam){
                return {
                    status: 400,
                    message:"Exam with the specified id not found",
                    error: true
                }
            }
            
            resendDto.candidateIds.forEach(async (id) => {
                let candidate = await Candidate.findByPk(id);
                if(!candidate){
                    return {
                        status: 400,
                        message:`Candidate with ${id} not found`,
                        error:true
                    }
                }

                if(candidate.status ===CandidateStatus.ACCEPTED){
                    return {
                        status: 400,
                        message:`Candidate already accepted invite`,
                        error:true
                    }
                }

                let token = this.generateVerificationToken();
                // let acceptLink = `${this.appUrl}/candidate/accept-invite?token=${token}?username?=${candidate.username}`;
                // let rejectLink = `${this.appUrl}/candidate/decline-invite?token=${token}?username?=${candidate.username}`
                let loginLink = `${this.candidateUrl}auth/login?id=${exam.id}`;
                let firstName = candidate.firstName
                let username = candidate.username
                let password = candidate.password
                const html = await candidateWelcomeTemplate({
                loginLink,username,password,firstName
                });
                // await this.emailService.sendEmailSendgrid(
                // html,
                // candidate.email,
                // 'Exam Invite',
                // );
                await this.emailService.sendEmail(
                  candidate.email,
                  'Exam Invite',
                   html,
                   true
                  );
            });

            return {
                status:200,
                message:"Invite resent successfully",
                error:false
            }

     }
     catch(e){
        return {
            status:500,
            message:`Internal server error: ${e.message}`,
            error:true
        }
     }
   
  }


  // async reAssignedSubjects(){
    
  // }
  

  public generateVerificationToken(){
    const token = randomBytes(8).toString('hex');
    return token;
  }
  
  public async generateUsername(firstName) {
    const min = 10; 
    const max = 99; 
    const randomTwoDigitNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    let username = `${firstName}${randomTwoDigitNumber}`;
    const candidate = await Candidate.findOne({where:{username:username}});
    if(candidate){
       username = await this.generateUsername(firstName);
    }
    return username;
  }

 public  generatePassword(length = 6) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
  
 
  private generateJwtToken(candidate: Candidate,userPermissions:any[]): string {
    const payload = { sub: candidate.id, email: candidate.email, roles:["candidate"],permissions:userPermissions };
    return this.jwtService.sign(payload,{ secret: `${this.jwtSecret}`,expiresIn: '24h' });
  }
  
  private generateRefreshToken(candidate: Candidate,userPermissions:any[]): string {
    const payload = { sub: candidate.id, email: candidate.email, roles:["candidate"],permissions:userPermissions };
    return this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: '7d', 
    });
  }
  


  async convertToBase64DataURL(photoPath) {
    const filePath = path.join(__dirname, photoPath);
    const fileExtension = path.extname(photoPath).substring(1); // Get the file extension without the dot

    try {

      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');

      const dataURL = `data:image/${fileExtension};base64,${base64Data}`;

      return dataURL;
    } catch (err) {
      console.error('Error converting file to base64:', err);
      return null;
    }
  };

  async saveFingerprintImage(candidateId: string, fingerprintImage: string): Promise<ApiResponse> {
    try {
      const candidate = await Candidate.findByPk(candidateId);
      if (!candidate) {
        return {
          status: 404,
          message: "Candidate not found",
          error: true
        };
      }

      await candidate.update({
        fingerprintImage: fingerprintImage
      });

      return {
        status: 200,
        message: "Fingerprint image saved successfully",
        data: {
          candidateId: candidateId,
          fingerprintImage: fingerprintImage
        },
        error: false
      };
    } catch (error) {
      return {
        status: 500,
        message: `Failed to save fingerprint image: ${error.message}`,
        error: true
      };
    }
  }






}


