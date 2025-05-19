import axios from "axios";
import { handleApiError } from "./errorHandling";
import { throttledRequest } from "./apiThrottler";
import { v4 as uuidv4 } from "uuid";

// Create an axios instance with default config
const api = axios.create({
  baseURL: "/api",
  timeout: 20000, // Extended timeout for throttled requests
});

// Add a request interceptor to include authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("youtube_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = handleApiError(error);

    // Handle authentication errors globally
    if (
      apiError.isAuthError &&
      !apiError.isQuotaError &&
      !apiError.isPermissionError &&
      typeof window !== "undefined"
    ) {
      console.log("Authentication error detected in API interceptor");
      // Clear token on auth errors
      localStorage.removeItem("youtube_token");

      // If it's specifically a token validation error, mark it in session storage
      if (apiError.isTokenError) {
        console.log("Token validation error detected");
        sessionStorage.setItem("youtube_token_error", "true");
        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("youtube_token_status", {
            detail: { tokenError: true },
          })
        );
      }

      // Only redirect if we're not already on the login page
      if (
        window.location.pathname !== "/" &&
        !window.location.pathname.includes("/auth-callback")
      ) {
        console.log("Redirecting to login page due to auth error");
        window.location.href = "/";
      }
    }

    return Promise.reject(apiError);
  }
);

// Enhanced API client with throttling to minimize API quota usage
const throttledApi = {
  get: async <T>(
    url: string,
    config?: any,
    priority?: number
  ): Promise<{ data: T }> => {
    const reqId = `get-${url}-${uuidv4()}`;
    return throttledRequest(reqId, () => api.get<T>(url, config), priority);
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: any,
    priority?: number
  ): Promise<{ data: T }> => {
    const reqId = `post-${url}-${uuidv4()}`;
    return throttledRequest(
      reqId,
      () => api.post<T>(url, data, config),
      priority
    );
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: any,
    priority?: number
  ): Promise<{ data: T }> => {
    const reqId = `put-${url}-${uuidv4()}`;
    return throttledRequest(
      reqId,
      () => api.put<T>(url, data, config),
      priority
    );
  },

  delete: async <T>(
    url: string,
    config?: any,
    priority?: number
  ): Promise<{ data: T }> => {
    const reqId = `delete-${url}-${uuidv4()}`;
    return throttledRequest(reqId, () => api.delete<T>(url, config), priority);
  },

  // Access to the original non-throttled API
  original: api,
};

export default throttledApi;
