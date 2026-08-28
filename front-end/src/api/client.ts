import axios from "axios";

/**
 * In production (Vercel), the frontend and API share the same origin,
 * so we use a relative base URL "/api".
 *
 * In local development, VITE_API_URL points to http://localhost:5000/api.
 *
 * VITE_API_URL is set in front-end/.env for local dev.
 * On Vercel it is intentionally left unset so the fallback "/api" is used.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT token ─────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 auto-logout ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
