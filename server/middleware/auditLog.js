const AuditLog = require("../models/AuditLog");

const auditLog = (action, resource) => {
  return (req, res, next) => {
    res.on("finish", () => {
      try {
        const resourceId =
          req.params.id ||
          req.body?.id ||
          req.body?._id ||
          (req.body && req.body.internshipId) ||
          (req.body && req.body.companyId) ||
          "";
        AuditLog.create({
          userId: req.user ? String(req.user.id || req.user._id || "anonymous") : "anonymous",
          action,
          resource,
          resourceId: String(resourceId),
          ip: req.ip || "",
          userAgent: req.get("user-agent") || "",
        }).catch(() => {});
      } catch (_) {}
    });
    next();
  };
};

module.exports = auditLog;
