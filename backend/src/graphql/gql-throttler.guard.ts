import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return { req: ctx.getContext().req as Request, res: ctx.getContext().res };
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as Request;
    const forwarded = request.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ??
      request.ip ??
      'unknown';
    const userId: string | undefined = (request as any).user?.id;
    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  // Resolvers with @Throttle({ aggregate }) get both tiers; others only get 'default'
  protected async handleRequest(requestProps: any): Promise<boolean> {
    const { context, throttler } = requestProps;

    if (throttler.name !== 'default') {
      const handler = context.getHandler();
      const classRef = context.getClass();
      
      // Look for explicit @Throttle() configuration for this specific throttler
      const hasLimit = this.reflector.getAllAndOverride(`THROTTLER:LIMIT${throttler.name}`, [handler, classRef]);
      const hasTtl = this.reflector.getAllAndOverride(`THROTTLER:TTL${throttler.name}`, [handler, classRef]);

      // If no explicit configuration is found for this non-default tier, skip it
      if (!hasLimit && !hasTtl) {
        return true;
      }
    }

    return super.handleRequest(requestProps);
  }

  protected throwThrottlingException(): never {
    const { HttpException, HttpStatus } = require('@nestjs/common');
    throw new HttpException(
      {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please retry after the indicated time.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
