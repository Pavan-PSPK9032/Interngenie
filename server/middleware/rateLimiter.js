const rateLimiter = ({ windowMs = 60000, max = 100 } = {}) => {
  const store = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 60000);

  if (cleanup.unref) {
    cleanup.unref();
  }

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      store.set(key, entry);
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      return res.status(429).json({ error: "Too many requests" });
    }

    next();
  };
};

module.exports = rateLimiter;
