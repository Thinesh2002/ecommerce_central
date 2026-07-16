const StaffModel = require("../../models/team/team_model");
const { isAdmin } = require("../../config/permissions");
const { logActivity } = require("../../utils/auditLogger");

const staffController = {
  getAll: async (req, res) => {
    try {
      const staff = await StaffModel.getAll(req.user);
      res.status(200).json({ success: true, count: staff.length, data: staff });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch staff", error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const staff = await StaffModel.getById(req.params.id, req.user);
      if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
      res.status(200).json({ success: true, data: staff });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch staff", error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const result = await StaffModel.create(req.body, req.user);
      await logActivity({ req, action: "staff.create", entityType: "staff_details", entityId: result.insertId, after: req.body });
      res.status(201).json({ success: true, message: "Staff created successfully", staffId: result.insertId });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const before = await StaffModel.getById(req.params.id, req.user);
      await StaffModel.update(req.params.id, req.body, req.user);
      const after = await StaffModel.getById(req.params.id, req.user);
      await logActivity({ req, action: "staff.update", entityType: "staff_details", entityId: req.params.id, before, after });
      res.status(200).json({ success: true, message: "Staff updated successfully" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, message: "Only admin can delete staff" });
      }
      const before = await StaffModel.getById(req.params.id, req.user);
      await StaffModel.delete(req.params.id, req.user);
      await logActivity({ req, action: "staff.delete", entityType: "staff_details", entityId: req.params.id, before });
      res.status(200).json({ success: true, message: "Staff deleted successfully" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  changeStatus: async (req, res) => {
    try {
      const { status } = req.body;
      await StaffModel.changeStatus(req.params.id, status, req.user);
      await logActivity({ req, action: "staff.status", entityType: "staff_details", entityId: req.params.id, after: { status } });
      res.status(200).json({ success: true, message: `Staff status changed to ${status}` });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  search: async (req, res) => {
    try {
      const result = await StaffModel.search(req.query.keyword || "", req.user);
      res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: "Search failed", error: error.message });
    }
  },

  listTeams: async (req, res) => {
    try {
      const teams = await StaffModel.listTeams(req.user);
      res.status(200).json({ success: true, data: teams });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch teams", error: error.message });
    }
  },

  createTeam: async (req, res) => {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, message: "Only admin can create main teams" });
      }
      const result = await StaffModel.createTeam(req.body);
      await logActivity({ req, action: "team.create", entityType: "teams", entityId: result.insertId, after: req.body });
      res.status(201).json({ success: true, message: "Team created successfully", teamId: result.insertId });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};

module.exports = staffController;
