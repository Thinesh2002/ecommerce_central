const db = require("../config/db");

const PUBLIC_USER_SELECT = `
  u.id,
  u.name,
  u.user_id,
  u.email,
  u.role,
  u.team_id,
  u.staff_id,
  u.status,
  u.last_login_at,
  u.created_at,
  u.updated_at
`;

function normaliseRole(role) {
  const allowed = ["admin", "team_leader", "user"];
  const value = String(role || "user").toLowerCase();
  return allowed.includes(value) ? value : "user";
}

const User = {
  findByLogin: async (login) => {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = ? OR user_id = ? OR id = ? LIMIT 1`,
      [login, login, login]
    );
    return rows[0] || null;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
    return rows[0] || null;
  },

  findByUserId: async (user_id) => {
    const [rows] = await db.query(`SELECT * FROM users WHERE user_id = ? LIMIT 1`, [user_id]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  createUser: async ({
    name,
    user_id,
    email,
    hashedPassword,
    role = "user",
    team_id = null,
    staff_id = null,
    status = "Active",
    created_by = null,
    created_at = null,
  }) => {
    const [result] = await db.query(
      `INSERT INTO users
        (name, user_id, email, password, role, team_id, staff_id, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))`,
      [
        name || null,
        user_id || null,
        email || null,
        hashedPassword,
        normaliseRole(role),
        team_id || null,
        staff_id || null,
        status || "Active",
        created_by || null,
        created_at || null,
      ]
    );
    return result.insertId;
  },

  updateUserById: async (id, data = {}) => {
    const fields = [];
    const params = [];

    const map = {
      name: "name",
      user_id: "user_id",
      email: "email",
      role: "role",
      team_id: "team_id",
      staff_id: "staff_id",
      status: "status",
      hashedPassword: "password",
    };

    Object.entries(map).forEach(([key, column]) => {
      if (data[key] !== undefined) {
        fields.push(`${column} = ?`);
        params.push(key === "role" ? normaliseRole(data[key]) : data[key]);
      }
    });

    if (fields.length === 0) return 0;

    fields.push("updated_at = NOW()");
    params.push(id);
    const [res] = await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
    return res.affectedRows;
  },

  deleteUserById: async (id) => {
    const [res] = await db.query(`DELETE FROM users WHERE id = ?`, [id]);
    return res.affectedRows;
  },

  softDeleteUserById: async (id) => {
    const [res] = await db.query(
      `UPDATE users SET status = 'Inactive', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    return res.affectedRows;
  },

  updateLastLogin: async (id) => {
    try {
      await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [id]);
    } catch (error) {
      console.warn("[LAST_LOGIN_SKIPPED]", error.message);
    }
  },

  getUsersForViewer: async (viewer) => {
    if (viewer?.role === "admin") {
      const [rows] = await db.query(
        `SELECT ${PUBLIC_USER_SELECT}, t.team_name
         FROM users u
         LEFT JOIN teams t ON t.team_id = u.team_id
         ORDER BY u.id DESC`
      );
      return rows;
    }

    if (viewer?.role === "team_leader") {
      const [rows] = await db.query(
        `SELECT ${PUBLIC_USER_SELECT}, t.team_name
         FROM users u
         LEFT JOIN teams t ON t.team_id = u.team_id
         WHERE u.team_id = ? OR u.id = ?
         ORDER BY u.id DESC`,
        [viewer.team_id || 0, viewer.id]
      );
      return rows;
    }

    const [rows] = await db.query(
      `SELECT ${PUBLIC_USER_SELECT}, t.team_name
       FROM users u
       LEFT JOIN teams t ON t.team_id = u.team_id
       WHERE u.id = ?`,
      [viewer?.id]
    );
    return rows;
  },

  getUserCountForViewer: async (viewer) => {
    if (viewer?.role === "admin") {
      const [rows] = await db.query(`SELECT COUNT(*) AS total FROM users`);
      return rows[0]?.total || 0;
    }
    if (viewer?.role === "team_leader") {
      const [rows] = await db.query(`SELECT COUNT(*) AS total FROM users WHERE team_id = ?`, [viewer.team_id || 0]);
      return rows[0]?.total || 0;
    }
    return 1;
  },

  getRecentUsersForViewer: async (viewer, limit = 5) => {
    if (viewer?.role === "admin") {
      const [rows] = await db.query(
        `SELECT ${PUBLIC_USER_SELECT} FROM users u ORDER BY created_at DESC LIMIT ?`,
        [Number(limit)]
      );
      return rows;
    }
    if (viewer?.role === "team_leader") {
      const [rows] = await db.query(
        `SELECT ${PUBLIC_USER_SELECT} FROM users u WHERE team_id = ? ORDER BY created_at DESC LIMIT ?`,
        [viewer.team_id || 0, Number(limit)]
      );
      return rows;
    }
    const user = await User.findById(viewer?.id);
    if (!user) return [];
    delete user.password;
    return [user];
  },

  belongsToViewerScope: (targetUser, viewer) => {
    if (!targetUser || !viewer) return false;
    if (viewer.role === "admin") return true;
    if (viewer.role === "team_leader") {
      return Number(targetUser.team_id || 0) === Number(viewer.team_id || 0) || Number(targetUser.id) === Number(viewer.id);
    }
    return Number(targetUser.id) === Number(viewer.id);
  },
};

// Backward-compatible aliases used by older controllers/pages.
User.getAllUsers = async () => User.getUsersForViewer({ role: "admin" });
User.getUserCount = async () => User.getUserCountForViewer({ role: "admin" });
User.getRecentUsers = async (limit = 5) => User.getRecentUsersForViewer({ role: "admin" }, limit);

module.exports = User;
