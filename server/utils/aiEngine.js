const SKILL_TAXONOMY = {
  programming: ["Python","Java","JavaScript","TypeScript","C++","C","C#","Go","Rust","Ruby","PHP","Swift","Kotlin","Dart","Scala","R","MATLAB","Shell","Bash"],
  frontend: ["React","Next.js","Vue","Angular","Svelte","Redux","HTML","CSS","Tailwind","Bootstrap","SASS","Material UI","Framer Motion"],
  backend: ["Node.js","Express","Django","Flask","FastAPI","Spring Boot","Laravel","Rails","GraphQL","REST","WebSocket","Microservices"],
  database: ["MySQL","PostgreSQL","MongoDB","Redis","SQLite","Firebase","DynamoDB","Cassandra","Oracle","SQL Server","Elasticsearch"],
  data: ["Pandas","NumPy","Scikit-learn","TensorFlow","PyTorch","Keras","Power BI","Tableau","Excel","SQL","Data Analysis","Data Visualization","Statistics","Machine Learning","Deep Learning","NLP","Computer Vision","Spark","Hadoop","ETL","Data Warehouse","Airflow","dbt"],
  cloud: ["AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","Jenkins","GitHub Actions","Linux","DevOps","Lambda","S3","EC2"],
  design: ["Figma","Adobe XD","Photoshop","Illustrator","UI/UX","Sketch","Canva","After Effects","Premiere Pro","Wireframing","Prototyping"],
  marketing: ["SEO","SEM","Content Marketing","Social Media","Google Ads","Facebook Ads","Email Marketing","Analytics","Copywriting","Brand Management","Market Research"],
  soft: ["Communication","Leadership","Teamwork","Problem Solving","Time Management","Critical Thinking","Project Management","Presentation","Negotiation","Adaptability"],
};

const ALL_SKILLS = Object.values(SKILL_TAXONOMY).flat();

function vectorizeSkills(skills) {
  const set = new Set(skills.map((s) => s.toLowerCase()));
  return ALL_SKILLS.map((s) => (set.has(s.toLowerCase()) ? 1 : 0));
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function jaccardSimilarity(a, b) {
  const sa = new Set(a.map((s) => s.toLowerCase()));
  const sb = new Set(b.map((s) => s.toLowerCase()));
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function computeMatch(student, internship) {
  const studentSkills = student.skills.map((s) => s.toLowerCase());
  const internshipSkills = internship.skills.map((s) => s.toLowerCase());
  const matchingSkills = internshipSkills.filter((s) => studentSkills.includes(s));
  const missingSkills = internshipSkills.filter((s) => !studentSkills.includes(s));

  const vStudent = vectorizeSkills(student.skills);
  const vIntern = vectorizeSkills(internship.skills);
  const cosine = cosineSimilarity(vStudent, vIntern);
  const jaccard = jaccardSimilarity(student.skills, internship.skills);

  const locationMatch =
    student.preferredLocations.length === 0 ||
    student.preferredLocations.some((l) => {
      const ll = l.toLowerCase();
      if (ll === "remote") return internship.workMode === "remote";
      if (ll === "hybrid") return internship.workMode === "hybrid";
      return internship.location.toLowerCase().includes(ll);
    }) ? 1 : 0;

  const domainMatch =
    student.interests.some(
      (i) => i.toLowerCase().includes(internship.domain.toLowerCase()) || internship.domain.toLowerCase().includes(i.toLowerCase())
    ) || student.interests.length === 0 ? 1 : 0.3;

  const stipendScore = Math.min(1, internship.stipend / 30000);
  const durationScore = Math.max(0.4, 1 - (internship.duration - 8) * 0.05);
  const score = (cosine * 0.5 + jaccard * 0.2 + locationMatch * 0.1 + domainMatch * 0.1 + (stipendScore * 0.5 + durationScore * 0.5) * 0.1) * 100;
  const finalScore = Math.round(Math.min(99, Math.max(0, score)));

  const reasons = [];
  if (matchingSkills.length > 0) reasons.push(`Strong skill match — you have ${matchingSkills.slice(0, 4).join(", ")}${matchingSkills.length > 4 ? ` +${matchingSkills.length - 4} more` : ""}`);
  if (locationMatch === 1) reasons.push(`Work mode (${internship.workMode}) fits your preferences`);
  if (domainMatch === 1) reasons.push(`Domain aligned with your interests in ${internship.domain}`);
  if (internship.stipend >= 20000) reasons.push(`Above-average stipend (\u20B9${internship.stipend.toLocaleString("en-IN")}/mo)`);
  if (missingSkills.length > 0 && missingSkills.length <= 3) reasons.push(`Only ${missingSkills.length} skill gap${missingSkills.length > 1 ? "s" : ""} to close`);
  if (reasons.length === 0) reasons.push("Exploratory match based on profile similarity");

  return { internshipId: internship.id, score: finalScore, matchingSkills, missingSkills, reasons };
}

function recommendInternships(student, internships) {
  return internships.map((i) => computeMatch(student, i)).sort((a, b) => b.score - a.score);
}

function parseResume(text) {
  const lower = text.toLowerCase();
  const foundSkills = new Set();
  for (const skills of Object.values(SKILL_TAXONOMY)) {
    for (const skill of skills) {
      const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) foundSkills.add(skill);
    }
  }
  const emails = Array.from(new Set((text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])));
  const phones = Array.from(new Set((text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g) || [])).slice(0, 3));
  const links = Array.from(new Set((text.match(/(https?:\/\/[^\s]+|linkedin\.com\/[^\s]+|github\.com\/[^\s]+)/gi) || [])));

  const education = [];
  const degreePatterns = [
    { degree: "B.Tech", re: /b\.?\s?tech\.?|bachelor of technology/i },
    { degree: "M.Tech", re: /m\.?\s?tech\.?|master of technology/i },
    { degree: "BCA", re: /\bbca\b|bachelor of computer applications/i },
    { degree: "MCA", re: /\bmca\b|master of computer applications/i },
    { degree: "BSc", re: /\bbsc\b|b\.?\s?sc\.?|bachelor of science/i },
    { degree: "MSc", re: /\bmsc\b|m\.?\s?sc\.?|master of science/i },
    { degree: "MBA", re: /\bmba\b|master of business administration/i },
  ];
  for (const { degree, re } of degreePatterns) {
    if (re.test(text)) {
      const idx = text.search(re);
      const ctx = text.slice(idx, idx + 200);
      const instMatch = ctx.match(/(?:at|from|,)\s+([A-Z][A-Za-z\s&.,'-]{5,80})/);
      const yearMatch = ctx.match(/\b(20\d{2})\b/);
      education.push({ degree, institution: instMatch ? instMatch[1].trim().replace(/[.,]$/, "") : "\u2014", year: yearMatch ? yearMatch[1] : undefined });
    }
  }

  const projects = [];
  const projectRe = /(?:^|\n)\s*(?:project[s]?\s*[:\-]|#{1,4}\s*project[s]?[:\s])([^\n]+(?:\n(?!(?:project|experience|education|skill|certification)\s*[:\-#])[^\n]+){0,4})/gi;
  let m;
  while ((m = projectRe.exec(text)) !== null && projects.length < 5) {
    const body = m[1].trim();
    projects.push({ title: body.split("\n")[0].trim().slice(0, 100), description: body.slice(0, 300) });
  }

  const stop = new Set(["the","and","for","with","from","this","that","have","was","were","are","been","being","has","had","will","would","could","should","may","might","must","shall","can","need","into","onto","upon","about","above","below","between","during","after","before","since","until","while","where","when","what","which","who","whom","whose","why","how","all","any","both","each","few","more","most","other","some","such","only","own","same","very","just","also","than","too","your","their"]);
  const words = lower.replace(/[^a-z0-9\s+]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);

  return { skills: Array.from(foundSkills), education, projects, experience: [], emails, phones, links, keywords };
}

const CAREER_PATHS = [
  { title: "Data Scientist", domain: "Data Science", requiredSkills: ["Python","SQL","Machine Learning","Statistics","Pandas","Scikit-learn"], courses: [{ name: "Machine Learning Specialization", provider: "Coursera", url: "https://coursera.org" },{ name: "Python for Data Science", provider: "freeCodeCamp", url: "https://freecodecamp.org" }] },
  { title: "Full Stack Developer", domain: "Web Development", requiredSkills: ["React","Node.js","JavaScript","MongoDB","REST","TypeScript"], courses: [{ name: "Full Stack Development", provider: "The Odin Project", url: "https://theodinproject.com" },{ name: "React - The Complete Guide", provider: "Udemy", url: "https://udemy.com" }] },
  { title: "AI/ML Engineer", domain: "Artificial Intelligence", requiredSkills: ["Python","TensorFlow","PyTorch","Deep Learning","NLP","Computer Vision"], courses: [{ name: "Deep Learning Specialization", provider: "Coursera", url: "https://coursera.org" },{ name: "Practical Deep Learning", provider: "fast.ai", url: "https://fast.ai" }] },
  { title: "Cloud DevOps Engineer", domain: "DevOps", requiredSkills: ["AWS","Docker","Kubernetes","Linux","CI/CD","Terraform"], courses: [{ name: "AWS Certified Solutions Architect", provider: "AWS", url: "https://aws.amazon.com/training" },{ name: "Docker & Kubernetes", provider: "KodeKloud", url: "https://kodekloud.com" }] },
  { title: "UI/UX Designer", domain: "Design", requiredSkills: ["Figma","UI/UX","Wireframing","Prototyping","Photoshop"], courses: [{ name: "Google UX Design", provider: "Coursera", url: "https://coursera.org" },{ name: "Figma for Beginners", provider: "YouTube", url: "https://youtube.com" }] },
  { title: "Digital Marketing Specialist", domain: "Marketing", requiredSkills: ["SEO","Google Ads","Content Marketing","Social Media","Analytics"], courses: [{ name: "Google Digital Marketing", provider: "Google", url: "https://learndigital.withgoogle.com" },{ name: "HubSpot Inbound Marketing", provider: "HubSpot", url: "https://academy.hubspot.com" }] },
];

function suggestCareers(student) {
  const studentSkills = student.skills.map((s) => s.toLowerCase());
  return CAREER_PATHS.map((path) => {
    const matchingSkills = path.requiredSkills.filter((s) => studentSkills.includes(s.toLowerCase()));
    const missingSkills = path.requiredSkills.filter((s) => !studentSkills.includes(s.toLowerCase()));
    return { title: path.title, domain: path.domain, matchScore: Math.round((matchingSkills.length / path.requiredSkills.length) * 100), reason: matchingSkills.length === 0 ? "New career path to explore" : `You have ${matchingSkills.length} of ${path.requiredSkills.length} required skills`, missingSkills, recommendedCourses: path.courses };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
}

function analyzeSkillGap(student, targetInternships) {
  const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
  const freq = {};
  for (const i of targetInternships) {
    for (const s of i.skills) {
      const sl = s.toLowerCase();
      if (!studentSkills.has(sl)) freq[sl] = (freq[sl] || 0) + 1;
    }
  }
  return Object.entries(freq).map(([skill, frequency]) => ({
    skill: skill.charAt(0).toUpperCase() + skill.slice(1),
    importance: frequency >= 3 ? "critical" : frequency >= 2 ? "recommended" : "optional",
    frequency,
    courses: [`Introduction to ${skill}`, `Hands-on ${skill} Projects`],
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 8);
}

module.exports = { computeMatch, recommendInternships, parseResume, suggestCareers, analyzeSkillGap, ALL_SKILLS, SKILL_TAXONOMY };
