import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { CustomWsException } from '../exceptions/CustomWs.exception'; // Import your custom WebSocket exception class
import * as config from 'config';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  private jwtSecret = config.get("jwtSecret");

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.headers.authorization;
    let errorMessage;
    let statusCode;
    if (!token) {
         errorMessage = 'Invalid Token';
         statusCode = 401;

        client.emit('error', new CustomWsException(errorMessage, statusCode));
    }

    try {
      const decoded = this.jwtService.verify(token.split(' ')[1], {
        secret: `${this.jwtSecret}`,
      });
  
      if(!decoded){
    
        errorMessage = 'Invalid Token';
         statusCode = 401;

        client.emit('error', new CustomWsException(errorMessage, statusCode));
      }
      client.user = decoded; // Attach user information to the WebSocket client

      return true;
    } catch (error) {
         errorMessage = 'Invalid Token';
         statusCode = 401;

        client.emit('error', new CustomWsException(errorMessage, statusCode));
    }
  }
}
