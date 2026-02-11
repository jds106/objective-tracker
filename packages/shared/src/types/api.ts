export interface ErrorResponse {
  error: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
}
