import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '@common/types/api-response.type';
import { ApiCode } from '@common/types/apiCode.type';

export function ok<T>(
  data: T,
  message: string,
  code: ApiCode,
): ApiSuccessResponse<T> {
  return {
    data,
    message,
    meta: {
      code,
      traceId: '',
      timestamp: '',
    },
  };
}

export function efail(
  message: string,
  code: ApiCode,
  details?: unknown[],
): ApiErrorResponse {
  return {
    error: {
      message,
      code,
      details,
    },
    meta: {
      traceId: '',
      timestamp: '',
      code,
    },
  };
}
