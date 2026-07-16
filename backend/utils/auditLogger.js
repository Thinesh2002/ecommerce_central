const db = require("../config/db");

async function logActivity({ req, action, entityType, entityId = null, before = null, after = null, meta = null }) {
  try {
    await db.query(
      `INSERT INTO activity_logs
        (user_id, action, entity_type, entity_id, before_json, after_json, ip_address, user_agent, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        req?.user?.id || req?.userId || null,
        action,
        entityType,
        entityId,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        req?.ip || null,
        req?.headers?.["user-agent"] || null,
        meta ? JSON.stringify(meta) : null,
      ]
    );
  } catch (error) {
    // Logging must never break business flow. Usually this means migration is not applied yet.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[AUDIT_LOG_SKIPPED]", error.message);
    }
  }
}

module.exports = { logActivity };
