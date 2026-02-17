import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { EmailService } from 'src/shared/notifications/email.service';
import { User } from './user.entity';
import { DatabaseModule } from '../../database/database.module';
import { usersProviders } from './user.providers';
import { RoleService } from '../role/role.service';
import { rolesProviders } from '../role/role.providers';
import { JwtService } from '@nestjs/jwt';
import { tokensProviders } from './token.provider';
import { NotificationService } from '../notification/notification.service';
import { notificationProviders } from '../notification/notification.providers';
import { CacheConfigModule } from 'src/config/cache.config';

@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [UserController],
    providers: [UserService,EmailService,NotificationService,RoleService,JwtService,...usersProviders,...rolesProviders,...tokensProviders,...notificationProviders],
  })
export class UserModule {}
