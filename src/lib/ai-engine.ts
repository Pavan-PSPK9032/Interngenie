// ─────────────────────────────────────────────────────────────────────
//  AI Recommendation Engine
//  Hybrid: Content-Based Filtering + Collaborative Filtering + Heuristics
// ─────────────────────────────────────────────────────────────────────
import type {
  Internship,
  MatchResult,
  StudentProfile,
} from "./types";

// ─── Skill taxonomy for resume parsing ────────────────────────────────
export const SKILL_TAXONOMY: Record<string, string[]> = {
  programming: [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C", "C#",
    "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Dart", "Scala",
    "R", "MATLAB", "Shell", "Bash",
  ],
  frontend: [
    "React", "Next.js", "Vue", "Angular", "Svelte", "Redux", "HTML",
    "CSS", "Tailwind", "Bootstrap", "SASS", "Material UI", "Framer Motion",
  ],
  backend: [
    "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot",
    "Laravel", "Rails", "GraphQL", "REST", "WebSocket", "Microservices",
  ],
  database: [
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Firebase",
    "DynamoDB", "Cassandra", "Oracle", "SQL Server", "Elasticsearch",
  ],
  data: [
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
    "Power BI", "Tableau", "Excel", "SQL", "Data Analysis", "Data Visualization",
    "Statistics", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Spark", "Hadoop", "ETL", "Data Warehouse", "Airflow", "dbt",
  ],
  cloud: [
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
    "Jenkins", "GitHub Actions", "Linux", "DevOps", "Lambda", "S3", "EC2",
  ],
  design: [
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "UI/UX", "Sketch",
    "Canva", "After Effects", "Premiere Pro", "Wireframing", "Prototyping",
  ],
  marketing: [
    "SEO", "SEM", "Content Marketing", "Social Media", "Google Ads",
    "Facebook Ads", "Email Marketing", "Analytics", "Copywriting",
    "Brand Management", "Market Research",
  ],
  soft: [
    "Communication", "Leadership", "Teamwork", "Problem Solving",
    "Time Management", "Critical Thinking", "Project Management",
    "Presentation", "Negotiation", "Adaptability",
  ],
};

export const ALL_SKILLS = Object.values(SKILL_TAXONOMY).flat();

export const SKILL_CATEGORIES = Object.keys(SKILL_TAXONOMY);

export function getSkillCategory(skill: string): string {
  const s = skill.toLowerCase();
  for (const [cat, skills] of Object.entries(SKILL_TAXONOMY)) {
    if (skills.some((sk) => sk.toLowerCase() === s)) return cat;
  }
  return "other";
}

// ─── Resume Skill Extraction ──────────────────────────────────────────
/**
 * Resume parser — extracts skills, education, projects from raw text.
 * Mimics spaCy NER + keyword extraction pipeline.
 */
export interface ParsedResume {
  skills: string[];
  education: { degree: string; institution: string; year?: string }[];
  projects: { title: string; description: string }[];
  experience: { role: string; company: string; duration: string }[];
  emails: string[];
  phones: string[];
  links: string[];
  keywords: string[];
}

export function parseResume(text: string): ParsedResume {
  const lower = text.toLowerCase();

  // Skill extraction (case-insensitive matching against taxonomy)
  const foundSkills = new Set<string>();
  for (const skills of Object.values(SKILL_TAXONOMY)) {
    for (const skill of skills) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) {
        // Preserve original casing from taxonomy
        foundSkills.add(skill);
      }
    }
  }

  // Email extraction
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = Array.from(new Set(text.match(emailRe) || []));

  // Phone extraction (Indian + international)
  const phoneRe = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  const phones = Array.from(new Set((text.match(phoneRe) || []).slice(0, 3)));

  // Links
  const linkRe = /(https?:\/\/[^\s]+|linkedin\.com\/[^\s]+|github\.com\/[^\s]+)/gi;
  const links = Array.from(new Set(text.match(linkRe) || []));

  // Education extraction — look for degree keywords
  const education: ParsedResume["education"] = [];
  const degreePatterns: { degree: string; re: RegExp }[] = [
    { degree: "B.Tech", re: /b\.?\s?tech\.?|bachelor of technology/i },
    { degree: "M.Tech", re: /m\.?\s?tech\.?|master of technology/i },
    { degree: "BCA", re: /\bbca\b|bachelor of computer applications/i },
    { degree: "MCA", re: /\bmca\b|master of computer applications/i },
    { degree: "BSc", re: /\bbsc\b|b\.?\s?sc\.?|bachelor of science/i },
    { degree: "MSc", re: /\bmsc\b|m\.?\s?sc\.?|master of science/i },
    { degree: "MBA", re: /\bmba\b|master of business administration/i },
    { degree: "BBA", re: /\bbba\b|bachelor of business administration/i },
    { degree: "B.Com", re: /b\.?\s?com\.?|bachelor of commerce/i },
    { degree: "PhD", re: /\bph\.?d\.?\b|doctorate/i },
  ];
  for (const { degree, re } of degreePatterns) {
    if (re.test(text)) {
      // Try to find institution near the degree mention
      const idx = text.search(re);
      const ctx = text.slice(idx, idx + 200);
      const instMatch = ctx.match(/(?:at|from|,)\s+([A-Z][A-Za-z\s&.,'-]{5,80})/);
      const yearMatch = ctx.match(/\b(20\d{2})\b/);
      education.push({
        degree,
        institution: instMatch ? instMatch[1].trim().replace(/[.,]$/, "") : "—",
        year: yearMatch ? yearMatch[1] : undefined,
      });
    }
  }

  // Project extraction — find "Project" headings
  const projects: ParsedResume["projects"] = [];
  const projectRe = /(?:^|\n)\s*(?:project[s]?\s*[:\-]|#{1,4}\s*project[s]?[:\s])([^\n]+(?:\n(?!(?:project|experience|education|skill|certification)\s*[:\-#])[^\n]+){0,4})/gi;
  let m: RegExpExecArray | null;
  while ((m = projectRe.exec(text)) !== null && projects.length < 5) {
    const body = m[1].trim();
    const firstLine = body.split("\n")[0].trim();
    projects.push({
      title: firstLine.slice(0, 100),
      description: body.slice(0, 300),
    });
  }

  // Experience extraction
  const experience: ParsedResume["experience"] = [];
  const expRe = /(?:^|\n)\s*(?:experience\s*[:\-]|#{1,4}\s*experience[:\s])([^\n]+(?:\n(?!(?:project|education|skill|certification)\s*[:\-#])[^\n]+){0,4})/gi;
  while ((m = expRe.exec(text)) !== null && experience.length < 5) {
    const body = m[1].trim();
    const firstLine = body.split("\n")[0].trim();
    const parts = firstLine.split(/[-–@|at]/).map((s) => s.trim()).filter(Boolean);
    experience.push({
      role: parts[0] || firstLine.slice(0, 60),
      company: parts[1] || "—",
      duration: parts[2] || "—",
    });
  }

  // Keyword extraction — top frequency non-stopword bigrams
  const stop = new Set([
    "the", "and", "for", "with", "from", "this", "that", "have", "was",
    "were", "are", "been", "being", "have", "has", "had", "will", "would",
    "could", "should", "may", "might", "must", "shall", "can", "need",
    "into", "onto", "upon", "about", "above", "below", "between", "during",
    "after", "before", "since", "until", "while", "where", "when", "what",
    "which", "who", "whom", "whose", "why", "how", "all", "any", "both",
    "each", "few", "more", "most", "other", "some", "such", "only", "own",
    "same", "very", "just", "also", "than", "too", "very", "your", "their",
  ]);
  const words = lower
    .replace(/[^a-z0-9\s+]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  return {
    skills: Array.from(foundSkills),
    education,
    projects,
    experience,
    emails,
    phones,
    links,
    keywords,
  };
}

// ─── Skill Vectorization & Cosine Similarity ──────────────────────────
/**
 * Build a binary skill vector aligned to ALL_SKILLS.
 */
export function vectorizeSkills(skills: string[]): number[] {
  const set = new Set(skills.map((s) => s.toLowerCase()));
  return ALL_SKILLS.map((s) => (set.has(s.toLowerCase()) ? 1 : 0));
}

/**
 * Cosine similarity for two equal-length numeric vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Jaccard similarity over skill sets (alternative metric).
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  const sa = new Set(a.map((s) => s.toLowerCase()));
  const sb = new Set(b.map((s) => s.toLowerCase()));
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

// ─── Hybrid Recommendation Engine ─────────────────────────────────────
/**
 * Compute a match score between a student profile and an internship.
 *
 * Components (weights):
 *  - Skill overlap (cosine)         50%
 *  - Skill coverage (Jaccard)       20%
 *  - Location preference match      10%
 *  - Domain / interest alignment    10%
 *  - Stipend / duration heuristic   10%
 *
 * Returns a 0-100 score + matching/missing skills + human-readable reasons.
 */
export function computeMatch(
  student: StudentProfile,
  internship: Internship
): MatchResult {
  const studentSkills = student.skills.map((s) => s.toLowerCase());
  const internshipSkills = internship.skills.map((s) => s.toLowerCase());
  const skillSetI = new Set(internshipSkills);

  // Matching / missing skills
  const matchingSkills = internshipSkills.filter((s) =>
    studentSkills.includes(s)
  );
  const missingSkills = internshipSkills.filter(
    (s) => !studentSkills.includes(s)
  );

  // Cosine similarity (content-based)
  const vStudent = vectorizeSkills(student.skills);
  const vIntern = vectorizeSkills(internship.skills);
  const cosine = cosineSimilarity(vStudent, vIntern); // 0-1

  // Jaccard (collaborative-style overlap)
  const jaccard = jaccardSimilarity(student.skills, internship.skills); // 0-1

  // Location preference
  const wantsRemote = student.preferredLocations.some(
    (l) => l.toLowerCase() === "remote"
  );
  const locationMatch =
    student.preferredLocations.length === 0 ||
    student.preferredLocations.some((l) => {
      const ll = l.toLowerCase();
      if (ll === "remote") return internship.workMode === "remote";
      if (ll === "hybrid") return internship.workMode === "hybrid";
      return (
        internship.location.toLowerCase().includes(ll) ||
        ll.includes(internship.location.toLowerCase().split(",")[0].toLowerCase())
      );
    })
      ? 1
      : 0;

  // Domain / interest alignment
  const domainMatch =
    student.interests.some(
      (i) =>
        i.toLowerCase().includes(internship.domain.toLowerCase()) ||
        internship.domain.toLowerCase().includes(i.toLowerCase())
    ) || student.interests.length === 0
      ? 1
      : 0.3;

  // Stipend / duration heuristic — modest bonus for higher stipend & shorter durations
  const stipendScore = Math.min(1, internship.stipend / 30000);
  const durationScore = Math.max(0.4, 1 - (internship.duration - 8) * 0.05);

  const score =
    (cosine * 0.5 +
      jaccard * 0.2 +
      locationMatch * 0.1 +
      domainMatch * 0.1 +
      (stipendScore * 0.5 + durationScore * 0.5) * 0.1) *
    100;

  const finalScore = Math.round(Math.min(99, Math.max(0, score)));

  // ─── Explainable AI — generate reasons ──────────────────────
  const reasons: string[] = [];
  if (matchingSkills.length > 0) {
    reasons.push(
      `Strong skill match — you have ${matchingSkills.slice(0, 4).join(", ")}${
        matchingSkills.length > 4 ? ` +${matchingSkills.length - 4} more` : ""
      }`
    );
  }
  if (locationMatch === 1) {
    const prefLoc = student.preferredLocations.find((l) => {
      const ll = l.toLowerCase();
      if (ll === "remote") return internship.workMode === "remote";
      return internship.location.toLowerCase().includes(ll);
    });
    reasons.push(
      prefLoc
        ? `Preferred location match — ${prefLoc}`
        : `Work mode (${internship.workMode}) fits your preferences`
    );
  }
  if (domainMatch === 1) {
    reasons.push(`Domain aligned with your interests in ${internship.domain}`);
  }
  if (internship.stipend >= 20000) {
    reasons.push(`Above-average stipend (₹${internship.stipend.toLocaleString("en-IN")}/mo)`);
  }
  if (missingSkills.length > 0 && missingSkills.length <= 3) {
    reasons.push(
      `Only ${missingSkills.length} skill gap${missingSkills.length > 1 ? "s" : ""} to close`
    );
  }
  if (reasons.length === 0) {
    reasons.push("Exploratory match based on profile similarity");
  }

  return {
    internshipId: internship.id,
    score: finalScore,
    matchingSkills: matchingSkills,
    missingSkills: missingSkills,
    reasons,
  };
}

/**
 * Rank all internships for a student and return sorted results.
 */
export function recommendInternships(
  student: StudentProfile,
  internships: Internship[]
): MatchResult[] {
  return internships
    .map((i) => computeMatch(student, i))
    .sort((a, b) => b.score - a.score);
}

// ─── Career Prediction ────────────────────────────────────────────────
export interface CareerSuggestion {
  title: string;
  domain: string;
  matchScore: number;
  reason: string;
  missingSkills: string[];
  recommendedCourses: { name: string; provider: string; url: string }[];
}

const CAREER_PATHS: {
  title: string;
  domain: string;
  requiredSkills: string[];
  courses: { name: string; provider: string; url: string }[];
}[] = [
  {
    title: "Data Scientist",
    domain: "Data Science",
    requiredSkills: ["Python", "SQL", "Machine Learning", "Statistics", "Pandas", "Scikit-learn"],
    courses: [
      { name: "Machine Learning Specialization", provider: "Coursera", url: "https://coursera.org" },
      { name: "Python for Data Science", provider: "freeCodeCamp", url: "https://freecodecamp.org" },
    ],
  },
  {
    title: "Full Stack Developer",
    domain: "Web Development",
    requiredSkills: ["React", "Node.js", "JavaScript", "MongoDB", "REST", "TypeScript"],
    courses: [
      { name: "Full Stack Development", provider: "The Odin Project", url: "https://theodinproject.com" },
      { name: "React - The Complete Guide", provider: "Udemy", url: "https://udemy.com" },
    ],
  },
  {
    title: "AI/ML Engineer",
    domain: "Artificial Intelligence",
    requiredSkills: ["Python", "TensorFlow", "PyTorch", "Deep Learning", "NLP", "Computer Vision"],
    courses: [
      { name: "Deep Learning Specialization", provider: "Coursera", url: "https://coursera.org" },
      { name: "Practical Deep Learning", provider: "fast.ai", url: "https://fast.ai" },
    ],
  },
  {
    title: "Cloud DevOps Engineer",
    domain: "DevOps",
    requiredSkills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform"],
    courses: [
      { name: "AWS Certified Solutions Architect", provider: "AWS", url: "https://aws.amazon.com/training" },
      { name: "Docker & Kubernetes", provider: "KodeKloud", url: "https://kodekloud.com" },
    ],
  },
  {
    title: "UI/UX Designer",
    domain: "Design",
    requiredSkills: ["Figma", "UI/UX", "Wireframing", "Prototyping", "Photoshop"],
    courses: [
      { name: "Google UX Design", provider: "Coursera", url: "https://coursera.org" },
      { name: "Figma for Beginners", provider: "YouTube", url: "https://youtube.com" },
    ],
  },
  {
    title: "Digital Marketing Specialist",
    domain: "Marketing",
    requiredSkills: ["SEO", "Google Ads", "Content Marketing", "Social Media", "Analytics"],
    courses: [
      { name: "Google Digital Marketing", provider: "Google", url: "https://learndigital.withgoogle.com" },
      { name: "HubSpot Inbound Marketing", provider: "HubSpot", url: "https://academy.hubspot.com" },
    ],
  },
];

export function suggestCareers(
  student: StudentProfile
): CareerSuggestion[] {
  const studentSkills = student.skills.map((s) => s.toLowerCase());

  return CAREER_PATHS.map((path) => {
    const requiredSkills = path.requiredSkills;
    const matchingSkills = requiredSkills.filter((s) =>
      studentSkills.includes(s.toLowerCase())
    );
    const missingSkills = requiredSkills.filter(
      (s) => !studentSkills.includes(s.toLowerCase())
    );
    const matchScore = Math.round(
      (matchingSkills.length / requiredSkills.length) * 100
    );
    return {
      title: path.title,
      domain: path.domain,
      matchScore,
      reason:
        matchingSkills.length === 0
          ? "New career path to explore"
          : `You have ${matchingSkills.length} of ${requiredSkills.length} required skills`,
      missingSkills,
      recommendedCourses: path.courses,
    };
  })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);
}

// ─── Skill Gap Analysis ───────────────────────────────────────────────
export interface SkillGap {
  skill: string;
  importance: "critical" | "recommended" | "optional";
  frequency: number; // how often it appears in target internships
  courses: string[];
}

export function analyzeSkillGap(
  student: StudentProfile,
  targetInternships: Internship[]
): SkillGap[] {
  const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
  const freq: Record<string, number> = {};

  for (const i of targetInternships) {
    for (const s of i.skills) {
      const sl = s.toLowerCase();
      if (!studentSkills.has(sl)) {
        freq[sl] = (freq[sl] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .map(([skill, frequency]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      importance:
        frequency >= 3 ? "critical" : frequency >= 2 ? "recommended" : "optional",
      frequency,
      courses: [`Introduction to ${skill}`, `Hands-on ${skill} Projects`],
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8);
}
