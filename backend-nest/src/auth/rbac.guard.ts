import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

/**
 * Combined JWT + RBAC guard.
 * Usage: @UseGuards(RolesGuard) + @Roles('admin', 'company')
 * If no @Roles() decorator is present, only JWT auth is checked.
 */
@Injectable()
export class RolesGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First verify JWT (calls AuthGuard('jwt'))
    const jwtValid = await super.canActivate(context);
    if (!jwtValid) return false;

    // Check RBAC roles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction, JWT-only auth is sufficient
    }

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
