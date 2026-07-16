const { hasPermission, hasAnyPermission, isAdmin, isTeamLeader } = require("../config/permissions");

function requirePermission(permission) {
  return (req, res, next) => {
    if (hasPermission(req.user, permission)) return next();
    return res.status(403).json({
      success: false,
      message: "Access denied",
      required_permission: permission,
    });
  };
}

function requireAnyPermission(permissions = []) {
  return (req, res, next) => {
    if (hasAnyPermission(req.user, permissions)) return next();
    return res.status(403).json({
      success: false,
      message: "Access denied",
      required_permissions: permissions,
    });
  };
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (allowed.includes(req.user?.role)) return next();
    return res.status(403).json({ success: false, message: "Access denied" });
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireRole,
  hasPermission,
  hasAnyPermission,
  isAdmin,
  isTeamLeader,
};
