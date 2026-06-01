import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_BILLING_KEY } from '../decorators/is-billing.decorator';
import { BusinessPlan } from '@prisma/client';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as billing-exempt
    const isBilling = this.reflector.getAllAndOverride<boolean>(
      IS_BILLING_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isBilling) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      return true; // Let JwtAuthGuard handle non-authenticated users
    }

    // Load business details
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { business: true },
    });

    if (!dbUser || !dbUser.business) {
      return true;
    }

    const business = dbUser.business;

    // Check if plan is STARTER and expired
    if (business.plan === BusinessPlan.STARTER) {
      if (
        business.planExpiryDate &&
        new Date() > new Date(business.planExpiryDate)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            message:
              'Your free trial has expired. Please upgrade to a paid plan to continue using BizhubNg.',
            error: 'Subscription Expired',
            trialExpired: true,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    // Check for other plans (if we want to block them too upon expiry)
    // Note: Usually paid plans are blocked too if they expire without renewal.
    if (
      business.plan !== BusinessPlan.STARTER &&
      business.planExpiryDate &&
      new Date() > new Date(business.planExpiryDate)
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message:
            'Your subscription has expired. Please renew your plan to continue.',
          error: 'Subscription Expired',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
