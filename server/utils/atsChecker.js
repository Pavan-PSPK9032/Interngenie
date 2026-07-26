const { SKILL_TAXONOMY, ALL_SKILLS } = require("./aiEngine");

const GENERAL_TECH_KEYWORDS = [
  "software", "developer", "engineer", "programming", "algorithm", "debug",
  "test", "deploy", "api", "database", "server", "client", "agile", "scrum",
  "git", "version", "code", "review", "performance", "optimization",
  "responsive", "mobile", "web", "cloud", "security", "automation",
  "data", "analytics", "report", "dashboard", "integration", "migration",
];

const ACTION_VERBS = [
  "developed", "implemented", "designed", "built", "created", "launched",
  "managed", "led", "optimized", "improved", "reduced", "increased",
  "automated", "streamlined", "architected", "integrated", "deployed",
  "configured", "maintained", "collaborated", "mentored", "coordinated",
  "delivered", "executed", "initiated", "established", "produced",
  "generated", "resolved", "identified", "analyzed", "evaluated",
  "contributed", "demonstrated", "facilitated", "spearheaded", "orchestrated",
];

const ACHIEVEMENT_KEYWORDS = [
  "award", "awarded", "winner", "winning", "first place", "scholarship",
  "certified", "certification", "certifications", "publication", "published",
  "patent", "dean", "honor", "honors", "distinction", "summa", "magna",
  "leadership", "president", "captain", "founder", "co-founder", "chief",
  "head", "director", "lead", "chair", "organizer", "volunteer",
];

const IMPROVEMENT_TEMPLATES = {
  keywords: "Add more relevant keywords from the target job description to improve ATS matching.",
  formatting: "Clean up formatting by avoiding ALL CAPS, special characters, and excessive punctuation.",
  grammar: "Use action verbs at the start of bullet points and maintain consistent past tense throughout.",
  experience: "Quantify achievements with numbers, percentages, or dollar amounts.",
  skills: "Include a broader range of technical skills organized by category.",
  achievements: "Highlight certifications, awards, publications, and leadership roles.",
  structure: "Ensure your resume has clear section headers and includes contact info, summary, and education.",
};

function gradeFromScore(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function detectSections(text) {
  const sectionPatterns = [
    { name: "education", re: /(?:^|\n)\s*(?:education|academic\s+background|qualification)/i },
    { name: "experience", re: /(?:^|\n)\s*(?:experience|work\s+experience|employment|internship|professional\s+experience)/i },
    { name: "skills", re: /(?:^|\n)\s*(?:skills|technical\s+skills|competencies|technologies)/i },
    { name: "projects", re: /(?:^|\n)\s*(?:projects|personal\s+projects|key\s+projects)/i },
    { name: "certifications", re: /(?:^|\n)\s*(?:certifications?|licenses?|credentials?)/i },
    { name: "awards", re: /(?:^|\n)\s*(?:awards?|honors?|achievements?|recognition)/i },
    { name: "summary", re: /(?:^|\n)\s*(?:summary|objective|profile|about|professional\s+summary)/i },
  ];
  const found = [];
  for (const s of sectionPatterns) {
    if (s.re.test(text)) found.push(s.name);
  }
  return found;
}

function checkKeywords(resumeText, targetInternship) {
  let score = 0;
  const max = 25;
  const details = [];
  const missingKeywords = [];
  const lower = resumeText.toLowerCase();

  if (targetInternship && targetInternship.skills && targetInternship.skills.length > 0) {
    const targetSkills = targetInternship.skills;
    const found = [];
    for (const skill of targetSkills) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(resumeText)) {
        found.push(skill);
      } else {
        missingKeywords.push(skill);
      }
    }
    const ratio = found.length / targetSkills.length;
    score = Math.round(ratio * max);
    if (found.length > 0) details.push(`Matched ${found.length}/${targetSkills.length} target skills: ${found.slice(0, 5).join(", ")}`);
    if (missingKeywords.length > 0) details.push(`Missing ${missingKeywords.length} target skills: ${missingKeywords.slice(0, 5).join(", ")}`);
  } else {
    let matchCount = 0;
    for (const kw of GENERAL_TECH_KEYWORDS) {
      const re = new RegExp(`\\b${kw}\\b`, "i");
      if (re.test(lower)) matchCount++;
    }
    score = Math.round((matchCount / GENERAL_TECH_KEYWORDS.length) * max);
    details.push(`Found ${matchCount}/${GENERAL_TECH_KEYWORDS.length} general tech keywords`);
    for (const kw of GENERAL_TECH_KEYWORDS) {
      const re = new RegExp(`\\b${kw}\\b`, "i");
      if (!re.test(lower)) missingKeywords.push(kw);
    }
  }

  return { score: Math.min(score, max), max, details: details.join("; ") || "No keywords analyzed", missingKeywords };
}

function checkFormatting(resumeText) {
  let score = 15;
  const max = 15;
  const details = [];
  const issues = [];

  const allCapsWords = resumeText.match(/\b[A-Z]{3,}\b/g) || [];
  const uniqueAllCaps = [...new Set(allCapsWords)];
  if (uniqueAllCaps.length > 3) {
    score -= 5;
    issues.push(`${uniqueAllCaps.length} ALL CAPS words detected`);
  }

  const specialChars = resumeText.match(/[^\w\s\n\r.,;:()\-/+@&%$#@!*"'`=<>[\]{}|\\\/~`^]/g) || [];
  if (specialChars.length > 10) {
    score -= 3;
    issues.push(`${specialChars.length} unusual special characters`);
  }

  const excessivePunct = resumeText.match(/[!?]{2,}/g) || [];
  if (excessivePunct.length > 0) {
    score -= 2;
    issues.push(`Excessive punctuation (${excessivePunct.length} instances)`);
  }

  const sections = detectSections(resumeText);
  const coreSections = ["education", "experience", "skills"];
  const presentCore = coreSections.filter((s) => sections.includes(s));
  if (presentCore.length >= 3) {
    score += 0;
    details.push(`Core sections found: ${presentCore.join(", ")}`);
  } else if (presentCore.length >= 2) {
    details.push(`Found ${presentCore.length}/3 core sections: ${presentCore.join(", ")}`);
  } else {
    score -= 3;
    issues.push(`Only ${presentCore.length}/3 core sections found`);
  }

  if (sections.length >= 4) {
    details.push(`${sections.length} total sections detected`);
  } else if (sections.length < 2) {
    score -= 2;
    issues.push("Very few sections detected, resume may lack structure");
  }

  score = Math.max(0, Math.min(score, max));

  return {
    score,
    max,
    details: details.join("; ") + (issues.length > 0 ? " | Issues: " + issues.join("; ") : ""),
  };
}

function checkGrammar(resumeText) {
  let score = 10;
  const max = 10;
  const issues = [];

  const firstPersonPatterns = /\b(I am|I have|I was|I will|I can|I did|I do|I feel|I think|I believe|I want|I need)\b/gi;
  const firstPersonMatches = resumeText.match(firstPersonPatterns) || [];
  if (firstPersonMatches.length > 2) {
    score -= 3;
    issues.push(`${firstPersonMatches.length} first-person phrases detected (use action verbs instead)`);
  }

  const lines = resumeText.split("\n").filter((l) => l.trim().length > 0);
  const bulletLines = lines.filter((l) => /^\s*[-•*]\s/.test(l));
  if (bulletLines.length > 0) {
    const startsWithVerb = bulletLines.filter((l) => {
      const word = l.replace(/^\s*[-•*]\s+/, "").trim().split(/\s/)[0];
      return ACTION_VERBS.some((v) => word.toLowerCase().startsWith(v.toLowerCase().slice(0, 4)));
    });
    const verbRatio = startsWithVerb.length / bulletLines.length;
    if (verbRatio < 0.3 && bulletLines.length >= 3) {
      score -= 3;
      issues.push(`Only ${Math.round(verbRatio * 100)}% of bullet points start with action verbs`);
    } else if (verbRatio >= 0.5) {
      details.push(`Good action verb usage: ${Math.round(verbRatio * 100)}% of bullets start with action verbs`);
    }
  }

  const tenseShifts = [];
  const pastIndicators = /\b(?:developed|created|built|managed|led|designed|implemented|launched|delivered|established)\b/gi;
  const presentIndicators = /\b(?:develop|create|build|manage|lead|design|implement|launch|deliver|establish)\b/gi;
  const pastMatches = resumeText.match(pastIndicators) || [];
  const presentMatches = resumeText.match(presentIndicators) || [];
  if (pastMatches.length > 0 && presentMatches.length > 0) {
    tenseShifts.push("mixed tenses detected");
  }
  if (tenseShifts.length > 0) {
    score -= 2;
    issues.push(tenseShifts.join("; "));
  }

  score = Math.max(0, Math.min(score, max));

  return {
    score,
    max,
    details: issues.length > 0 ? issues.join("; ") : "Grammar appears clean",
  };
}

function checkExperience(resumeText) {
  let score = 0;
  const max = 15;
  const details = [];

  const quantifiedPatterns = [
    /\d+%/g,
    /\$\s?\d[\d,]*/g,
    /\b\d{1,3}(?:,\d{3})+\b/g,
    /\b\d+x\b/gi,
    /\bincreased\s.*?by\s?\d+/gi,
    /\breduced\s.*?by\s?\d+/gi,
    /\bmanaged\s.*?\d+/gi,
    /\bled\s.*?\d+/gi,
    /\b\d+\+?\s?(?:users|customers|clients|projects|team\s?members|repositories)/gi,
  ];
  let quantCount = 0;
  for (const p of quantifiedPatterns) {
    const m = resumeText.match(p) || [];
    quantCount += m.length;
  }
  if (quantCount >= 5) {
    score += 8;
    details.push(`${quantCount} quantified achievements found`);
  } else if (quantCount >= 2) {
    score += 5;
    details.push(`${quantCount} quantified achievements found (aim for 5+)`);
  } else {
    score += 2;
    details.push(`Only ${quantCount} quantified achievements (aim for 5+)`);
  }

  const lines = resumeText.split("\n").filter((l) => l.trim().length > 0);
  const bulletLines = lines.filter((l) => /^\s*[-•*]\s/.test(l));
  let verbBulletCount = 0;
  for (const line of bulletLines) {
    const firstWord = line.replace(/^\s*[-•*]\s+/, "").trim().split(/\s/)[0].toLowerCase();
    if (ACTION_VERBS.some((v) => firstWord.startsWith(v.slice(0, 4)))) {
      verbBulletCount++;
    }
  }
  if (verbBulletCount >= 5) {
    score += 5;
    details.push(`${verbBulletCount} bullet points start with strong action verbs`);
  } else if (verbBulletCount >= 2) {
    score += 3;
    details.push(`${verbBulletCount} bullet points start with action verbs (aim for 5+)`);
  } else {
    score += 1;
    details.push("Very few action verb bullet points detected");
  }

  const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / (lines.length || 1);
  if (avgLineLength > 30 && avgLineLength < 150) {
    score += 2;
    details.push("Good average description length");
  } else {
    score += 1;
    details.push("Consider adjusting description lengths (30-150 chars per line is ideal)");
  }

  score = Math.min(score, max);

  return { score, max, details: details.join("; ") || "No experience data analyzed" };
}

function checkSkills(resumeText) {
  let score = 0;
  const max = 15;
  const details = [];
  const suggestedSkills = [];
  const foundSkills = [];

  for (const [category, skills] of Object.entries(SKILL_TAXONOMY)) {
    const catFound = [];
    for (const skill of skills) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(resumeText)) {
        catFound.push(skill);
      }
    }
    if (catFound.length > 0) {
      foundSkills.push(...catFound);
    }
  }

  const uniqueFound = [...new Set(foundSkills)];
  if (uniqueFound.length >= 8) {
    score += 6;
    details.push(`${uniqueFound.length} unique skills detected: ${uniqueFound.slice(0, 6).join(", ")}${uniqueFound.length > 6 ? "..." : ""}`);
  } else if (uniqueFound.length >= 4) {
    score += 4;
    details.push(`${uniqueFound.length} skills detected: ${uniqueFound.join(", ")}`);
  } else {
    score += 2;
    details.push(`Only ${uniqueFound.length} skills detected, add more technical skills`);
  }

  const categoriesFound = new Set();
  for (const [category, skills] of Object.entries(SKILL_TAXONOMY)) {
    for (const skill of skills) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(resumeText)) {
        categoriesFound.add(category);
        break;
      }
    }
  }
  const breadthRatio = categoriesFound.size / Object.keys(SKILL_TAXONOMY).length;
  if (breadthRatio >= 0.3) {
    score += 5;
    details.push(`Skills span ${categoriesFound.size} categories: ${[...categoriesFound].join(", ")}`);
  } else if (breadthRatio >= 0.15) {
    score += 3;
    details.push(`Skills span ${categoriesFound.size} categories (aim for 3+ categories)`);
  } else {
    score += 1;
    details.push("Skills are narrow in scope, consider adding diverse skill categories");
  }

  const hotSkills = ["React", "Node.js", "Python", "TypeScript", "AWS", "Docker", "Machine Learning", "TypeScript", "Next.js", "Kubernetes"];
  const foundHot = hotSkills.filter((s) => {
    const re = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(resumeText);
  });
  const missingHot = hotSkills.filter((s) => {
    const re = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return !re.test(resumeText);
  });
  if (foundHot.length >= 4) {
    score += 4;
    details.push(`${foundHot.length} in-demand skills present: ${foundHot.join(", ")}`);
  } else if (foundHot.length >= 2) {
    score += 2;
    details.push(`${foundHot.length} in-demand skills present`);
  } else {
    score += 1;
    details.push("Few in-demand skills detected");
  }
  if (missingHot.length > 0) {
    suggestedSkills.push(...missingHot.slice(0, 5));
  }

  score = Math.min(score, max);

  return { score, max, details: details.join("; ") || "No skills analyzed", suggestedSkills };
}

function checkAchievements(resumeText) {
  let score = 0;
  const max = 10;
  const details = [];
  const lower = resumeText.toLowerCase();

  let achievementCount = 0;
  for (const kw of ACHIEVEMENT_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, "i");
    if (re.test(lower)) achievementCount++;
  }

  if (achievementCount >= 5) {
    score += 6;
    details.push(`${achievementCount} achievement-related keywords found`);
  } else if (achievementCount >= 3) {
    score += 4;
    details.push(`${achievementCount} achievement-related keywords found`);
  } else {
    score += 1;
    details.push(`Only ${achievementCount} achievement keywords found, add more certifications, awards, or leadership roles`);
  }

  const certPatterns = /(?:certified|certification|certificate)\s+(?:in\s+)?(\w[\w\s]{2,30})/gi;
  const certMatches = resumeText.match(certPatterns) || [];
  if (certMatches.length >= 2) {
    score += 4;
    details.push(`${certMatches.length} certifications mentioned`);
  } else if (certMatches.length === 1) {
    score += 2;
    details.push("1 certification mentioned, consider adding more");
  } else {
    score += 0;
    details.push("No certifications detected");
  }

  score = Math.min(score, max);

  return { score, max, details: details.join("; ") || "No achievements analyzed" };
}

function checkStructure(resumeText) {
  let score = 0;
  const max = 10;
  const details = [];
  const improvements = [];

  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRe = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/;
  const hasEmail = emailRe.test(resumeText);
  const hasPhone = phoneRe.test(resumeText);
  const hasLinkedin = /linkedin\.com/i.test(resumeText);
  const hasGithub = /github\.com/i.test(resumeText);
  const contactCount = [hasEmail, hasPhone, hasLinkedin, hasGithub].filter(Boolean).length;

  if (contactCount >= 3) {
    score += 3;
    details.push(`Strong contact info: ${["email", "phone", "LinkedIn", "GitHub"].filter((_, i) => [hasEmail, hasPhone, hasLinkedin, hasGithub][i]).join(", ")}`);
  } else if (contactCount >= 1) {
    score += 1;
    const missing = [];
    if (!hasEmail) missing.push("email");
    if (!hasPhone) missing.push("phone");
    if (!hasLinkedin) missing.push("LinkedIn");
    if (!hasGithub) missing.push("GitHub");
    improvements.push(`Add missing contact info: ${missing.join(", ")}`);
  } else {
    improvements.push("No contact information detected (email, phone, LinkedIn, GitHub)");
  }

  const sections = detectSections(resumeText);
  const summaryPresent = sections.includes("summary");
  if (summaryPresent) {
    score += 2;
    details.push("Summary/objective section found");
  } else {
    improvements.push("Add a professional summary or objective section");
  }

  const coreSections = ["education", "experience", "skills"];
  const presentCore = coreSections.filter((s) => sections.includes(s));
  if (presentCore.length === 3) {
    score += 3;
    details.push("All core sections present: Education, Experience, Skills");
  } else if (presentCore.length === 2) {
    score += 2;
    const missing = coreSections.filter((s) => !sections.includes(s));
    improvements.push(`Missing core section: ${missing.join(", ")}`);
  } else {
    score += 1;
    const missing = coreSections.filter((s) => !sections.includes(s));
    improvements.push(`Missing core sections: ${missing.join(", ")}`);
  }

  const wordCount = resumeText.split(/\s+/).length;
  const lineCount = resumeText.split("\n").filter((l) => l.trim().length > 0).length;
  if (wordCount >= 200 && wordCount <= 1500) {
    score += 2;
    details.push(`Good length: ~${wordCount} words (${lineCount} lines)`);
  } else if (wordCount < 200) {
    score += 0;
    improvements.push(`Resume is too short (~${wordCount} words), aim for 400-800 words`);
  } else {
    score += 1;
    improvements.push(`Resume is long (~${wordCount} words), aim for 400-800 words`);
  }

  score = Math.min(score, max);

  return { score, max, details: details.join("; ") || "Structure analyzed", improvements };
}

function generateImprovements(keywordResult, formattingResult, grammarResult, experienceResult, skillsResult, achievementResult, structureResult) {
  const improvements = [];

  if (keywordResult.score < keywordResult.max * 0.7) improvements.push(IMPROVEMENT_TEMPLATES.keywords);
  if (formattingResult.score < formattingResult.max * 0.8) improvements.push(IMPROVEMENT_TEMPLATES.formatting);
  if (grammarResult.score < grammarResult.max * 0.7) improvements.push(IMPROVEMENT_TEMPLATES.grammar);
  if (experienceResult.score < experienceResult.max * 0.7) improvements.push(IMPROVEMENT_TEMPLATES.experience);
  if (skillsResult.score < skillsResult.max * 0.7) improvements.push(IMPROVEMENT_TEMPLATES.skills);
  if (achievementResult.score < achievementResult.max * 0.7) improvements.push(IMPROVEMENT_TEMPLATES.achievements);
  if (structureResult.score < structureResult.max * 0.7) improvements.push(IMPROVEMENT_TEMPLATES.structure);

  if (structureResult.improvements) improvements.push(...structureResult.improvements);

  return [...new Set(improvements)];
}

function generateBulletPointSuggestions(resumeText) {
  const suggestions = [];
  const lines = resumeText.split("\n").filter((l) => l.trim().length > 0);
  const weakBullets = lines.filter((l) => {
    if (!/^\s*[-•*]\s/.test(l)) return false;
    const firstWord = l.replace(/^\s*[-•*]\s+/, "").trim().split(/\s/)[0].toLowerCase();
    return ["responsible", "duties", "tasks", "helped", "assisted", "worked", "used", "familiar"].includes(firstWord);
  });

  if (weakBullets.length > 0) {
    suggestions.push("Replace weak bullet starters ('responsible for', 'helped', 'assisted') with action verbs like 'Developed', 'Implemented', 'Led'");
  }

  const hasQuantified = /\d+%|\$\d|\d+x|\d{1,3},\d{3}/.test(resumeText);
  if (!hasQuantified) {
    suggestions.push("Add quantified results to bullet points (e.g., 'Improved load time by 40%', 'Managed team of 5 engineers')");
  }

  const shortBullets = lines.filter((l) => /^\s*[-•*]\s/.test(l) && l.trim().length < 25);
  if (shortBullets.length > 2) {
    suggestions.push("Some bullet points are too short, expand them with context, action, and result");
  }

  return suggestions;
}

function generateSummarySuggestion(targetInternship, skills) {
  const topSkills = skills.slice(0, 5).join(", ");
  if (targetInternship) {
    return `Motivated ${targetInternship.domain || "technology"} enthusiast with hands-on experience in ${topSkills || "software development"}. Seeking to leverage technical skills and problem-solving abilities as a ${targetInternship.title || "Software Engineering Intern"} to contribute to impactful projects.`;
  }
  return `Detail-oriented ${topSkills ? `${topSkills.split(", ")[0]} developer` : "software development enthusiast"} with experience building projects using modern technologies. Eager to apply strong analytical and technical skills in a collaborative team environment.`;
}

function checkATS(resumeText, targetInternship) {
  if (!resumeText || resumeText.trim().length < 20) {
    return {
      score: 0,
      grade: "F",
      breakdown: {
        keywords: { score: 0, max: 25, details: "Resume text too short" },
        formatting: { score: 0, max: 15, details: "Resume text too short" },
        grammar: { score: 0, max: 10, details: "Resume text too short" },
        experience: { score: 0, max: 15, details: "Resume text too short" },
        skills: { score: 0, max: 15, details: "Resume text too short" },
        achievements: { score: 0, max: 10, details: "Resume text too short" },
        structure: { score: 0, max: 10, details: "Resume text too short" },
      },
      missingKeywords: [],
      suggestedSkills: [],
      improvements: ["Resume text is too short. Please provide a complete resume."],
      bulletPointSuggestions: [],
      summarySuggestion: "",
    };
  }

  const keywordResult = checkKeywords(resumeText, targetInternship);
  const formattingResult = checkFormatting(resumeText);
  const grammarResult = checkGrammar(resumeText);
  const experienceResult = checkExperience(resumeText);
  const skillsResult = checkSkills(resumeText);
  const achievementResult = checkAchievements(resumeText);
  const structureResult = checkStructure(resumeText);

  const totalScore = keywordResult.score + formattingResult.score + grammarResult.score +
    experienceResult.score + skillsResult.score + achievementResult.score + structureResult.score;

  const improvements = generateImprovements(keywordResult, formattingResult, grammarResult, experienceResult, skillsResult, achievementResult, structureResult);
  const bulletPointSuggestions = generateBulletPointSuggestions(resumeText);

  const allSkills = [];
  for (const [, catSkills] of Object.entries(SKILL_TAXONOMY)) {
    for (const skill of catSkills) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(resumeText)) allSkills.push(skill);
    }
  }
  const summarySuggestion = generateSummarySuggestion(targetInternship, [...new Set(allSkills)]);

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    grade: gradeFromScore(totalScore),
    breakdown: {
      keywords: keywordResult,
      formatting: formattingResult,
      grammar: grammarResult,
      experience: experienceResult,
      skills: skillsResult,
      achievements: achievementResult,
      structure: structureResult,
    },
    missingKeywords: keywordResult.missingKeywords || [],
    suggestedSkills: skillsResult.suggestedSkills || [],
    improvements,
    bulletPointSuggestions,
    summarySuggestion,
  };
}

module.exports = { checkATS };
