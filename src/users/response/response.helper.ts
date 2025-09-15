import { ServiceResponse } from '../users.type';

export function successResponse<T>(
  message = 'Success',
  data?: T,
): ServiceResponse<T> {
  return data === undefined || data === null
    ? { success: true, message }
    : { success: true, message, data };
}

export function errorResponse(message: string): ServiceResponse<null> {
  return { success: false, message };
}
