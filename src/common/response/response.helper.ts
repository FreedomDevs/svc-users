import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../types/api-response.type';

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

export function fail(
  message: string,
  code: string,
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
