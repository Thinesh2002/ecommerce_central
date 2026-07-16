const pool = require("../../config/db");
const {
  ROLE,
  EDITABLE_ROLES,
  refreshRolePermissions,
  getRolePermissionKeys,
} = require("../../config/permissions");
const { logActivity } = require("../../utils/auditLogger");

exports.getMatrix = async (req, res) => {
  try {
    const [permissions] = await pool.query(
      `SELECT permission_key, module_key, description FROM app_permissions ORDER BY module_key, permission_key`
    );

    const matrix = {
      [ROLE.ADMIN]: getRolePermissionKeys(ROLE.ADMIN),
      [ROLE.TEAM_LEADER]: getRolePermissionKeys(ROLE.TEAM_LEADER),
      [ROLE.USER]: getRolePermissionKeys(ROLE.USER),
    };

    res.json({ success: true, permissions, matrix, editableRoles: EDITABLE_ROLES });
  } catch (error) {
    console.error("getMatrix error", error);
    res.status(500).json({ success: false, message: "Failed to load permission matrix" });
  }
};

exports.getMine = async (req, res) => {
  res.json({ success: true, role: req.user.role, permissions: getRolePermissionKeys(req.user.role) });
};

exports.updateRolePermissions = async (req, res) => {
  const { role } = req.params;
  const { permission_keys } = req.body;

  if (!EDITABLE_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "This role's access cannot be edited" });
  }
  if (!Array.isArray(permission_keys)) {
    return res.status(400).json({ success: false, message: "permission_keys must be an array" });
  }

  const connection = await pool.getConnection();
  try {
    const [validRows] = await connection.query(`SELECT permission_key FROM app_permissions`);
    const validKeys = new Set(validRows.map((r) => r.permission_key));
    const keys = [...new Set(permission_keys)].filter((key) => validKeys.has(key));

    await connection.beginTransaction();
    await connection.query(`DELETE FROM role_permissions WHERE role = ?`, [role]);
    if (keys.length) {
      const values = keys.map((key) => [role, key]);
      await connection.query(`INSERT INTO role_permissions (role, permission_key) VALUES ?`, [values]);
    }
    await connection.commit();

    await refreshRolePermissions();
    await logActivity({
      req,
      action: "role_permissions.update",
      entityType: "role_permissions",
      entityId: role,
      after: { role, permission_keys: keys },
    });

    res.json({ success: true, message: "Role access updated", role, permission_keys: keys });
  } catch (error) {
    await connection.rollback();
    console.error("updateRolePermissions error", error);
    res.status(500).json({ success: false, message: "Failed to update role access" });
  } finally {
    connection.release();
  }
};
