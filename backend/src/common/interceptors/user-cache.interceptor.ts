import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    // If there's no user ID, it falls back to caching globally per URL
    const baseKey = super.trackBy(context);

    if (baseKey && userId) {
      return `${baseKey}-${userId}`;
    }

    return baseKey;
  }
}
