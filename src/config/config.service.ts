import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get dbHost(): string {
    return this.nestConfigService.get<string>('DB_HOST');
  }

  get dbPort(): number {
    return +this.nestConfigService.get<number>('DB_PORT');
  }

  get dbUser(): string {
    return this.nestConfigService.get<string>('DB_USER');
  }

  get dbPassword(): string {
    return this.nestConfigService.get<string>('DB_PASSWORD');
  }

  get dbName(): string {
    return this.nestConfigService.get<string>('DB_NAME');
  }

  
  get appInstance(): string {
    return this.nestConfigService.get<string>('APP_INSTANCE');
  }

  get sync(): boolean{
    return this.nestConfigService.get<boolean>('SYNC');
  }
}
