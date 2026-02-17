import { Module } from '@nestjs/common';
import { EmailService } from 'src/shared/notifications/email.service';
import { DatabaseModule } from '../../database/database.module';
import { notificationProviders } from './notification.providers';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { JwtService } from '@nestjs/jwt';
import { CacheConfigModule } from 'src/config/cache.config';




@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [NotificationController],
    providers: [...notificationProviders,NotificationService,JwtService],
  })
export class NotificationModule {}
