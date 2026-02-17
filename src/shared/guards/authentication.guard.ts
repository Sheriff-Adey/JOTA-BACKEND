// authentication.guard.ts
import { Injectable,Inject, CanActivate, ExecutionContext,UnauthorizedException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from 'src/app.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as config from 'config';

require('dotenv').config();

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
    ) {}
    private jwtSecret =  config.get("jwtSecret");
   
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    console.log(config.get("jwtSecret"));
    console.log(this.jwtSecret);
    if (!token) {
        throw new UnauthorizedException({
            statusCode: 401,
            message: 'No Token provided, authentication fails',
            error: true
          })
     }
    
     const revokedToken =  await this.cacheManager.get<any[]>("tokenBlackList");
  
     if(revokedToken && revokedToken.includes(token.split(' ')[1])){
          
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid Token',
        error: true,
      })
     }
    try {
      const decoded = this.jwtService.verify(token.split(' ')[1],{ secret: `${this.jwtSecret}` });
      console.log(decoded);
      request.user = decoded;
      request.user.token = token.split(' ')[1];
      return true
    } catch (error) {
       
        throw new UnauthorizedException({
            statusCode: 401,
            message: 'Invalid Token',
            error: true,
          })
    }
  }
}
