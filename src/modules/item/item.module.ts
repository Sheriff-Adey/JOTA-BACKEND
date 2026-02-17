import { Module } from '@nestjs/common';
import { EmailService } from 'src/shared/notifications/email.service';
import { DatabaseModule } from '../../database/database.module';
import { itemBankProviders } from './item-bank.providers';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { UserService } from '../user/user.service';
import { usersProviders } from '../user/user.providers';
import { tokensProviders } from '../user/token.provider';
import { RoleService } from '../role/role.service';
import { JwtService } from '@nestjs/jwt';
import { rolesProviders } from '../role/role.providers';
import { itemProviders } from './item.providers';
import { QuestionService } from '../question/question.service';
import { questionProviders } from '../question/question.providers';
import { NotificationService } from '../notification/notification.service';
import { notificationProviders } from '../notification/notification.providers';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigModule } from 'src/config/cache.config';


@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [ItemController],
    providers: [...itemBankProviders,ItemService,UserService,RoleService,EmailService,JwtService,QuestionService,NotificationService,...usersProviders,...questionProviders,...tokensProviders,...rolesProviders,...itemProviders,...notificationProviders],
  })
export class ItemModule {}
