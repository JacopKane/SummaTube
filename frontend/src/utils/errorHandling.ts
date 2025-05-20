import axios, { AxiosError } from "axios";

export interface ApiError {
  status: number;
  message: string;
  isAuthError: boolean;
  isQuotaError: boolean;
  isPermissionError: boolean;
  isCaptionsNotAvailable?: boolean;
  isTokenError?: boolean;
}

export function handleApiError(error: unknown): ApiError {
  // Default error response
  const defaultError: ApiError = {
    status: 500,
    message: "An unexpected error occurred",
    isAuthError: false,
    isQuotaError: false,
    isPermissionError: false,
    isCaptionsNotAvailable: false,
    isTokenError: false,
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

  // Check if it's a permission error
  const isPermissionError =
    (status === 403 || status === 401) &&
    (message.toLowerCase().includes("permission") ||
      message.toLowerCase().includes("insufficient permissions") ||
      message.toLowerCase().includes("not sufficient") ||
      message.toLowerCase().includes("required youtube api scopes") ||
      responseData?.isPermissionError === true ||
      responseData?.error?.toLowerCase().includes("permission"));

  // Check if it's a case of captions not being available (rather than a permissions issue)
  const isCaptionsNotAvailable =
    responseData?.isCaptionsNotAvailable === true ||
    message.toLowerCase().includes("not publicly accessible") ||
    message.toLowerCase().includes("not have enabled third-party") ||
    message.toLowerCase().includes("no captions available") ||
    message.toLowerCase().includes("no captions found") ||
    message.toLowerCase().includes("captions are not available");

  // Check if it's a token validation error
  const isTokenError =
    status === 401 &&
    (message.toLowerCase().includes("invalid token") ||
      message.toLowerCase().includes("token validation failed") ||
      responseData?.error === "invalid_token");

  // If it's a permission error (and not just unavailable captions), store it in sessionStorage
  if (isPermissionError && !isCaptionsNotAvailable) {
    sessionStorage.setItem("youtube_permission_error", "true");
    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("youtube_permission_status", {
        detail: { permissionError: true },
      })
    );
  }

  // If it's a token error, store it in sessionStorage
  if (isTokenError) {
    sessionStorage.setItem("youtube_token_error", "true");
    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("youtube_token_status", {
        detail: { tokenError: true },
      })
    );
  }

  return {
    status,
    message,
    isAuthError,
    isQuotaError,
    isPermissionError,
    isCaptionsNotAvailable,
    isTokenError,
  };
}
