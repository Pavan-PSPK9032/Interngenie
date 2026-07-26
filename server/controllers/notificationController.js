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
    const updated = await Notification.findByIdAndUpdate(id, { read: true }, { new: true }).lean();
    return res.json({ notification: updated });
  } catch (err) { next(err); }
};
