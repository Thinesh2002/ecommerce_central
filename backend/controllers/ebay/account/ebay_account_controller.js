const AccountModel = require("../../../models/ebay_accounts/accounts_model");

const accountController = {
  // GET all accounts
  getAll: async (req, res) => {
    try {
      const accounts = await AccountModel.getAll();

      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      console.error("Get Accounts Error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch accounts",
        error: error.message,
      });
    }
  },

  // CREATE account
  create: async (req, res) => {
    try {
      const {
        account_code,
        account_name,
        account_holder,
        marketplace,
        status,
      } = req.body;

      if (!account_code || !account_name) {
        return res.status(400).json({
          success: false,
          message: "Account code and account name are required",
        });
      }

      const result = await AccountModel.create({
        account_code,
        account_name,
        account_holder,
        marketplace,
        status,
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        account_id: result.insertId,
      });
    } catch (error) {
      console.error("Create Account Error:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Account code already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create account",
        error: error.message,
      });
    }
  },

  // UPDATE account
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        account_code,
        account_name,
        account_holder,
        marketplace,
        status,
      } = req.body;

      if (!account_code || !account_name) {
        return res.status(400).json({
          success: false,
          message: "Account code and account name are required",
        });
      }

      const result = await AccountModel.update(id, {
        account_code,
        account_name,
        account_holder,
        marketplace,
        status,
      });

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Account updated successfully",
      });
    } catch (error) {
      console.error("Update Account Error:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Account code already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update account",
        error: error.message,
      });
    }
  },

  // DELETE account
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await AccountModel.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete Account Error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete account",
        error: error.message,
      });
    }
  },
};

module.exports = accountController;