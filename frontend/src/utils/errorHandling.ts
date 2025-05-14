import axios, { AxiosError } from "axios";

export interface ApiError {
  status: number;
  message: string;
  isAuthError: boolean;
  isQuotaError: boolean;
}

export function handleApiError(error: unknown): ApiError {
  // Default error response
  const defaultError: ApiError = {
    status: 500,
    message: "An unexpected error occurred",
    isAuthError: false,
    isQuotaError: false,
  };

  // If not an axios error, return default
  if (!axios.isAxiosError(error)) {
    return {
      ...defaultError,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const axiosError = error as AxiosError;

  // Get status code
  const status = axiosError.response?.status || 500;

  // Extract error message from response if available
  const responseData = axiosError.response?.data as any;
  const message =
    responseData?.message || axiosError.message || defaultError.message;

  // Check if it's an authentication error
  const isAuthError = status === 401;

  // Check if it's a quota error
  const isQuotaError =
    (status === 403 || status === 401) &&
    (message.toLowerCase().includes("quota") ||
      responseData?.error?.toLowerCase().includes("quota"));

  return {
    status,
    message,
    isAuthError,
    isQuotaError,
  };
}
