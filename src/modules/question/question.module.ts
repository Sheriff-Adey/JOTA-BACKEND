import { Module } from '@nestjs/common';
import { EmailService } from 'src/shared/notifications/email.service';
import { DatabaseModule } from '../../database/database.module';
import { questionProviders } from './question.providers';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { itemProviders } from '../item/item.providers';
import { JwtService } from '@nestjs/jwt';
import { CacheConfigModule } from 'src/config/cache.config';


@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [QuestionController],
    providers: [...questionProviders,...itemProviders,QuestionService,JwtService],
  })
export class QuestionModule {}
