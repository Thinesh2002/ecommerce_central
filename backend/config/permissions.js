const ROLE = Object.freeze({
  ADMIN: "admin",
  TEAM_LEADER: "team_leader",
  USER: "user",
});

const PERMISSIONS = Object.freeze({
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

// Roles whose access is admin-editable at runtime via role_permissions.
// Admin always has full access and is never DB-driven, so it can't be locked out.
const EDITABLE_ROLES = [ROLE.TEAM_LEADER, ROLE.USER];

// In-memory cache of { team_leader: Set<permission_key>, user: Set<permission_key> }.
// Populated at server startup and refreshed whenever an admin edits role_permissions.
let roleCache = { [ROLE.TEAM_LEADER]: new Set(), [ROLE.USER]: new Set() };
let loaded = false;

async function refreshRolePermissions() {
  // Required lazily to avoid a require-cycle at module load time (config/db -> ... -> config/permissions).
  const pool = require("./db");
  const nextCache = { [ROLE.TEAM_LEADER]: new Set(), [ROLE.USER]: new Set() };

  const [rows] = await pool.query(
    `SELECT role, permission_key FROM role_permissions WHERE role IN (?, ?)`,
    [ROLE.TEAM_LEADER, ROLE.USER]
  );

  rows.forEach((row) => {
    if (nextCache[row.role]) nextCache[row.role].add(row.permission_key);
  });

  roleCache = nextCache;
  loaded = true;
  return roleCache;
}

function normaliseRole(role) {
  const value = String(role || ROLE.USER).toLowerCase();
  if ([ROLE.ADMIN, ROLE.TEAM_LEADER, ROLE.USER].includes(value)) return value;
  return ROLE.USER;
}

function hasPermission(user, permission) {
  if (!user || !permission) return false;
  const role = normaliseRole(user.role);
  if (role === ROLE.ADMIN) return true;
  return roleCache[role]?.has(permission) || false;
}

function hasAnyPermission(user, permissions = []) {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
}

function isAdmin(user) {
  return normaliseRole(user?.role) === ROLE.ADMIN;
}

function isTeamLeader(user) {
  return normaliseRole(user?.role) === ROLE.TEAM_LEADER;
}

function getRolePermissionKeys(role) {
  const normalised = normaliseRole(role);
  if (normalised === ROLE.ADMIN) return Object.values(PERMISSIONS);
  return Array.from(roleCache[normalised] || []);
}

module.exports = {
  ROLE,
  PERMISSIONS,
  EDITABLE_ROLES,
  normaliseRole,
  hasPermission,
  hasAnyPermission,
  isAdmin,
  isTeamLeader,
  refreshRolePermissions,
  getRolePermissionKeys,
  isCacheLoaded: () => loaded,
};
