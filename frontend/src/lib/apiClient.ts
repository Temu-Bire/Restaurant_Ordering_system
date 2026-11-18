import axios, { isAxiosError } from "axios";

import { clearSession, getToken, UNAUTHORIZED_EVENT } from "./session";

// Lets a single request opt out of sending the token (login, register)
declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000/api";
export const API_BASE_URL = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, "")}/api`;

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

/* ---------- Request: attach the token ---------- */
http.interceptors.request.use((config) => {
  const token = getToken();

  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ---------- Response: one error shape for the whole app ---------- */

// Nest sends { statusCode, message: string | string[], error }
function extractMessage(data: unknown): string | null {
  const message = (data as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(". ");
  return typeof message === "string" ? message : null;
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    // No response at all: server down, CORS blocked, offline or timeout
    if (!error.response) {
      const timedOut = error.code === "ECONNABORTED";
      return Promise.reject(
        new ApiError(
          timedOut
            ? "The server took too long to respond. Try again."
            : "Can't reach the server. Check your connection.",
          0
        )
      );
    }

    const { status, data } = error.response;

    // Rejected token on a protected call: log the user out
    if (status === 401 && getToken() && !error.config?.skipAuth) {
      clearSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(
      new ApiError(extractMessage(data) ?? "Something went wrong", status)
    );
  }
);

/* ---------- Public API: unchanged from before ---------- */
interface Options {
  auth?: boolean; // send the token? (false for login and register)
}

const cfg = (opts?: Options) => ({ skipAuth: opts?.auth === false });

export const api = {
  get: <T>(path: string, opts?: Options) =>
    http.get<T>(path, cfg(opts)).then((r) => r.data),

  post: <T>(path: string, body?: unknown, opts?: Options) =>
    http.post<T>(path, body, cfg(opts)).then((r) => r.data),

  patch: <T>(path: string, body?: unknown, opts?: Options) =>
    http.patch<T>(path, body, cfg(opts)).then((r) => r.data),

  put: <T>(path: string, body?: unknown, opts?: Options) =>
    http.put<T>(path, body, cfg(opts)).then((r) => r.data),

  delete: <T>(path: string, opts?: Options) =>
    http.delete<T>(path, cfg(opts)).then((r) => r.data),
};