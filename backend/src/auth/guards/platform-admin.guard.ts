import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.sub },
      select: { email: true },
    });

    if (!user) {
      return false;
    }

    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@bizhub.com')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    if (!adminEmails.includes(user.email.toLowerCase())) {
      throw new ForbiddenException(
        'Access denied. Administrator privileges required.',
      );
    }

    return true;
  }
}
