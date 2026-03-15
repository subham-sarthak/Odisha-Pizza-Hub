import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let refreshSessionHandler = null;
let authFailureHandler = null;
let csrfTokenLoader = null;

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true
});

export const registerAuthRefreshHandler = (handler) => {
  refreshSessionHandler = handler;
};

export const registerAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

export const registerCsrfTokenLoader = (handler) => {
  csrfTokenLoader = handler;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const csrfToken = localStorage.getItem("csrfToken");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (csrfToken && config.method && !["get", "head", "options"].includes(config.method.toLowerCase())) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";
    const errorMessage = error.response?.data?.message;

    if (
      status === 403 &&
      errorMessage === "Invalid CSRF token" &&
      csrfTokenLoader &&
      originalRequest &&
      !originalRequest._csrfRetry &&
      !requestUrl.includes("/auth/csrf-token")
    ) {
      originalRequest._csrfRetry = true;

      try {
        const nextCsrfToken = await csrfTokenLoader(true);
        if (nextCsrfToken) {
          originalRequest.headers["X-CSRF-Token"] = nextCsrfToken;
        }
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    if (
      status === 401 &&
      refreshSessionHandler &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/register") &&
      !requestUrl.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const nextAccessToken = await refreshSessionHandler();
        if (nextAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        authFailureHandler?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
