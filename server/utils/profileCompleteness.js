function computeProfileCompleteness(user, certCount = 0) {
  const checks = [];
  let score = 0;

  const add = (condition, label, weight) => {
    if (condition) {
      score += weight;
    } else {
      checks.push({ label, missing: true });
    }
  };

  add(!!user.name, "Add your name", 5);
  add(!!user.avatarUrl, "Upload a profile picture", 15);
  add(!!user.phone, "Add phone number", 5);
  add(!!user.college, "Add your college", 10);
  add(!!user.degree, "Add your degree", 5);
  add((user.skills || []).length >= 3, "Add at least 3 skills", 15);
  add(!!user.linkedin, "Add LinkedIn profile", 10);
  add(!!user.portfolio, "Add portfolio link", 5);
  add(!!user.github, "Add GitHub profile", 5);
  add((user.projects || []).length > 0, "Add projects", 10);
  add((user.experience || []).length > 0, "Add work experience", 10);
  add(
    (user.certifications || []).length > 0 || (user.courses || []).length > 0,
    "Add certifications",
    5
  );
  add(!!user.resumeText || !!user.resumeData, "Upload or build a resume", 10);
  add(!!user.careerObjective, "Add a career objective", 5);
  add((user.interests || []).length > 0, "Add interests", 5);

  score = Math.min(100, score);

  if (certCount > 0 && !checks.some((c) => c.label === "Add certifications")) {
    checks.push({ label: "Certificates uploaded", done: true });
  }

  return {
    score,
    suggestions: checks,
    stats: {
      skills: (user.skills || []).length,
      projects: (user.projects || []).length,
      experience: (user.experience || []).length,
      certificates: certCount,
      certifications: (user.certifications || []).length,
    },
  };
}

module.exports = { computeProfileCompleteness };
