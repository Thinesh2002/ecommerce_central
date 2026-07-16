const jwt = require("jsonwebtoken");
const User = require("../models/user_model");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token" });
    }

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (String(user.status || "Active").toLowerCase() === "inactive") {
      return res.status(403).json({ success: false, message: "User account is inactive" });
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      name: user.name,
      user_id: user.user_id,
      email: user.email,
      role: user.role || "user",
      team_id: user.team_id || null,
      staff_id: user.staff_id || null,
      status: user.status || "Active",
    };

    next();
  } catch (err) {
    console.error("authMiddleware error", err.message || err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
