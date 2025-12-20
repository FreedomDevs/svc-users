export type ApiMeta = {
  code: string;
  traceId: string;
  timestamp: string;
};

export type ApiSuccessResponse<T> = {
  data: T;
  message: string;
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: ApiMeta;
};
