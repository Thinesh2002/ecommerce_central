const bcrypt = require("bcrypt");
const User = require("../../models/user_model");
const generateToken = require("../../utils/generateToken");
const { ROLE, isAdmin, isTeamLeader } = require("../../config/permissions");
const { logActivity } = require("../../utils/auditLogger");

const SALT_ROUNDS = 10;

const safeUser = (user) => {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  return copy;
};

function sanitizeCreatePayload(body, viewer) {
  const role = body.role || ROLE.USER;
  const payload = {
    name: body.name,
    user_id: body.user_id,
    email: body.email,
    password: body.password,
    role,
    team_id: body.team_id || null,
    staff_id: body.staff_id || null,
    status: body.status || "Active",
  };

  if (isTeamLeader(viewer)) {
    payload.role = ROLE.USER;
    payload.team_id = viewer.team_id || null;
  }

  if (!isAdmin(viewer) && !isTeamLeader(viewer)) {
    throw new Error("You do not have permission to create users");
  }

  if (!isAdmin(viewer) && payload.role !== ROLE.USER) {
    throw new Error("Team leaders can create normal users only");
  }

  return payload;
}

exports.register = async (req, res) => {
  try {
    const payload = sanitizeCreatePayload(req.body, req.user);
    const { name, user_id, email, password, role, team_id, staff_id, status } = payload;

    if (!password) return res.status(400).json({ success: false, message: "Password is required" });
    if (!email && !user_id) return res.status(400).json({ success: false, message: "Provide email or user_id" });

    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) return res.status(400).json({ success: false, message: "Email already in use" });
    }
    if (user_id) {
      const existingUserId = await User.findByUserId(user_id);
      if (existingUserId) return res.status(400).json({ success: false, message: "User ID already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const insertId = await User.createUser({
      name,
      user_id,
      email,
      hashedPassword,
      role,
      team_id,
      staff_id,
      status,
      created_by: req.user?.id || null,
    });

    const newUser = safeUser(await User.findById(insertId));
    await logActivity({ req, action: "user.create", entityType: "users", entityId: insertId, after: newUser });

    res.status(201).json({
      success: true,
      message: "User registered",
      user: newUser,
    });
  } catch (err) {
    console.error("register error", err);
    res.status(400).json({ success: false, message: err.message || "Server error" });
  }
};

exports.publicRegister = async (req, res) => {
  try {
    const { name, user_id, email, password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });
    if (!email && !user_id) return res.status(400).json({ success: false, message: "Provide email or user_id" });

    if (email && (await User.findByEmail(email))) return res.status(400).json({ success: false, message: "Email already in use" });
    if (user_id && (await User.findByUserId(user_id))) return res.status(400).json({ success: false, message: "User ID already in use" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const insertId = await User.createUser({ name, user_id, email, hashedPassword, role: ROLE.USER });
    const newUser = await User.findById(insertId);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "User registered",
      user: safeUser(newUser),
      token,
    });
  } catch (err) {
    console.error("publicRegister error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ success: false, message: "Login and password required" });
    }

    const user = await User.findByLogin(login);
    if (!user) return res.status(400).json({ success: false, message: "Invalid login or password" });

    if (String(user.status || "Active").toLowerCase() === "inactive") {
      return res.status(403).json({ success: false, message: "This user account is inactive" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: "Invalid login or password" });

    await User.updateLastLogin(user.id);
    const latestUser = await User.findById(user.id);
    const token = generateToken(latestUser);

    res.json({
      success: true,
      message: "Login successful",
      user: safeUser(latestUser),
      token,
    });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error("me handler error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!User.belongsToViewerScope(user, req.user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error("getUser error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await User.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "User not found" });
    if (!User.belongsToViewerScope(existing, req.user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { name, user_id, email, password, role, team_id, staff_id, status } = req.body;

    if (email) {
      const found = await User.findByEmail(email);
      if (found && Number(found.id) !== Number(id)) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }
    if (user_id) {
      const found = await User.findByUserId(user_id);
      if (found && Number(found.id) !== Number(id)) {
        return res.status(400).json({ success: false, message: "User ID already in use" });
      }
    }

    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (user_id !== undefined) updateObj.user_id = user_id;
    if (email !== undefined) updateObj.email = email;

    if (isAdmin(req.user)) {
      if (role !== undefined) updateObj.role = role;
      if (team_id !== undefined) updateObj.team_id = team_id || null;
      if (staff_id !== undefined) updateObj.staff_id = staff_id || null;
      if (status !== undefined) updateObj.status = status;
    } else if (isTeamLeader(req.user)) {
      // Leader can update people inside their team, but cannot promote/delete users or move them to another team.
      updateObj.team_id = req.user.team_id || null;
      if (Number(existing.id) !== Number(req.user.id)) updateObj.role = ROLE.USER;
      if (status !== undefined) updateObj.status = status;
    } else if (Number(existing.id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: "Users can update only their own profile" });
    }

    if (password !== undefined && password !== "") {
      updateObj.hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const affected = await User.updateUserById(id, updateObj);
    if (affected === 0) return res.status(400).json({ success: false, message: "No fields updated" });

    const updated = safeUser(await User.findById(id));
    await logActivity({ req, action: "user.update", entityType: "users", entityId: id, before: safeUser(existing), after: updated });

    res.json({ success: true, message: "User updated", user: updated });
  } catch (err) {
    console.error("update user error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: "Only admin can delete users" });
    }

    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "User not found" });

    const affected = await User.softDeleteUserById(req.params.id);
    if (affected === 0) return res.status(404).json({ success: false, message: "User not found" });

    await logActivity({ req, action: "user.deactivate", entityType: "users", entityId: req.params.id, before: safeUser(existing) });
    res.json({ success: true, message: "User deactivated" });
  } catch (err) {
    console.error("delete user error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.getUsersForViewer(req.user);
    return res.json({ success: true, users, data: users });
  } catch (err) {
    console.error("listUsers error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.stats = async (req, res) => {
  try {
    const total = await User.getUserCountForViewer(req.user);
    const recent = await User.getRecentUsersForViewer(req.user, 5);
    return res.json({ success: true, total, recent });
  } catch (err) {
    console.error("stats error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
