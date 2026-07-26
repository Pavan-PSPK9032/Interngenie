const { SKILL_TAXONOMY } = require("./aiEngine");

const SECTION_PATTERNS = {
  education: /(?:^|\n)\s*(?:education|academic\s+background|qualification|edu(?:cation)?)\s*[:\-#]/i,
  experience: /(?:^|\n)\s*(?:experience|work\s+experience|employment|internship|professional\s+experience|work\s+history)\s*[:\-#]/i,
  skills: /(?:^|\n)\s*(?:skills|technical\s+skills|competencies|technologies|tech\s+stack)\s*[:\-#]/i,
  projects: /(?:^|\n)\s*(?:projects?|personal\s+projects?|key\s+projects?|portfolio)\s*[:\-#]/i,
  certifications: /(?:^|\n)\s*(?:certifications?|licenses?|credentials?|certified)\s*[:\-#]/i,
  achievements: /(?:^|\n)\s*(?:awards?|honors?|achievements?|recognition|extracurricular)\s*[:\-#]/i,
  summary: /(?:^|\n)\s*(?:summary|objective|profile|about|professional\s+summary|career\s+objective|career\s+summary)\s*[:\-#]/i,
  languages: /(?:^|\n)\s*(?:languages?|linguistic)\s*[:\-#]/i,
};

const DEGREE_PATTERNS = [
  { degree: "B.Tech", re: /b\.?\s?tech\.?|bachelor of technology/i },
  { degree: "M.Tech", re: /m\.?\s?tech\.?|master of technology/i },
  { degree: "BCA", re: /\bbca\b|bachelor of computer applications/i },
  { degree: "MCA", re: /\bmca\b|master of computer applications/i },
  { degree: "BSc", re: /\bbsc\b|b\.?\s?sc\.?|bachelor of science/i },
  { degree: "MSc", re: /\bmsc\b|m\.?\s?sc\.?|master of science/i },
  { degree: "MBA", re: /\bmba\b|master of business administration/i },
  { degree: "BA", re: /\bba\b|bachelor of arts/i },
  { degree: "B.Com", re: /\bb\.?com\.?|bachelor of commerce/i },
  { degree: "M.Com", re: /\bm\.?com\.?|master of commerce/i },
  { degree: "BBA", re: /\bbba\b|bachelor of business administration/i },
  { degree: "ME", re: /\bme\b|master of engineering/i },
  { degree: "BE", re: /\bbe\b|bachelor of engineering/i },
  { degree: "PhD", re: /\bph\.?d\.?\b|doctor of philosophy/i },
  { degree: "Diploma", re: /\bdiploma\b/i },
];

const BRANCH_KEYWORDS = [
  "computer science", "information technology", "electronics", "electrical",
  "mechanical", "civil", "chemical", "biotechnology", "data science",
  "artificial intelligence", "machine learning", "cybersecurity",
  "software engineering", "cloud computing", "blockchain",
  "computer engineering", "electronics and communication",
];

const LANGUAGE_LIST = [
  "english", "hindi", "spanish", "french", "german", "chinese", "japanese",
  "korean", "portuguese", "arabic", "russian", "italian", "dutch",
  "bengali", "tamil", "telugu", "marathi", "kannada", "malayalam",
  "gujarati", "punjabi", "urdu", "thai", "vietnamese", "turkish",
];

const PROFICIENCY_LEVELS = ["native", "fluent", "advanced", "intermediate", "beginner", "professional", "working knowledge", "basic"];

function splitIntoSections(text) {
  const sections = {};
  const lines = text.split("\n");
  let currentSection = "preamble";
  let currentLines = [];

  for (const line of lines) {
    let matched = false;
    for (const [name, re] of Object.entries(SECTION_PATTERNS)) {
      const sectionTitleRe = new RegExp(`^\\s*${re.source.replace("(?:^|\\n)\\s*", "").replace("\\s*[:\\-#]", "")}\\s*[:\\-#]?\\s*$`, "i");
      if (sectionTitleRe.test(line.trim())) {
        if (currentLines.length > 0) {
          sections[currentSection] = currentLines.join("\n").trim();
        }
        currentSection = name;
        currentLines = [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    sections[currentSection] = currentLines.join("\n").trim();
  }
  return sections;
}

function extractPersonalInfo(text, firstLines) {
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRe = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  const linkedinRe = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
  const githubRe = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi;

  const emails = Array.from(new Set((text.match(emailRe) || [])));
  const phones = Array.from(new Set((text.match(phoneRe) || []))).map((p) => p.trim()).filter((p) => p.replace(/\D/g, "").length >= 7);
  const linkedin = (text.match(linkedinRe) || [])[0] || "";
  const github = (text.match(githubRe) || [])[0] || "";

  let name = "";
  const preambleLines = (firstLines || "").split("\n").filter((l) => l.trim().length > 0);
  for (const line of preambleLines) {
    const trimmed = line.trim();
    if (emails.some((e) => trimmed.includes(e))) continue;
    if (phones.some((p) => trimmed.includes(p))) continue;
    if (/linkedin\.com|github\.com/i.test(trimmed)) continue;
    if (/^[+\d\s()-]{7,}$/.test(trimmed)) continue;
    if (/[|/,]/.test(trimmed) && trimmed.split(/[|/,]/).length > 2) continue;
    if (trimmed.length >= 2 && trimmed.length <= 60 && /^[A-Za-z\s.'-]+$/.test(trimmed)) {
      name = trimmed;
      break;
    }
  }

  let address = "";
  const addrRe = /(?:(?:[A-Z][a-zA-Z\s]+(?:,\s*)?){1,3}(?:,?\s*\d{6})?)/;
  const addrMatch = text.match(addrRe);
  if (addrMatch && addrMatch[0].length > 5) {
    address = addrMatch[0].trim();
  }

  return {
    name,
    email: emails[0] || "",
    phone: phones[0] || "",
    address,
    linkedin: linkedin || "",
    github: github || "",
  };
}

function extractEducation(sectionText) {
  if (!sectionText) return [];
  const education = [];
  const lines = sectionText.split("\n").filter((l) => l.trim());

  for (const { degree, re } of DEGREE_PATTERNS) {
    for (const line of lines) {
      if (!re.test(line)) continue;

      const branch = BRANCH_KEYWORDS.find((b) => line.toLowerCase().includes(b)) || "";

      const instRe = /(?:at|from|,)\s+([A-Z][A-Za-z\s&.,'-]{4,80})/i;
      const instMatch = line.match(instRe);
      const institution = instMatch ? instMatch[1].trim().replace(/[.,]$/, "") : "";

      const cgpaRe = /(?:cgpa|gpa|grade)[:\s]*(\d+\.?\d*)/i;
      const cgpaMatch = line.match(cgpaRe);
      const percentageRe = /(\d+\.?\d*)\s*%/i;
      const percentMatch = line.match(percentageRe);

      let cgpa = 0;
      if (cgpaMatch) {
        cgpa = parseFloat(cgpaMatch[1]);
      } else if (percentMatch) {
        cgpa = parseFloat(percentMatch[1]);
      }

      const yearRe = /\b(20\d{2})\b/g;
      const years = [...line.matchAll(yearRe)].map((m) => parseInt(m[1]));
      const startYear = years.length >= 2 ? years[0] : years[0] || 0;
      const endYear = years.length >= 2 ? years[1] : years[0] || 0;

      education.push({
        institution: institution || "",
        degree,
        branch,
        cgpa,
        startYear,
        endYear,
      });
    }
  }

  if (education.length === 0) {
    const generalRe = /(?:education|academic)[\s\S]*$/i;
    if (generalRe.test(sectionText)) {
      const yearRe = /\b(20\d{2})\b/g;
      const years = [...sectionText.matchAll(yearRe)].map((m) => parseInt(m[1]));
      education.push({
        institution: "",
        degree: "",
        branch: "",
        cgpa: 0,
        startYear: years[0] || 0,
        endYear: years[1] || years[0] || 0,
      });
    }
  }

  return education;
}

function extractSkills(sectionText) {
  if (!sectionText) return [];
  const skills = [];
  const textForSearch = sectionText;

  for (const [category, skillList] of Object.entries(SKILL_TAXONOMY)) {
    for (const skill of skillList) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(textForSearch)) {
        skills.push({ name: skill, category });
      }
    }
  }

  if (skills.length === 0) {
    const commaSplit = sectionText.split(/[,;|]/);
    for (const raw of commaSplit) {
      const s = raw.trim().replace(/^[-•*]\s*/, "");
      if (s.length > 1 && s.length < 50 && !/^(and|or|the|with)$/i.test(s)) {
        let matchedCategory = "other";
        for (const [cat, skillList] of Object.entries(SKILL_TAXONOMY)) {
          if (skillList.some((sk) => sk.toLowerCase() === s.toLowerCase())) {
            matchedCategory = cat;
            break;
          }
        }
        skills.push({ name: s, category: matchedCategory });
      }
    }
  }

  return skills;
}

function extractProjects(sectionText) {
  if (!sectionText) return [];
  const projects = [];
  const blocks = sectionText.split(/(?=(?:^|\n)\s*(?:[-•*]\s+|[A-Z0-9]))/);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const titleLine = lines[0].replace(/^[-•*]\s*/, "").trim();
    if (titleLine.length < 2) continue;

    const descLines = lines.slice(1).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    const description = descLines.join(" ").slice(0, 500);

    const techRe = /(?:tech(?:nologies?)?|built with|using|stack)[:\s]*([\w\s,#+.\/]+)/i;
    const techMatch = block.match(techRe);
    const technologies = techMatch
      ? techMatch[1].split(/[,\/]/).map((t) => t.trim()).filter((t) => t.length > 0 && t.length < 40)
      : [];

    projects.push({
      title: titleLine.slice(0, 150),
      description,
      technologies,
    });
  }

  return projects.slice(0, 10);
}

function extractExperience(sectionText) {
  if (!sectionText) return [];
  const experience = [];
  const dateRe = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{4}|\d{4})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{4}|\d{4}|present|current|till\s*date)/gi;

  const blocks = sectionText.split(/(?=(?:^|\n)\s*(?:[-•*]\s+)?[A-Z0-9])/);

  for (const block of blocks) {
    const dateMatch = block.match(dateRe);
    const startDate = dateMatch ? dateMatch[0].split(/[-–—to]+/i)[0]?.trim() : "";
    const endDate = dateMatch ? dateMatch[0].split(/[-–—to]+/i).pop()?.trim() : "";

    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const headerLine = lines[0].replace(/^[-•*]\s*/, "").trim();

    let role = "";
    let company = "";
    const roleCompanyRe = /^(.+?)\s*(?:at|@|,|\|)\s*(.+?)$/;
    const rcMatch = headerLine.match(roleCompanyRe);
    if (rcMatch) {
      role = rcMatch[1].trim();
      company = rcMatch[2].trim();
    } else {
      if (dateMatch) {
        role = headerLine.replace(dateRe, "").replace(/[-–—to]+/g, "").trim();
      } else {
        role = headerLine;
      }
    }

    const descLines = lines.slice(1).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    const description = descLines.join(" ").slice(0, 800);

    if (role || company) {
      experience.push({ company, role, description, startDate, endDate });
    }
  }

  return experience.slice(0, 10);
}

function extractCertifications(sectionText) {
  if (!sectionText) return [];
  const certifications = [];
  const lines = sectionText.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const cleaned = line.replace(/^[-•*]\s*/, "").trim();
    if (cleaned.length < 3) continue;

    const issuerRe = /(?:by|from|issued by|offered by)\s+(.+)/i;
    const issuerMatch = cleaned.match(issuerRe);
    const issuer = issuerMatch ? issuerMatch[1].trim() : "";

    const dateRe = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{4}|\d{4}/i;
    const dateMatch = cleaned.match(dateRe);
    const date = dateMatch ? dateMatch[0] : "";

    const name = cleaned
      .replace(issuerRe, "")
      .replace(dateRe, "")
      .replace(/[-–—]/g, "")
      .trim();

    if (name.length > 2) {
      certifications.push({ name, issuer, date });
    }
  }

  return certifications.slice(0, 10);
}

function extractLanguages(sectionText) {
  if (!sectionText) return [];
  const languages = [];
  const text = sectionText.toLowerCase();

  for (const lang of LANGUAGE_LIST) {
    const re = new RegExp(`\\b${lang}\\b`, "i");
    if (re.test(text)) {
      let proficiency = "Intermediate";
      const profRe = new RegExp(`${lang}[^\\n]*(?:\\(([^)]+)\\)|[-–—:]\\s*(\\w+(?:\\s*\\w+)?))`, "i");
      const profMatch = text.match(profRe);
      if (profMatch) {
        const profText = (profMatch[1] || profMatch[2] || "").toLowerCase();
        const found = PROFICIENCY_LEVELS.find((p) => profText.includes(p));
        if (found) {
          proficiency = found.charAt(0).toUpperCase() + found.slice(1);
        }
      }
      languages.push({ name: lang.charAt(0).toUpperCase() + lang.slice(1), proficiency });
    }
  }

  const lines = sectionText.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const cleaned = line.replace(/^[-•*]\s*/, "").trim();
    const parts = cleaned.split(/[,;|]/);
    for (const part of parts) {
      const p = part.trim();
      if (p.length < 2 || p.length > 30) continue;
      if (LANGUAGE_LIST.some((l) => l.toLowerCase() === p.toLowerCase())) continue;
      const re = new RegExp(`^(.+?)\\s*[-–:(]\\s*(${PROFICIENCY_LEVELS.join("|")})`, "i");
      const m = p.match(re);
      if (m) {
        const langName = m[1].trim();
        const prof = m[2];
        if (!languages.some((l) => l.name.toLowerCase() === langName.toLowerCase())) {
          languages.push({
            name: langName,
            proficiency: prof.charAt(0).toUpperCase() + prof.slice(1),
          });
        }
      }
    }
  }

  return languages.slice(0, 10);
}

function extractAchievements(sectionText) {
  if (!sectionText) return [];
  return sectionText
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 5 && l.length < 300)
    .slice(0, 15);
}

function extractSummary(sectionText) {
  if (!sectionText) return "";
  return sectionText.split("\n").map((l) => l.trim()).filter(Boolean).join(" ").slice(0, 500);
}

function parseResume(text) {
  if (!text || text.trim().length < 10) {
    return {
      personal: { name: "", email: "", phone: "", address: "", linkedin: "", github: "" },
      education: [], skills: [], projects: [], experience: [],
      certifications: [], languages: [], achievements: [], summary: "",
    };
  }

  const sections = splitIntoSections(text);
  const preamble = sections.preamble || text.split("\n").slice(0, 5).join("\n");

  const personal = extractPersonalInfo(text, preamble);

  return {
    personal,
    education: extractEducation(sections.education || ""),
    skills: extractSkills(sections.skills || ""),
    projects: extractProjects(sections.projects || ""),
    experience: extractExperience(sections.experience || ""),
    certifications: extractCertifications(sections.certifications || ""),
    languages: extractLanguages(sections.languages || ""),
    achievements: extractAchievements(sections.achievements || ""),
    summary: extractSummary(sections.summary || ""),
  };
}

module.exports = { parseResume, splitIntoSections };
