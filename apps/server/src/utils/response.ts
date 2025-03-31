import { Response } from 'express';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  pagination?: ApiResponse<T>['pagination']
): void => {
  const response: ApiResponse<T> = {
    status: 'success',
    data,
    message,
    ...(pagination && { pagination }),
  };
  res.json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500
): void => {
  const response: ApiResponse<null> = {
    status: 'error',
    message,
  };
  res.status(statusCode).json(response);
}; 