import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { QuestionModule } from './modules/question/question.module';
import { usersProviders } from './modules/user/user.providers';
import { rolesProviders } from './modules/role/role.providers';
import { ItemModule } from './modules/item/item.module';
import { ExamModule } from './modules/exam/exam.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { CacheModule } from '@nestjs/cache-manager';
import { FaqModule } from './modules/faq/faq.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ViolationModule } from './modules/violation/violation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [UserModule,ConfigModule,DatabaseModule,AuthModule,RoleModule,ItemModule,QuestionModule,ExamModule,CandidateModule,FaqModule,NotificationModule,ViolationModule,
    ScheduleModule.forRoot(),  ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    })],
  controllers: [AppController],
  providers: [AppService,...usersProviders,...rolesProviders],
})
export class AppModule {}
