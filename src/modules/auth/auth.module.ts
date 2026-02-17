import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UserService } from '../user/user.service';
import { usersProviders } from '../user/user.providers';
import { RoleService } from '../role/role.service';
import { EmailService } from 'src/shared/notifications/email.service';
import { rolesProviders } from '../role/role.providers';
import { JwtStrategy } from './jwt.strategy';
import { tokensProviders } from '../user/token.provider';
import { NotificationService } from '../notification/notification.service';
import { notificationProviders } from '../notification/notification.providers';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigModule } from 'src/config/cache.config';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' }
    }),
    CacheConfigModule
  ],
  providers: [UserService,RoleService,NotificationService, EmailService,JwtStrategy,...usersProviders,...rolesProviders,...tokensProviders,...notificationProviders],
  exports: [UserService],
})
export class AuthModule {}