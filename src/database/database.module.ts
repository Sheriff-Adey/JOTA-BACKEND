import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { ConfigService } from '../config/config.service'; 
import { ConfigService as NestConfigService } from '@nestjs/config';
@Module({
  
  providers: [...databaseProviders,ConfigService,NestConfigService],
  exports: [...databaseProviders],
})
export class DatabaseModule {}