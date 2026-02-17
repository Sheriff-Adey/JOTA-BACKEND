import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { EmailService } from 'src/shared/notifications/email.service';
import { ExamService } from '../exam/exam.service';
import { CacheModule } from '@nestjs/cache-manager';
import { examProviders } from '../exam/exam.providers';
import { CacheConfigModule } from 'src/config/cache.config';
import { TwilioService } from 'src/shared/notifications/sms.service';
import { NotificationService } from '../notification/notification.service';
import { notificationProviders } from '../notification/notification.providers';
@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [CandidateController],
    providers: [CandidateService,EmailService,JwtService, ExamService,TwilioService,NotificationService,...examProviders,...notificationProviders],
  })
export class CandidateModule {}
