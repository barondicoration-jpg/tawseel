/**
 * store.ts — Auth helpers only.
 *
 * All data operations (orders, users, zones, etc.) are now handled via
 * the API service modules in src/api/. This file only manages the local
 * JWT token and cached user object so existing component imports don't break.
 */
import type { User } from "./types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function getAuth(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function logout() {
  clearToken();
  setAuth(null);
}

// ── Misc helpers still referenced by components ───────────────────────────────

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
