const pool = require("../../config/db");

function buildTaskScope(viewer, tableAlias = "d") {
  if (viewer?.role === "admin") return { sql: "", params: [] };

  if (viewer?.role === "team_leader") {
    return {
      sql: `AND (
        ${tableAlias}.team_id = ?
        OR ${tableAlias}.name IN (SELECT staff_name FROM staff_details WHERE team_id = ?)
      )`,
      params: [viewer.team_id || 0, viewer.team_id || 0],
    };
  }

  return {
    sql: `AND (
      ${tableAlias}.assigned_to_user_id = ?
      OR ${tableAlias}.name = ?
      OR ${tableAlias}.name = (SELECT staff_name FROM staff_details WHERE staff_id = ? LIMIT 1)
    )`,
    params: [viewer?.id || 0, viewer?.name || "", viewer?.staff_id || 0],
  };
}

class TaskModel {
  static async getAllTasks(filters = {}, viewer) {
    const {
      search = "",
      department = "",
      name = "",
      account_name = "",
      account_code = "",
      task_tier = "",
      verified = "",
      waste_flag = "",
      start_date = "",
      end_date = "",
      page = 1,
      limit = 20,
      sort_by = "date",
      sort_order = "DESC",
    } = filters;

    const allowedSortFields = [
      "id",
      "date",
      "task_id",
      "name",
      "Department",
      "account_name",
      "account_code",
      "task_tier",
      "hours_spent",
      "verified",
      "waste_flag",
      "created_at",
    ];

    const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : "date";
    const safeSortOrder = String(sort_order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (Number(page) - 1) * Number(limit);

    let where = `WHERE 1=1`;
    const params = [];

    const scope = buildTaskScope(viewer, "d");
    where += ` ${scope.sql}`;
    params.push(...scope.params);

    if (search) {
      where += ` AND (
        d.task_id LIKE ? OR d.name LIKE ? OR d.Department LIKE ? OR d.account_name LIKE ? OR d.account_code LIKE ?
        OR d.task_description LIKE ? OR d.metric_name LIKE ? OR d.scenario LIKE ? OR d.product_ids_worked_on LIKE ?
      )`;
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (department) { where += ` AND d.Department = ?`; params.push(department); }
    if (name) { where += ` AND d.name = ?`; params.push(name); }
    if (account_name) { where += ` AND d.account_name = ?`; params.push(account_name); }
    if (account_code) { where += ` AND d.account_code = ?`; params.push(account_code); }
    if (task_tier) { where += ` AND d.task_tier = ?`; params.push(task_tier); }
    if (verified !== "") { where += ` AND d.verified = ?`; params.push(verified); }
    if (waste_flag !== "") { where += ` AND d.waste_flag = ?`; params.push(waste_flag); }

    if (start_date && end_date) { where += ` AND d.date BETWEEN ? AND ?`; params.push(start_date, end_date); }
    else if (start_date) { where += ` AND d.date >= ?`; params.push(start_date); }
    else if (end_date) { where += ` AND d.date <= ?`; params.push(end_date); }

    const [rows] = await pool.query(
      `SELECT d.*
       FROM daily_work_log d
       ${where}
       ORDER BY d.${safeSortBy} ${safeSortOrder}, d.id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM daily_work_log d ${where}`,
      params
    );

    return {
      data: rows,
      pagination: {
        total: countRows[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRows[0].total / Number(limit)),
      },
    };
  }

  static async getTaskById(id) {
    const [rows] = await pool.query(`SELECT * FROM daily_work_log WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  static async taskBelongsToLeaderTeam(task, viewer) {
    if (!task || !viewer?.team_id) return false;
    if (Number(task.team_id || 0) === Number(viewer.team_id || 0)) return true;
    const [rows] = await pool.query(
      `SELECT staff_id FROM staff_details WHERE team_id = ? AND staff_name = ? LIMIT 1`,
      [viewer.team_id, task.name]
    );
    return rows.length > 0;
  }

  static async canAccessTask(task, viewer, action = "read") {
    if (!task || !viewer) return false;
    if (viewer.role === "admin") return true;

    if (viewer.role === "team_leader") {
      return TaskModel.taskBelongsToLeaderTeam(task, viewer);
    }

    if (action === "delete" || action === "create" || action === "verify") return false;
    return (
      Number(task.assigned_to_user_id || 0) === Number(viewer.id) ||
      String(task.name || "").toLowerCase() === String(viewer.name || "").toLowerCase()
    );
  }

  static async createTask(data, viewer) {
    const teamId = viewer?.role === "team_leader" ? viewer.team_id : data.team_id || null;
    const [result] = await pool.query(
      `INSERT INTO daily_work_log (
        date, task_id, name, Department, account_name, account_code, weekly_intent_id,
        task_tier, tier_description, task_description, metric_name, metric_delta, hours_spent,
        verified, verification_url, waste_flag, waste_type, scenario, product_ids_worked_on,
        assigned_by_user_id, assigned_to_user_id, team_id, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        data.date || null,
        data.task_id || null,
        data.name || null,
        data.Department || null,
        data.account_name || null,
        data.account_code || null,
        data.weekly_intent_id || null,
        data.task_tier || null,
        data.tier_description || null,
        data.task_description || null,
        data.metric_name || null,
        data.metric_delta || 0,
        data.hours_spent || 0,
        data.verified === "Yes" ? 1 : data.verified || 0,
        data.verification_url || null,
        data.waste_flag === "Yes" ? 1 : data.waste_flag || 0,
        data.waste_type || null,
        data.scenario || null,
        data.product_ids_worked_on || null,
        viewer?.id || null,
        data.assigned_to_user_id || null,
        teamId,
      ]
    );
    return result;
  }

  static async updateTask(id, data) {
    const [result] = await pool.query(
      `UPDATE daily_work_log SET
        date = ?, task_id = ?, name = ?, Department = ?, account_name = ?, account_code = ?, weekly_intent_id = ?,
        task_tier = ?, tier_description = ?, task_description = ?, metric_name = ?, metric_delta = ?, hours_spent = ?,
        verified = ?, verification_url = ?, waste_flag = ?, waste_type = ?, scenario = ?, product_ids_worked_on = ?,
        assigned_to_user_id = ?, team_id = COALESCE(?, team_id), updated_at = NOW()
       WHERE id = ?`,
      [
        data.date || null,
        data.task_id || null,
        data.name || null,
        data.Department || null,
        data.account_name || null,
        data.account_code || null,
        data.weekly_intent_id || null,
        data.task_tier || null,
        data.tier_description || null,
        data.task_description || null,
        data.metric_name || null,
        data.metric_delta || 0,
        data.hours_spent || 0,
        data.verified === "Yes" ? 1 : data.verified || 0,
        data.verification_url || null,
        data.waste_flag === "Yes" ? 1 : data.waste_flag || 0,
        data.waste_type || null,
        data.scenario || null,
        data.product_ids_worked_on || null,
        data.assigned_to_user_id || null,
        data.team_id || null,
        id,
      ]
    );
    return result;
  }

  static async updateTaskUserFields(id, data) {
    const fields = [];
    const params = [];
    const allowed = [
      "metric_name",
      "metric_delta",
      "hours_spent",
      "verified",
      "verification_url",
      "waste_flag",
      "waste_type",
      "scenario",
      "product_ids_worked_on",
    ];
    allowed.forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] === "Yes" ? 1 : data[key] === "No" ? 0 : data[key]);
      }
    });
    if (!fields.length) return { affectedRows: 0 };
    fields.push("updated_at = NOW()");
    params.push(id);
    const [result] = await pool.query(`UPDATE daily_work_log SET ${fields.join(", ")} WHERE id = ?`, params);
    return result;
  }

  static async deleteTask(id) {
    const [result] = await pool.query(`DELETE FROM daily_work_log WHERE id = ?`, [id]);
    return result;
  }

  static async bulkDeleteTasks(ids = []) {
    if (!ids.length) throw new Error("No task ids provided");
    const [result] = await pool.query(`DELETE FROM daily_work_log WHERE id IN (?)`, [ids]);
    return result;
  }

  static async markVerified(id, verification_url = null) {
    const [result] = await pool.query(
      `UPDATE daily_work_log SET verified = 1, verification_url = ?, updated_at = NOW() WHERE id = ?`,
      [verification_url, id]
    );
    return result;
  }

  static async markUnverified(id) {
    const [result] = await pool.query(
      `UPDATE daily_work_log SET verified = 0, verification_url = NULL, updated_at = NOW() WHERE id = ?`,
      [id]
    );
    return result;
  }

  static async getTaskSummary(filters = {}, viewer) {
    const { start_date = "", end_date = "", department = "", name = "" } = filters;
    let where = `WHERE 1=1`;
    const params = [];
    const scope = buildTaskScope(viewer, "d");
    where += ` ${scope.sql}`;
    params.push(...scope.params);

    if (start_date && end_date) { where += ` AND d.date BETWEEN ? AND ?`; params.push(start_date, end_date); }
    if (department) { where += ` AND d.Department = ?`; params.push(department); }
    if (name) { where += ` AND d.name = ?`; params.push(name); }

    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total_tasks,
        COALESCE(SUM(d.hours_spent),0) AS total_hours,
        SUM(CASE WHEN d.verified = 1 THEN 1 ELSE 0 END) AS verified_tasks,
        SUM(CASE WHEN d.waste_flag = 1 THEN 1 ELSE 0 END) AS waste_tasks,
        COUNT(DISTINCT d.name) AS total_staff,
        COUNT(DISTINCT d.Department) AS total_departments
       FROM daily_work_log d ${where}`,
      params
    );
    return rows[0];
  }

  static async getTasksByDepartment(viewer) {
    let where = `WHERE 1=1`;
    const scope = buildTaskScope(viewer, "d");
    where += ` ${scope.sql}`;
    const [rows] = await pool.query(
      `SELECT d.Department, COUNT(*) AS total_tasks, SUM(d.hours_spent) AS total_hours
       FROM daily_work_log d ${where}
       GROUP BY d.Department ORDER BY total_tasks DESC`,
      scope.params
    );
    return rows;
  }

  static async getTasksByStaff(viewer) {
    let where = `WHERE 1=1`;
    const scope = buildTaskScope(viewer, "d");
    where += ` ${scope.sql}`;
    const [rows] = await pool.query(
      `SELECT d.name, COUNT(*) AS total_tasks, SUM(d.hours_spent) AS total_hours,
        SUM(CASE WHEN d.verified = 1 THEN 1 ELSE 0 END) AS verified_tasks
       FROM daily_work_log d ${where}
       GROUP BY d.name ORDER BY total_tasks DESC`,
      scope.params
    );
    return rows;
  }

  static async getFilterOptions(viewer) {
    let where = `WHERE 1=1`;
    const scope = buildTaskScope(viewer, "d");
    where += ` ${scope.sql}`;

    const [departments] = await pool.query(
      `SELECT DISTINCT d.Department FROM daily_work_log d ${where} AND d.Department IS NOT NULL AND d.Department != '' ORDER BY d.Department ASC`,
      scope.params
    );
    const [names] = await pool.query(
      `SELECT DISTINCT d.name FROM daily_work_log d ${where} AND d.name IS NOT NULL AND d.name != '' ORDER BY d.name ASC`,
      scope.params
    );
    const [tiers] = await pool.query(
      `SELECT DISTINCT d.task_tier FROM daily_work_log d ${where} AND d.task_tier IS NOT NULL AND d.task_tier != '' ORDER BY d.task_tier ASC`,
      scope.params
    );

    return { departments, names, tiers };
  }
}

module.exports = TaskModel;
