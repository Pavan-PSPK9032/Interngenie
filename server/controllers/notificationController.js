const Notification = require("../models/Notification");

exports.getAll = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
    return res.json({
      notifications: notifications.map((n) => ({
        id: n._id.toString(), userId: n.userId, title: n.title,
        message: n.message, type: n.type, read: n.read,
        createdAt: new Date(n.createdAt).toISOString(),
      })),
    });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    // SECURITY: only the owner of a notification may mark it as read.
    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Notification not found" });
    return res.json({ notification: updated });
  } catch (err) { next(err); }
};
