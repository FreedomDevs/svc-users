import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '@common/types/api-response.type';
import { UserCodes } from '../../users/users.codes';

export function ok<T>(
  data: T,
  message: string,
  code: string,
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
  code: UserCodes,
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
