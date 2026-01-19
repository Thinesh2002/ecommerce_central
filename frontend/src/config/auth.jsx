export const USER_KEY = "user";
export const TOKEN_KEY = "token";

// Emit event so components update (same-tab)
function emitAuthChange() {
  try {
    window.dispatchEvent(new Event("auth_change"));
  } catch {}
}

/* ---------------------- GET USER ---------------------- */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("getStoredUser error:", error);
    return null;
  }
}

/* ---------------------- SET USER ---------------------- */
export function setStoredUser(user) {
  try {
    if (!user) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, JSON.stringify(user));
    emitAuthChange();
  } catch (error) {
    console.error("setStoredUser error:", error);
  }
}

/* ---------------------- GET TOKEN ---------------------- */
export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("getAuthToken error:", error);
    return null;
  }
}

/* ---------------------- SET TOKEN ---------------------- */
export function setAuthToken(token) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
    emitAuthChange();
  } catch (error) {
    console.error("setAuthToken error:", error);
  }
}

/* ---------------------- CLEAR AUTH ---------------------- */
export function clearAuth() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    emitAuthChange();
  } catch (error) {
    console.error("clearAuth error:", error);
  }
}

/* ---------------------- LOGIN STORE ---------------------- */
export function storeAuth(user, token) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);

    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);

    emitAuthChange();
  } catch (error) {
    console.error("storeAuth error:", error);
  }
}

/* ---------------------- LOGOUT ---------------------- */
export function logout() {
  clearAuth();
}

/* ---- aliases (safe for old code) ---- */
export const getUser = getStoredUser;
export const getToken = getAuthToken;
export const setUser = setStoredUser;
export const setToken = setAuthToken;
