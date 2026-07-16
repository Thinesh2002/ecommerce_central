const pool = require("../../config/db");

class DashboardModel {
  static async getSummary() {
    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*) total_tasks,
        COALESCE(SUM(hours_spent),0) total_hours,
        COALESCE(SUM(
          CASE WHEN verified='Yes'
          THEN 1 ELSE 0 END
        ),0) verified_tasks,
        COALESCE(SUM(
          CASE WHEN waste_flag='Yes'
          THEN hours_spent ELSE 0 END
        ),0) waste_hours
      FROM daily_work_log
    `);

    return summary;
  }

  static async getTierData() {
    const [rows] = await pool.query(`
      SELECT
        task_tier,
        COUNT(*) task_count,
        SUM(hours_spent) total_hours
      FROM daily_work_log
      GROUP BY task_tier
    `);

    return rows;
  }

  static async getStaffPerformance() {
    const [rows] = await pool.query(`
      SELECT
        name,
        COUNT(*) total_tasks,
        SUM(hours_spent) total_hours
      FROM daily_work_log
      GROUP BY name
      ORDER BY total_hours DESC
    `);

    return rows;
  }

  static async getAccountPerformance() {
    const [rows] = await pool.query(`
      SELECT
        scenario,
        COUNT(*) total_tasks,
        SUM(hours_spent) total_hours
      FROM daily_work_log
      GROUP BY scenario
    `);

    return rows;
  }
}

module.exports = DashboardModel;