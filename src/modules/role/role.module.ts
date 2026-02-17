import { Module } from '@nestjs/common';
import { EmailService } from 'src/shared/notifications/email.service';
import { DatabaseModule } from '../../database/database.module';
import { rolesProviders } from './role.providers';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { JwtService } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigModule } from 'src/config/cache.config';

@Module({
    imports: [DatabaseModule,CacheConfigModule],
    controllers: [RoleController],
    providers: [RoleService,EmailService,JwtService,...rolesProviders],
  })
export class RoleModule {}
