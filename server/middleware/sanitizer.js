const LENGTH_LIMITS = {
  name: 100,
  email: 254,
  description: 10000,
  password: 128,
  title: 200,
};

function stripHtml(value) {
  if (typeof value !== "string") return value;
  return value.replace(/<[^>]*>/g, "").trim();
}

function sanitizeObject(obj, parentKey) {
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, parentKey));
  }

  if (obj !== null && typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        let cleaned = stripHtml(value);
        cleaned = cleaned.trim();
        const limit = LENGTH_LIMITS[key];
        if (limit && cleaned.length > limit) {
          cleaned = cleaned.slice(0, limit);
        }
        result[key] = cleaned;
      } else if (typeof value === "object" && value !== null) {
        result[key] = sanitizeObject(value, key);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

const sanitizer = () => {
  return (req, res, next) => {
    if (["POST", "PATCH", "PUT"].includes(req.method) && req.body) {
      req.body = sanitizeObject(req.body, "");
    }
    next();
  };
};

module.exports = sanitizer;
