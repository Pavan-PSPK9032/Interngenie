const User = require("../models/User");

function slugifyName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^\d+/, "")
    .slice(0, 20);
}

async function generateUniqueUsername(name, excludeId, preferred) {
  const base = slugifyName(preferred || name) || "user";
  const exists = await User.exists({
    username: base,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (!exists) return base;

  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  const candidate = `${base}${suffix}`;
  const candidateExists = await User.exists({
    username: candidate,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (!candidateExists) return candidate;

  for (let i = 0; i < 10; i++) {
    const fallback = `${base}${suffix}${i}`;
    const taken = await User.exists({
      username: fallback,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!taken) return fallback;
  }
  return `${base}${suffix}${Date.now().toString().slice(-3)}`;
}

async function isUsernameAvailable(username, excludeId) {
  const exists = await User.exists({
    username,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  return !exists;
}

module.exports = { slugifyName, generateUniqueUsername, isUsernameAvailable };
