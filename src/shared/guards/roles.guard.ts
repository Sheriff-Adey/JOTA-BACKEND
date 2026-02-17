// authorization.guard.ts
import { Injectable, CanActivate, ExecutionContext,ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No authorization required
    }

    
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // No permission required, only role check
    }
    const { user } = context.switchToHttp().getRequest();

    // Check if user has the required role
    if (user && user.roles && user.roles.some((role) => requiredRoles.includes(role))) {
      
      if (user.permissions && user.permissions.some((permission) => requiredPermissions.includes(permission))) {
        return true; // User is authorized
      }
    }
    throw new ForbiddenException({
        status: 403,
        message: 'Forbidden resource',
        error: true,
      });; // User is not authorized
  }
}
