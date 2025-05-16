import axios from "axios";
import { handleApiError } from "./errorHandling";

// Create an axios instance with default config
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
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
      typeof window !== "undefined"
    ) {
      console.log("Authentication error detected in API interceptor");
      // Clear token on auth errors
      localStorage.removeItem("youtube_token");

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

export default api;
