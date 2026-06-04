// Client-side session helpers — sessionStorage only, dies when tab closes.

const KEY = "papermind_session";

export function saveSession(token: string) {
  sessionStorage.setItem(KEY, token);
}

export function loadSession(): string | null {
  return sessionStorage.getItem(KEY);
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
