const DashboardModel = require("../../models/task/task_dashboard_model");

const dashboardController = {
  getSummary: async (req, res) => {
    try {
      const data = await DashboardModel.getSummary();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch dashboard summary",
        error: error.message,
      });
    }
  },
};

module.exports = dashboardController;