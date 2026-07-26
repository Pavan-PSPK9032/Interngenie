const AuditLog = require("../models/AuditLog");

const auditLog = (action, resource) => {
  return (req, res, next) => {
    res.on("finish", () => {
      try {
        AuditLog.create({
          userId: req.user ? req.user._id.toString() : "anonymous",
          action,
          resource,
          resourceId: req.params.id || "",
          ip: req.ip || "",
          userAgent: req.get("user-agent") || "",
        }).catch(() => {});
      } catch (_) {}
    });
    next();
  };
};

module.exports = auditLog;
