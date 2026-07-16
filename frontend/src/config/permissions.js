export const ROLE = Object.freeze({
  ADMIN: "admin",
  TEAM_LEADER: "team_leader",
  USER: "user",
});

export const PERMISSIONS = Object.freeze({
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  TEAM_READ: "team:read",
  TEAM_CREATE: "team:create",
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",
  TASK_READ: "task:read",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_VERIFY: "task:verify",
  ACCOUNT_READ: "account:read",
  ACCOUNT_CREATE: "account:create",
  ACCOUNT_UPDATE: "account:update",
  ACCOUNT_DELETE: "account:delete",
  KEYWORD_READ: "keyword:read",
  KEYWORD_ADVANCED: "keyword:advanced",
  SELLER_READ: "seller:read",
  LISTING_AUDIT: "listing:audit",
  AI_USE: "ai:use",
});

const PERMISSIONS_KEY = "permissions";

// Master admin decides, per role, which permission keys are granted (backend: role_permissions table).
// This is fetched once after login / app bootstrap and cached here so route guards and the
// sidebar can check access synchronously without round-tripping to the API on every render.
export function getMyPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setMyPermissions(permissions = []) {
  try {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    window.dispatchEvent(new Event("auth_change"));
  } catch {
    // ignore storage failures
  }
}

export function clearMyPermissions() {
  try {
    localStorage.removeItem(PERMISSIONS_KEY);
  } catch {
    // ignore storage failures
  }
}

export function getRole(user) {
  const role = String(user?.role || ROLE.USER).toLowerCase();
  return Object.values(ROLE).includes(role) ? role : ROLE.USER;
}

export function isAdmin(user) {
  return getRole(user) === ROLE.ADMIN;
}

export function isTeamLeader(user) {
  return getRole(user) === ROLE.TEAM_LEADER;
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  if (isAdmin(user)) return true;
  return getMyPermissions().includes(permission);
}

export function hasAnyPermission(user, permissions = []) {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
}

export function roleLabel(role) {
  const labels = {
    admin: "Admin",
    team_leader: "Team Leader",
    user: "User",
  };
  return labels[getRole({ role })] || "User";
}
