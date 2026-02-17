import { Module } from '@nestjs/common';
import { EmailService } from 'src/shared/notifications/email.service';
import { DatabaseModule } from '../../database/database.module';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { JwtService } from '@nestjs/jwt';
import { CacheConfigModule } from 'src/config/cache.config';


@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [FaqController],
    providers: [FaqService,JwtService],
  })
export class FaqModule {}
