import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest<{ user: { isAdmin: boolean } }>();
    if (!req.user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
