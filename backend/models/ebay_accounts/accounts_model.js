const pool = require("../../config/db");

class AccountModel {
  // Get All Accounts
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT
        account_id,
        account_code,
        account_name,
        account_holder,
        marketplace,
        status,
        created_at
      FROM account_details
      ORDER BY account_id DESC
    `);

    return rows;
  }

  // Get Single Account
  static async getById(id) {
    const [rows] = await pool.query(
      `
      SELECT
        account_id,
        account_code,
        account_name,
        account_holder,
        marketplace,
        status,
        created_at
      FROM account_details
      WHERE account_id = ?
      `,
      [id]
    );

    return rows[0];
  }

  // Create Account
  static async create(data) {
    const [result] = await pool.query(
      `
      INSERT INTO account_details
      (
        account_code,
        account_name,
        account_holder,
        marketplace,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.account_code,
        data.account_name,
        data.account_holder || null,
        data.marketplace || null,
        data.status || "Active",
      ]
    );

    return result;
  }

  // Update Account
  static async update(id, data) {
    const [result] = await pool.query(
      `
      UPDATE account_details
      SET
        account_code = ?,
        account_name = ?,
        account_holder = ?,
        marketplace = ?,
        status = ?
      WHERE account_id = ?
      `,
      [
        data.account_code,
        data.account_name,
        data.account_holder || null,
        data.marketplace || null,
        data.status || "Active",
        id,
      ]
    );

    return result;
  }

  // Delete Account
  static async delete(id) {
    const [result] = await pool.query(
      `
      DELETE FROM account_details
      WHERE account_id = ?
      `,
      [id]
    );

    return result;
  }
}

module.exports = AccountModel;