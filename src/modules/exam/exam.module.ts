import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { examProviders } from './exam.providers';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { JwtService } from '@nestjs/jwt';
import { ExamGateway } from './gateway/exam.gateway';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { EmailService } from 'src/shared/notifications/email.service';
import { CacheConfigModule } from 'src/config/cache.config';
import { ViolationModule } from '../violation/violation.module';

@Module({
    imports: [DatabaseModule, CacheConfigModule, ViolationModule],
    controllers: [ExamController],
    providers: [...examProviders, ExamService, JwtService, ExamGateway, EmailService],
  })
export class ExamModule {}
