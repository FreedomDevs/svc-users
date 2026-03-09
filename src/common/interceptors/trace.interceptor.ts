import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../types/api-response.type';
import { randomUUID } from 'crypto';
import { Metadata } from '@grpc/grpc-js';

interface TraceRequest extends Request {
  traceId?: string;
}

function isApiResponse<T>(
  data: unknown,
): data is ApiSuccessResponse<T> | ApiErrorResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meta' in (data as Record<string, unknown>)
  );
}

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<any> | ApiErrorResponse> {
    let traceId = '';

    /**
     * HTTP
     */
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<TraceRequest>();

      traceId =
        (request.headers['x-trace-id'] as string) ||
        (request.headers['trace-id'] as string) ||
        randomUUID();

      request.traceId = traceId;
    } else if (context.getType<'rpc'>() === 'rpc') {
      /**
       * gRPC
       */
      const metadata: Metadata | undefined = context
        .switchToRpc()
        .getContext<Metadata>();

      traceId =
        metadata?.get('x-trace-id')[0]?.toString() ??
        metadata?.get('trace-id')[0]?.toString() ??
        randomUUID();
    } else {
      /**
       * fallback
       */
      traceId = randomUUID();
    }

    return next.handle().pipe(
      map<
        ApiSuccessResponse<any> | ApiErrorResponse,
        ApiSuccessResponse<any> | ApiErrorResponse
      >((data) => {
        if (!isApiResponse(data)) return data;

        return {
          ...data,
          meta: {
            ...data.meta,
            traceId,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
