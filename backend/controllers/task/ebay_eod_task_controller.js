const TaskModel = require("../../models/task/ebay_eod_task_model");
const { isAdmin, isTeamLeader } = require("../../config/permissions");
const { logActivity } = require("../../utils/auditLogger");

async function assertTaskAccess(req, task, action) {
  const allowed = await TaskModel.canAccessTask(task, req.user, action);
  if (!allowed) {
    const error = new Error("You do not have access to this task");
    error.status = 403;
    throw error;
  }
}

const taskController = {
  getAllTasks: async (req, res) => {
    try {
      const tasks = await TaskModel.getAllTasks(req.query, req.user);
      res.status(200).json({ success: true, ...tasks });
    } catch (error) {
      console.error("Get Tasks Error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch tasks", error: error.message });
    }
  },

  getTaskById: async (req, res) => {
    try {
      const task = await TaskModel.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ success: false, message: "Task not found" });
      await assertTaskAccess(req, task, "read");
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      console.error("Get Task By ID Error:", error);
      res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Failed to fetch task", error: error.message });
    }
  },

  getTaskMaster: async (req, res) => {
    try {
      // Keep this flexible: frontend can use it for dropdown templates later.
      res.status(200).json({ success: true, data: [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch task master", error: error.message });
    }
  },

  createTask: async (req, res) => {
    try {
      if (!isAdmin(req.user) && !isTeamLeader(req.user)) {
        return res.status(403).json({ success: false, message: "Only admin and team leaders can create tasks" });
      }

      const payload = { ...req.body };
      if (isTeamLeader(req.user)) payload.team_id = req.user.team_id || null;

      const result = await TaskModel.createTask(payload, req.user);
      await logActivity({ req, action: "task.create", entityType: "daily_work_log", entityId: result.insertId, after: payload });

      res.status(201).json({ success: true, message: "Task created successfully", insertId: result.insertId });
    } catch (error) {
      console.error("Create Task Error:", error);
      res.status(500).json({ success: false, message: "Failed to create task", error: error.message });
    }
  },

  updateTask: async (req, res) => {
    try {
      const existingTask = await TaskModel.getTaskById(req.params.id);
      if (!existingTask) return res.status(404).json({ success: false, message: "Task not found" });
      await assertTaskAccess(req, existingTask, "update");

      if (req.user.role === "user") {
        await TaskModel.updateTaskUserFields(req.params.id, req.body);
      } else {
        const payload = { ...req.body };
        if (isTeamLeader(req.user)) payload.team_id = req.user.team_id || existingTask.team_id || null;
        await TaskModel.updateTask(req.params.id, payload);
      }

      const updatedTask = await TaskModel.getTaskById(req.params.id);
      await logActivity({ req, action: "task.update", entityType: "daily_work_log", entityId: req.params.id, before: existingTask, after: updatedTask });

      res.status(200).json({ success: true, message: "Task updated successfully" });
    } catch (error) {
      console.error("Update Task Error:", error);
      res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Failed to update task", error: error.message });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const existingTask = await TaskModel.getTaskById(req.params.id);
      if (!existingTask) return res.status(404).json({ success: false, message: "Task not found" });
      await assertTaskAccess(req, existingTask, "delete");

      await TaskModel.deleteTask(req.params.id);
      await logActivity({ req, action: "task.delete", entityType: "daily_work_log", entityId: req.params.id, before: existingTask });

      res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete Task Error:", error);
      res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Failed to delete task", error: error.message });
    }
  },

  bulkDeleteTasks: async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: "Task ids are required" });

      for (const id of ids) {
        const task = await TaskModel.getTaskById(id);
        await assertTaskAccess(req, task, "delete");
      }

      await TaskModel.bulkDeleteTasks(ids);
      await logActivity({ req, action: "task.bulk_delete", entityType: "daily_work_log", meta: { ids } });
      res.status(200).json({ success: true, message: "Tasks deleted successfully" });
    } catch (error) {
      console.error("Bulk Delete Tasks Error:", error);
      res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Failed to delete tasks", error: error.message });
    }
  },

  markVerified: async (req, res) => {
    try {
      const existingTask = await TaskModel.getTaskById(req.params.id);
      if (!existingTask) return res.status(404).json({ success: false, message: "Task not found" });
      await assertTaskAccess(req, existingTask, "verify");

      await TaskModel.markVerified(req.params.id, req.body.verification_url || null);
      await logActivity({ req, action: "task.verify", entityType: "daily_work_log", entityId: req.params.id, before: existingTask });
      res.status(200).json({ success: true, message: "Task verified successfully" });
    } catch (error) {
      console.error("Mark Verified Error:", error);
      res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Failed to verify task", error: error.message });
    }
  },

  markUnverified: async (req, res) => {
    try {
      const existingTask = await TaskModel.getTaskById(req.params.id);
      if (!existingTask) return res.status(404).json({ success: false, message: "Task not found" });
      await assertTaskAccess(req, existingTask, "verify");

      await TaskModel.markUnverified(req.params.id);
      await logActivity({ req, action: "task.unverify", entityType: "daily_work_log", entityId: req.params.id, before: existingTask });
      res.status(200).json({ success: true, message: "Task marked as unverified" });
    } catch (error) {
      console.error("Mark Unverified Error:", error);
      res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Failed to mark task as unverified", error: error.message });
    }
  },

  getTaskSummary: async (req, res) => {
    try {
      const summary = await TaskModel.getTaskSummary(req.query, req.user);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      console.error("Get Task Summary Error:", error);
      res.status(500).json({ success: false, message: "Failed to fetch summary", error: error.message });
    }
  },

  getTasksByDepartment: async (req, res) => {
    try {
      const data = await TaskModel.getTasksByDepartment(req.user);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch department report", error: error.message });
    }
  },

  getTasksByStaff: async (req, res) => {
    try {
      const data = await TaskModel.getTasksByStaff(req.user);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch staff report", error: error.message });
    }
  },

  getFilterOptions: async (req, res) => {
    try {
      const data = await TaskModel.getFilterOptions(req.user);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch filters", error: error.message });
    }
  },
};

module.exports = taskController;
