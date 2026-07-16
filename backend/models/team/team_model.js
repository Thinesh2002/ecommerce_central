const pool = require("../../config/db");

function scopedWhere(viewer, alias = "s") {
  if (viewer?.role === "admin") return { sql: "", params: [] };
  if (viewer?.role === "team_leader") {
    return { sql: `WHERE ${alias}.team_id = ?`, params: [viewer.team_id || 0] };
  }
  return { sql: `WHERE ${alias}.staff_id = ?`, params: [viewer?.staff_id || 0] };
}

class StaffModel {
  static async getAll(viewer) {
    const scope = scopedWhere(viewer, "s");
    const [rows] = await pool.query(
      `SELECT
        s.staff_id,
        s.staff_code,
        s.staff_name,
        s.department,
        s.role,
        s.email,
        s.active_status,
        s.team_id,
        t.team_name,
        s.created_at,
        s.updated_at
      FROM staff_details s
      LEFT JOIN teams t ON t.team_id = s.team_id
      ${scope.sql}
      ORDER BY s.staff_id DESC`,
      scope.params
    );
    return rows;
  }

  static async getById(id, viewer) {
    const scope = scopedWhere(viewer, "s");
    const scopeSql = scope.sql ? `${scope.sql} AND s.staff_id = ?` : "WHERE s.staff_id = ?";
    const [rows] = await pool.query(
      `SELECT s.*, t.team_name
       FROM staff_details s
       LEFT JOIN teams t ON t.team_id = s.team_id
       ${scopeSql}
       LIMIT 1`,
      [...scope.params, id]
    );
    return rows[0] || null;
  }

  static async create(data, viewer) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const teamId = viewer?.role === "team_leader" ? viewer.team_id : data.team_id || null;

      const [exists] = await connection.query(
        `SELECT staff_id FROM staff_details WHERE staff_code = ? OR email = ? LIMIT 1`,
        [data.staff_code, data.email]
      );
      if (exists.length > 0) throw new Error("Staff code or email already exists");

      const [result] = await connection.query(
        `INSERT INTO staff_details
          (staff_code, staff_name, department, role, email, active_status, team_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.staff_code,
          data.staff_name,
          data.department || "eBay",
          data.role || "user",
          data.email,
          data.active_status || "Active",
          teamId,
        ]
      );

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id, data, viewer) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const current = await StaffModel.getById(id, viewer);
      if (!current) throw new Error("Staff not found or outside your team");

      const [exists] = await connection.query(
        `SELECT staff_id
         FROM staff_details
         WHERE (staff_code = ? OR email = ?) AND staff_id != ?
         LIMIT 1`,
        [data.staff_code, data.email, id]
      );
      if (exists.length > 0) throw new Error("Staff code or email already exists");

      const teamId = viewer?.role === "team_leader" ? viewer.team_id : data.team_id || null;

      const [result] = await connection.query(
        `UPDATE staff_details
         SET staff_code = ?, staff_name = ?, department = ?, role = ?, email = ?, active_status = ?, team_id = ?
         WHERE staff_id = ?`,
        [
          data.staff_code,
          data.staff_name,
          data.department || "eBay",
          data.role || "user",
          data.email,
          data.active_status || "Active",
          teamId,
          id,
        ]
      );

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id, viewer) {
    const staff = await StaffModel.getById(id, viewer);
    if (!staff) throw new Error("Staff not found or outside your team");

    const [result] = await pool.query(`DELETE FROM staff_details WHERE staff_id = ?`, [id]);
    return result;
  }

  static async changeStatus(id, status, viewer) {
    const allowedStatus = ["Active", "Inactive"];
    if (!allowedStatus.includes(status)) throw new Error("Invalid staff status");

    const staff = await StaffModel.getById(id, viewer);
    if (!staff) throw new Error("Staff not found or outside your team");

    const [result] = await pool.query(
      `UPDATE staff_details SET active_status = ?, updated_at = NOW() WHERE staff_id = ?`,
      [status, id]
    );
    return result;
  }

  static async search(keyword, viewer) {
    const searchText = `%${keyword}%`;
    const scope = scopedWhere(viewer, "s");
    const connector = scope.sql ? "AND" : "WHERE";

    const [rows] = await pool.query(
      `SELECT s.*, t.team_name
       FROM staff_details s
       LEFT JOIN teams t ON t.team_id = s.team_id
       ${scope.sql}
       ${connector} (
          s.staff_code LIKE ?
          OR s.staff_name LIKE ?
          OR s.department LIKE ?
          OR s.role LIKE ?
          OR s.email LIKE ?
          OR s.active_status LIKE ?
          OR t.team_name LIKE ?
       )
       ORDER BY s.staff_id DESC`,
      [...scope.params, searchText, searchText, searchText, searchText, searchText, searchText, searchText]
    );
    return rows;
  }

  static async listTeams(viewer) {
    if (viewer?.role === "admin") {
      const [rows] = await pool.query(`SELECT * FROM teams ORDER BY team_name ASC`);
      return rows;
    }
    if (viewer?.role === "team_leader") {
      const [rows] = await pool.query(`SELECT * FROM teams WHERE team_id = ?`, [viewer.team_id || 0]);
      return rows;
    }
    return [];
  }

  static async createTeam(data) {
    const [result] = await pool.query(
      `INSERT INTO teams (team_name, department, description, status, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [data.team_name, data.department || "eBay", data.description || null, data.status || "Active"]
    );
    return result;
  }
}

module.exports = StaffModel;
