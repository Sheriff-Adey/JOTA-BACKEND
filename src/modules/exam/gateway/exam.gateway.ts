// exam.gateway.ts
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExamService } from '../exam.service';
import { StartExamDto } from '../dto/start-exam.dto';
import { PreviousQuestionDto, SubmitExamDto, SubmitResponseDto } from '../dto/submit-reponse.dto';
import { GetRemainingExamTimeDto, GetRemainingSectionTimeDto } from '../dto/set-overall-timer.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import {  UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { RoleGuard } from 'src/shared/guards/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { WebSocketAuthGuard } from 'src/shared/guards/websocketauth.guard';
import { WebSocketRoleGuard } from 'src/shared/guards/websocketrole.guard';
import { Section } from 'src/modules/section/section.entity';
import { Inject } from '@nestjs/common';
import { Violation } from '../../violation/violation.entity';
import { Sequelize } from 'sequelize-typescript';

@WebSocketGateway()
export class ExamGateway implements OnGatewayConnection {
    constructor(
      private examService: ExamService,
      @Inject('SEQUELIZE') private sequelize: Sequelize
    ){
    }
  @WebSocketServer() server: Server;
  //@Roles('candidate')
  //@UseGuards(WebSocketAuthGuard,WebSocketRoleGuard)
  handleConnection(client: Socket) {
    // Handle WebSocket connections, e.g., authentication and validation.
    console.log(`Client connected: ${client.id}`);
    
    // You can emit an event to the connected client if needed.
     client.emit('connected', { message: 'You are connected!' });
  }

  @SubscribeMessage('start-exam')
  //@Roles('candidate')
 // @UseGuards(WebSocketAuthGuard,WebSocketRoleGuard)
  async handleStartExam(client: Socket, data: StartExamDto) {
    try {
     
      const { examId,  candidateId, sectionId } = data;
  
      console.log(`Starting exam for client ${client.id}: Exam ID - ${examId}`);
      const customClientId = `${data.candidateId}_${data.examId}`;
      client.data.customClientId = customClientId;
      await this.examService.registerClient(customClientId,client);

      let response  = await this.examService.startExam({
        examId:data.examId,
        candidateId:data.candidateId,
        sectionId:data.sectionId
      },client);
      let firstQuestion;
      let remainingExamTime;
      let remainingSectionTime;
      if(response.status && response.error == false){
        firstQuestion = {
          status:response.status,
          message:response.message,
          data:response.data.responseData,
          error:response.error
        }
        remainingExamTime = response.data.remainingExamTime
        remainingSectionTime = response.data.remainingSectionTime
      }
      else{
        firstQuestion = response;
      }
      console.log("remaining time", remainingExamTime)
      client.emit('question', firstQuestion);
      client.emit('remaining-exam-time', remainingExamTime);
      client.emit('remaining-section-time', remainingSectionTime);
      this.examService.emitToClient(customClientId,'question',firstQuestion)

      // client.on('disconnect', () => {
      //   this.examService.unregisterClient(customClientId);
      // });
    } catch (error) {
      console.log(error);
      // Handle errors gracefully and emit an error event if necessary
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('submit-response')
  //@Roles('candidate')
  //@UseGuards(WebSocketAuthGuard,WebSocketRoleGuard)
  async handleSubmitResponse(client: Socket, data: SubmitResponseDto) {
    try {

      const response = await this.examService.submitResponse(data, client);

      let otherQuestion;                                                                                          
      let remainingExamTime;
      let remainingSectionTime;
      if(response.status && response.error===false){
        otherQuestion = {
          status:response.status,
          message:response.message,
          data:response.data.responseData,
          error:response.error
        }
        remainingExamTime = response.data.remainingExamTime
        remainingSectionTime = response.data.remainingSectionTime
      }
      else{
        otherQuestion = response
      }
      console.log("remaining time", remainingExamTime)
      client.emit('question', otherQuestion);
      client.emit('remaining-exam-time', remainingExamTime);
      client.emit('remaining-section-time', remainingSectionTime);
      
    } catch (error) {
      console.log(error);
      // Handle errors gracefully and emit an error event if necessary
      client.emit('error', { message: 'Failed to submit the response.' });
    }
  }


  @SubscribeMessage('save-essay-response')
  //@Roles('candidate')
  //@UseGuards(WebSocketAuthGuard,WebSocketRoleGuard)
  async handleSaveEssayResponse(client: Socket, data: SubmitResponseDto) {
    try {

      const response = await this.examService.saveEssayResponse(data, client);

      if(response.status && response.error===false){
        client.emit('response-saved', response);
      }
  
    } catch (error) {
      console.log(error);

      client.emit('error', { message: 'Failed to submit the response.' });
    }
  }


  @SubscribeMessage('previous-question')
  async handlePreviousQuestions(client: Socket, data: PreviousQuestionDto) {
    try {

      const response = await this.examService.getPreviousQuestion(data);

      let otherQuestion;
      let remainingExamTime;
      let remainingSectionTime;
      if(response.status && response.error===false){
        otherQuestion = {
          status:response.status,
          message:response.message,
          data:response.data.responseData,
          error:response.error
        }
        remainingExamTime = response.data.remainingExamTime
        remainingSectionTime = response.data.remainingSectionTime
      }
      else{
        otherQuestion = response
      }
      console.log("remaining time", remainingExamTime)
      client.emit('question', otherQuestion);
      client.emit('remaining-exam-time', remainingExamTime);
      client.emit('remaining-section-time', remainingSectionTime);
      
    } catch (error) {
      console.log(error);
      // Handle errors gracefully and emit an error event if necessary
      client.emit('error', { message: 'Failed to submit the response.' });
    }
  }

  @SubscribeMessage('submit-exam')
  // @ApiBearerAuth('Authorization')
  //@Roles('candidate','admin')
  //@UseGuards(WebSocketAuthGuard)
  async handleSubmitExam(client: Socket, data: SubmitExamDto) {
    try {
      console.log('[GATEWAY] 📝 Exam submission received:', data);
      const response = await this.examService.submitExam(data.examId, data.candidateId, data.submissionType, data.submissionReason);
      console.log('[GATEWAY] ✅ Exam submitted successfully:', response);
      
      // Send the response to the submitting client
      client.emit('response', response);
      
      // Broadcast to ALL clients (including superadmin monitoring) that exam was submitted
      console.log('[GATEWAY] 📢 Broadcasting exam-submitted event to all clients');
      this.server.emit('exam-submitted', {
        examId: data.examId,
        candidateId: data.candidateId,
        submissionType: data.submissionType || 'manual',
        submissionReason: data.submissionReason || null,
        submittedAt: new Date().toISOString(),
        data: response
      });
    } catch (error) {
      console.log('[GATEWAY] ❌ Error submitting exam:', error);
      client.emit('error', { message: 'Failed to submit the response.' });
    }
  }

  @SubscribeMessage('get-remaining-section-time')
  // @Roles('candidate')
  // @UseGuards(WebSocketAuthGuard,WebSocketRoleGuard)
  async getRemainingSectionTime(client: Socket, data:GetRemainingSectionTimeDto) {
    const { candidateId, sectionId } = data;
    const section = await Section.findByPk(sectionId);
    if (!section) {
      client.emit('error', { message: 'Invalid section id.' });
      return;
    }
    const response = await this.examService.getSectionRemainingTime(candidateId, sectionId, section.examId);
    if (response.status === 200) {
      client.emit('remaining-section-time', response);
    } else {
      client.emit('error', response);
    }
  }

@SubscribeMessage('get-remaining-exam-time')
  //  @Roles('candidate')
  //  @UseGuards(WebSocketAuthGuard,WebSocketRoleGuard)
  async getRemainingExamTime(client: Socket, data:GetRemainingExamTimeDto) {

      const {candidateId, examId } = data;

      const response = await this.examService.getExamRemainingTime(candidateId,examId)
      if(response.status === 200){
        client.emit('remaining-exam-time', response);
      }
      else{
        client.emit('error',response );
      }

   }

  @SubscribeMessage('report-violation')
  async handleViolationReport(client: Socket, data: {
    examId: string;
    candidateId: string;
    violationType: string;
    violationReason: string;
    timestamp: string;
  }) {
    try {
      const { examId, candidateId, violationType, violationReason, timestamp } = data;
      
      console.log(`Violation reported for candidate ${candidateId} in exam ${examId}: ${violationReason}`);
      
      // Save violation to database for persistent storage
      const violation = await Violation.create({
        examId,
        candidateId,
        violationType,
        violationReason,
        metadata: {
          timestamp,
          socketClientId: client.id,
          reportedAt: new Date().toISOString()
        }
      });
      
      console.log(`[GATEWAY] ✅ Violation saved to database: ${violation.id}`);
      
      // Emit violation to all monitoring clients watching this exam
      this.server.emit('exam-violation', {
        examId,
        candidateId,
        violationType,
        violationReason,
        timestamp,
        violationId: violation.id,
        message: `Candidate violated exam rule: ${violationReason}`
      });
      
      // Also emit to the specific exam monitoring room
      this.server.emit(`exam_${examId}_violation`, {
        examId,
        candidateId,
        violationType,
        violationReason,
        timestamp,
        violationId: violation.id,
        message: `Candidate ${candidateId} violated exam rule: ${violationReason}`
      });
      
      return { 
        event: 'violation-received', 
        data: { 
          success: true, 
          examId, 
          candidateId,
          violationId: violation.id,
          message: 'Violation reported successfully' 
        } 
      };
    } catch (error) {
      console.error('Error handling violation report:', error);
      return { 
        event: 'violation-error', 
        data: { 
          success: false, 
          message: error.message 
        } 
      };
    }
  }

  @SubscribeMessage('join-monitoring')
  async handleJoinMonitoring(client: Socket, data: { examId: string }) {
    try {
      const { examId } = data;
      // Join the exam monitoring room
      client.join(`exam_${examId}_monitoring`);
      console.log(`Client ${client.id} joined monitoring for exam ${examId}`);
      
      return { 
        event: 'joined-monitoring', 
        data: { 
          success: true, 
          examId,
          message: `Joined monitoring room for exam ${examId}` 
        } 
      };
    } catch (error) {
      console.error('Error joining monitoring:', error);
      return { 
        event: 'monitoring-error', 
        data: { 
          success: false, 
          message: error.message 
        } 
      };
    }
  }
}
