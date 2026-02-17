import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { CustomWsException } from '../exceptions/CustomWs.exception'; 
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class WebSocketRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
     try{
      
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [
            context.getHandler(),
            context.getClass(),
        ],
        );

        if (!requiredRoles) {
        return true; // No authorization required
        }

        const { user } = client;

        // Check if user has the required role
        if (user && user.roles && user.roles.some((role) => requiredRoles.includes(role))) {
        return true; // User is authorized
        }

        const errorMessage = 'Forbidden';
        const statusCode = 403;

        client.emit('error', new CustomWsException(errorMessage, statusCode));
     }
     catch(e){
        console.log(e);
        const errorMessage = 'Forbidden';
        const statusCode = 403;

        client.emit('error', new CustomWsException(errorMessage, statusCode));
     }
  }
}
