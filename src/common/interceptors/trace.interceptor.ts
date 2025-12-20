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

interface TraceRequest extends Request {
  traceId?: string;
}

function isSuccess<T>(data: any): data is ApiSuccessResponse<T> {
  return 'data' in data && 'message' in data && 'meta' in data;
}

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<any> | ApiErrorResponse> {
    const request = context.switchToHttp().getRequest<TraceRequest>();
    const traceId = (request.headers['x-trace-id'] as string) ?? '';
    request.traceId = traceId;

    return next.handle().pipe(
      map((data: ApiSuccessResponse<any> | ApiErrorResponse) => {
        if (isSuccess(data)) {
          return {
            ...data,
            meta: {
              ...data.meta,
              traceId,
              timestamp: new Date().toISOString(),
            },
          };
        } else {
          return {
            ...data,
            meta: {
              ...data.meta,
              traceId,
              timestamp: new Date().toISOString(),
            },
          };
        }
      }),
    );
  }
}
