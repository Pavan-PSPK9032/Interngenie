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

function collaborativeFilter(studentId, applications, allStudents) {
  const studentApps = applications.filter((a) => a.studentId === studentId);
  if (studentApps.length === 0) return [];

  const studentDomains = new Set(
    studentApps.map((a) => {
      const internship = allStudents._internshipMap ? allStudents._internshipMap.get(a.internshipId) : null;
      return internship ? internship.domain : a.domain;
    }).filter(Boolean)
  );

  const studentAppliedIds = new Set(studentApps.map((a) => a.internshipId));

  const peerMap = {};
  for (const app of applications) {
    if (app.studentId === studentId) continue;
    if (!peerMap[app.studentId]) peerMap[app.studentId] = [];
    peerMap[app.studentId].push(app);
  }

  const scores = [];
  for (const [peerId, peerApps] of Object.entries(peerMap)) {
    const peerDomains = new Set(
      peerApps.map((a) => {
        const internship = allStudents._internshipMap ? allStudents._internshipMap.get(a.internshipId) : null;
        return internship ? internship.domain : a.domain;
      }).filter(Boolean)
    );
    const similarity = jaccardSimilarity(Array.from(studentDomains), Array.from(peerDomains));
    if (similarity > 0) {
      scores.push({ peerId, similarity, apps: peerApps });
    }
  }

  scores.sort((a, b) => b.similarity - a.similarity);
  const topPeers = scores.slice(0, 10);

  const recommendationScores = {};
  for (const peer of topPeers) {
    for (const app of peer.apps) {
      if (studentAppliedIds.has(app.internshipId)) continue;
      if (!recommendationScores[app.internshipId]) {
        recommendationScores[app.internshipId] = { totalScore: 0, count: 0 };
      }
      recommendationScores[app.internshipId].totalScore += peer.similarity;
      recommendationScores[app.internshipId].count += 1;
    }
  }

  const results = Object.entries(recommendationScores).map(([internshipId, data]) => ({
    internshipId,
    score: Math.round((data.totalScore / data.count) * 100),
    reason: `${data.count} similar student${data.count > 1 ? "s" : ""} with matching interests also applied to this internship`,
  }));

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 15);
}

function hybridRecommend(student, internships, applications, allStudents) {
  const contentBased = recommendInternships(student, internships);
  const collaborative = collaborativeFilter(
    student.id || student._id,
    applications,
    { _internshipMap: new Map(internships.map((i) => [i.id, i])) }
  );

  if (collaborative.length === 0) {
    return contentBased.map((r) => ({ ...r, source: "content" }));
  }

  const collabMap = {};
  for (const c of collaborative) {
    collabMap[c.internshipId] = c;
  }

  const combined = contentBased.map((item) => {
    const collab = collabMap[item.internshipId];
    if (collab) {
      const combinedScore = Math.round(item.score * 0.6 + collab.score * 0.4);
      return {
        ...item,
        score: combinedScore,
        reasons: [...item.reasons, collab.reason],
        source: "hybrid",
      };
    }
    return { ...item, score: Math.round(item.score * 0.6), source: "content" };
  });

  for (const c of collaborative) {
    if (!combined.find((item) => item.internshipId === c.internshipId)) {
      combined.push({
        internshipId: c.internshipId,
        score: Math.round(c.score * 0.4),
        matchingSkills: [],
        missingSkills: [],
        reasons: [c.reason],
        source: "collaborative",
      });
    }
  }

  combined.sort((a, b) => b.score - a.score);
  return combined;
}

function generateCoverLetter(studentProfile, internship) {
  const name = studentProfile.name || "Applicant";
  const email = studentProfile.email || "";
  const phone = studentProfile.phone || "";
  const skills = studentProfile.skills || [];
  const interests = studentProfile.interests || [];
  const cgpa = studentProfile.cgpa || "";
  const college = studentProfile.college || "my university";
  const degree = studentProfile.degree || "computer science";
  const branch = studentProfile.branch || "";
  const graduationYear = studentProfile.graduationYear || "";
  const projects = studentProfile.projects || [];

  const topSkills = skills.slice(0, 6);
  const skillList = topSkills.length > 0 ? topSkills.join(", ") : "software development and problem-solving";
  const companyName = internship.companyName || "your organization";
  const roleTitle = internship.title || "the internship position";
  const domain = internship.domain || "technology";

  const relevantSkills = skills.filter((s) =>
    (internship.skills || []).some((is) => is.toLowerCase() === s.toLowerCase())
  );
  const skillParagraph = relevantSkills.length > 0
    ? `My proficiency in ${relevantSkills.join(", ")} directly aligns with the requirements of this role. ${topSkills.length > 0 ? `Additionally, I bring strong capabilities in ${skillList},` : "I bring strong technical capabilities,"} which I have developed through rigorous academic training at ${college}.`
    : `While I am actively building expertise in ${domain}, my foundation in ${skillList} provides a strong base for rapid skill acquisition in this domain.`;

  const projectParagraph = projects.length > 0
    ? `In my recent project "${projects[0].title || projects[0]}", I ${projects[0].description ? projects[0].description.slice(0, 150) : "applied my technical skills to solve a real-world problem"}, demonstrating my ability to deliver results in a practical setting.${projects.length > 1 ? ` Additionally, "${projects[1].title || projects[1]}" further honed my skills in ${domain}.` : ""}`
    : `Through my academic projects and coursework, I have demonstrated the ability to translate theoretical knowledge into practical solutions, preparing me to contribute effectively from day one.`;

  const cgpaLine = cgpa ? ` maintaining a CGPA of ${cgpa}` : "";
  const yearLine = graduationYear ? ` I expect to graduate in ${graduationYear}.` : "";

  const coverLetter = `${name}
${email}${phone ? "\n" + phone : ""}

Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${roleTitle} position at ${companyName}. As a ${degree}${branch ? " " + branch : ""} student at ${college}${cgpaLine},${yearLine} I am eager to contribute my skills and passion for ${domain} to your team.

${skillParagraph}

${projectParagraph}

I am particularly drawn to ${companyName}'s work in ${domain} and am confident that my analytical mindset, combined with my technical skill set, will allow me to add meaningful value to your ongoing projects. I am a quick learner who thrives in collaborative environments and am committed to delivering high-quality work.

${internship.duration ? `I am available for the ${internship.duration}-month duration of this internship` : "I am available to start immediately and am flexible with the internship duration"}, and I am excited about the opportunity to learn from the talented professionals at ${companyName}.

Thank you for considering my application. I look forward to the possibility of discussing how my background and enthusiasm align with your team's goals.

Sincerely,
${name}`;

  const tone = skills.length >= 5 ? "confident" : "eager";
  return { coverLetter, tone };
}

function analyzeLinkedInProfile(text) {
  if (!text || text.length < 10) {
    return { completeness: 0, strengths: [], improvements: ["Add a complete LinkedIn profile text"], suggestedAdditions: ["Headline", "Summary", "Experience", "Skills"] };
  }

  const lower = text.toLowerCase();
  let completeness = 0;
  const strengths = [];
  const improvements = [];
  const suggestedAdditions = [];

  const hasHeadline = /headline|title|role|engineer|developer|designer|analyst|manager|student/i.test(text);
  const hasSummary = /summary|about|passionate|dedicated|experienced|motivated/i.test(text);
  const hasExperience = /experience|worked at|internship|position|role at/i.test(text);
  const hasEducation = /education|university|college|bachelor|master|degree|b\.tech|m\.tech/i.test(text);
  const hasSkills = /skills|proficient in|expertise|technologies|languages/i.test(text);
  const hasEndorsements = /endorsement|endorsed|recommended/i.test(text);
  const hasConnections = /connection|follower|network/i.test(text);

  if (hasHeadline) { completeness += 15; strengths.push("Has a professional headline"); }
  else { improvements.push("Add a clear professional headline"); suggestedAdditions.push("Headline"); }

  if (hasSummary) { completeness += 20; strengths.push("Includes a compelling summary section"); }
  else { improvements.push("Write a compelling summary section"); suggestedAdditions.push("Summary/About section"); }

  const experienceMatches = text.match(/experience|worked at|internship|position/gi) || [];
  const experienceCount = experienceMatches.length;
  if (experienceCount > 0) { completeness += Math.min(20, experienceCount * 7); strengths.push(`Lists ${experienceCount} experience entries`); }
  else { improvements.push("Add work experience or internship details"); suggestedAdditions.push("Experience section"); }

  if (hasEducation) { completeness += 15; strengths.push("Education section present"); }
  else { improvements.push("Add education details"); suggestedAdditions.push("Education section"); }

  const skillMatches = text.match(/skills|proficient|expertise|technologies/gi) || [];
  const skillsCount = skillMatches.length;
  if (skillsCount > 0) { completeness += Math.min(15, skillsCount * 5); strengths.push(`${skillsCount} skill-related entries found`); }
  else { improvements.push("List your key technical and soft skills"); suggestedAdditions.push("Skills section"); }

  if (hasEndorsements) { completeness += 5; strengths.push("Has endorsement information"); }
  else { suggestedAdditions.push("Endorsements"); }

  if (hasConnections) { completeness += 5; strengths.push("Mentions network/connections"); }
  else { suggestedAdditions.push("Connections count"); }

  completeness = Math.min(100, completeness);

  if (completeness < 50) improvements.push("Profile is significantly incomplete - prioritize filling all sections");
  if (!text.includes("http") && !text.includes("www")) suggestedAdditions.push("Portfolio or project links");

  const endorsements = hasEndorsements ? (text.match(/endorse/gi) || []).length : 0;
  const connectionsEstimate = hasConnections ? Math.max(50, (text.match(/connection/gi) || []).length * 100) : 0;

  return {
    completeness,
    strengths,
    improvements,
    suggestedAdditions,
    _meta: { experienceCount, skillsCount, endorsements, connectionsEstimate },
  };
}

function analyzeGitHubProfile(repos) {
  if (!repos || !Array.isArray(repos) || repos.length === 0) {
    return { score: 0, topLanguages: [], contributionPattern: "No data", suggestions: ["Create public repositories to build your GitHub presence"] };
  }

  let score = 0;
  const languageMap = {};
  let totalStars = 0;
  let totalForks = 0;
  let withDescription = 0;
  let recentRepos = 0;
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

  for (const repo of repos) {
    if (repo.language) {
      languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
    }
    totalStars += repo.stars || 0;
    totalForks += repo.forks || 0;
    if (repo.description && repo.description.length > 10) withDescription++;
    if (repo.updatedAt && new Date(repo.updatedAt).getTime() > sixMonthsAgo) recentRepos++;
  }

  score += Math.min(25, repos.length * 3);
  const languageDiversity = Object.keys(languageMap).length;
  score += Math.min(20, languageDiversity * 4);
  score += Math.min(20, recentRepos * 5);
  score += Math.min(15, withDescription * 3);
  score += Math.min(10, totalStars * 2);
  score += Math.min(10, totalForks * 2);

  score = Math.min(100, score);

  const topLanguages = Object.entries(languageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  let contributionPattern = "Inactive";
  if (recentRepos >= 5) contributionPattern = "Highly Active";
  else if (recentRepos >= 3) contributionPattern = "Active";
  else if (recentRepos >= 1) contributionPattern = "Moderate";
  else if (repos.length > 0) contributionPattern = "Low Activity";

  const suggestions = [];
  if (repos.length < 5) suggestions.push("Create more repositories to showcase breadth of skills");
  if (languageDiversity < 2) suggestions.push("Diversify by working with multiple programming languages");
  if (withDescription < repos.length * 0.6) suggestions.push("Add clear descriptions and READMEs to your repositories");
  if (recentRepos === 0) suggestions.push("Commit to recent repositories to show active development");
  if (totalStars === 0 && totalForks === 0) suggestions.push("Focus on projects that solve real problems to attract stars");
  if (languageMap["JavaScript"] === undefined && languageMap["Python"] === undefined) {
    suggestions.push("Consider building projects in popular languages like JavaScript or Python");
  }

  return { score, topLanguages, contributionPattern, suggestions };
}

const ROLE_SKILL_MAP = {
  "Full Stack Developer": {
    foundation: ["HTML", "CSS", "JavaScript", "Git"],
    intermediate: ["React", "Node.js", "Express", "MongoDB"],
    advanced: ["TypeScript", "REST API Design", "Authentication", "Testing"],
    projects: ["E-commerce Platform", "Real-time Chat App", "Portfolio Website"],
  },
  "Data Scientist": {
    foundation: ["Python", "SQL", "Statistics", "Excel"],
    intermediate: ["Pandas", "NumPy", "Scikit-learn", "Data Visualization"],
    advanced: ["Machine Learning", "Deep Learning", "NLP", "Big Data"],
    projects: ["Predictive Analytics Model", "Sentiment Analysis", "Recommendation System"],
  },
  "AI/ML Engineer": {
    foundation: ["Python", "Linear Algebra", "Probability", "Data Structures"],
    intermediate: ["TensorFlow", "PyTorch", "Scikit-learn", "Computer Vision"],
    advanced: ["Transformer Architecture", "Reinforcement Learning", "MLOps", "Edge Deployment"],
    projects: ["Image Classifier", "Chatbot", "Object Detection System"],
  },
  "Frontend Developer": {
    foundation: ["HTML", "CSS", "JavaScript", "Responsive Design"],
    intermediate: ["React", "Redux", "CSS Frameworks", "API Integration"],
    advanced: ["Next.js", "Performance Optimization", "Testing", "Accessibility"],
    projects: ["Interactive Dashboard", "Progressive Web App", "Design System"],
  },
  "Backend Developer": {
    foundation: ["Python or Java", "SQL", "REST APIs", "Git"],
    intermediate: ["Node.js or Spring Boot", "Database Design", "Authentication", "Caching"],
    advanced: ["Microservices", "Message Queues", "Cloud Deployment", "Security"],
    projects: ["REST API Service", "Task Queue System", "File Processing Pipeline"],
  },
  "DevOps Engineer": {
    foundation: ["Linux", "Bash", "Git", "Networking Basics"],
    intermediate: ["Docker", "AWS or Azure", "CI/CD", "Terraform"],
    advanced: ["Kubernetes", "Monitoring", "Security", "Infrastructure as Code"],
    projects: ["Automated Deployment Pipeline", "Container Orchestration", "Monitoring Dashboard"],
  },
  "UI/UX Designer": {
    foundation: ["Design Principles", "Color Theory", "Typography", "Figma"],
    intermediate: ["User Research", "Wireframing", "Prototyping", "Design Systems"],
    advanced: ["Interaction Design", "Motion Design", "Accessibility", "User Testing"],
    projects: ["Mobile App Redesign", "Design System", "E-commerce UX Case Study"],
  },
  "Mobile Developer": {
    foundation: ["JavaScript or Dart", "UI Basics", "Git", "Responsive Design"],
    intermediate: ["React Native or Flutter", "State Management", "API Integration", "Navigation"],
    advanced: ["Performance Optimization", "Offline Support", "Push Notifications", "App Store Deployment"],
    projects: ["Task Manager App", "Social Media Clone", "Weather App"],
  },
};

function generateLearningPath(studentSkills, targetRole) {
  const roleConfig = ROLE_SKILL_MAP[targetRole];
  if (!roleConfig) {
    const defaultPhases = [
      { name: "Foundation", skills: [], duration: "4-6 weeks", resources: [{ name: "Search for role-specific foundations", url: "https://roadmap.sh", type: "guide" }] },
      { name: "Intermediate", skills: [], duration: "6-8 weeks", resources: [{ name: "Explore intermediate topics", url: "https://roadmap.sh", type: "guide" }] },
      { name: "Advanced", skills: [], duration: "8-10 weeks", resources: [{ name: "Advanced concepts", url: "https://roadmap.sh", type: "guide" }] },
      { name: "Projects", skills: [], duration: "4-6 weeks", resources: [{ name: "Build portfolio projects", url: "https://github.com", type: "platform" }] },
    ];
    return { phases: defaultPhases };
  }

  const studentSet = new Set((studentSkills || []).map((s) => s.toLowerCase()));

  const phases = [
    { name: "Foundation", skills: roleConfig.foundation.filter((s) => !studentSet.has(s.toLowerCase())), duration: "4-6 weeks" },
    { name: "Intermediate", skills: roleConfig.intermediate.filter((s) => !studentSet.has(s.toLowerCase())), duration: "6-8 weeks" },
    { name: "Advanced", skills: roleConfig.advanced.filter((s) => !studentSet.has(s.toLowerCase())), duration: "8-10 weeks" },
    { name: "Projects", skills: roleConfig.projects, duration: "4-6 weeks" },
  ];

  const resourceMap = {
    Foundation: (skill) => [
      { name: `Learn ${skill} - freeCodeCamp`, url: "https://freecodecamp.org", type: "course" },
      { name: `${skill} Documentation`, url: "https://developer.mozilla.org", type: "documentation" },
    ],
    Intermediate: (skill) => [
      { name: `${skill} Masterclass - Udemy`, url: "https://udemy.com", type: "course" },
      { name: `${skill} Practice - HackerRank`, url: "https://hackerrank.com", type: "practice" },
    ],
    Advanced: (skill) => [
      { name: `${skill} Advanced Guide`, url: "https://roadmap.sh", type: "guide" },
      { name: `${skill} Open Source Projects`, url: "https://github.com", type: "practice" },
    ],
    Projects: (skill) => [
      { name: `Build: ${skill}`, url: "https://github.com", type: "project" },
      { name: `${skill} Tutorial`, url: "https://youtube.com", type: "video" },
    ],
  };

  for (const phase of phases) {
    phase.resources = [];
    for (const skill of phase.skills) {
      const resources = (resourceMap[phase.name] || resourceMap["Foundation"])(skill);
      phase.resources.push(...resources);
    }
    if (phase.skills.length === 0 && phase.name !== "Projects") {
      phase.skills = [`Review and reinforce ${phase.name.toLowerCase()} concepts`];
      phase.duration = "1-2 weeks";
    }
  }

  return { phases };
}

const INTERVIEW_QUESTION_TEMPLATES = {
  technical: [
    { q: "Can you walk me through how you would design a scalable system for {domain}?", guide: "Discuss architecture choices, technology stack reasoning, and trade-offs. Mention specific technologies from your skill set.", tips: "Use the STAR method. Start with requirements gathering, then move to high-level design." },
    { q: "Explain the difference between {skill1} and {skill2}. When would you use each?", guide: "Provide concrete examples of when each technology is appropriate. Discuss performance, ecosystem, and use-case differences.", tips: "Be balanced - don't bash one technology. Show depth of understanding in both." },
    { q: "How would you debug a performance issue in a {domain} application?", guide: "Outline a systematic approach: profiling, logging, monitoring, database query analysis, caching strategies.", tips: "Mention specific tools you've used. Show methodical thinking." },
    { q: "Describe your experience with {skill}. What challenges did you face?", guide: "Share a specific project or experience. Discuss the challenge, your approach, and the outcome.", tips: "Use metrics if possible. Show problem-solving skills." },
  ],
  behavioral: [
    { q: "Tell me about a time you had to work under a tight deadline. How did you manage it?", guide: "Use STAR: Situation, Task, Action, Result. Focus on prioritization, communication, and delivery.", tips: "Be specific about the deadline and how you met it. Show time management skills." },
    { q: "Describe a situation where you had a disagreement with a team member. How did you resolve it?", guide: "Show emotional intelligence. Focus on listening, finding common ground, and reaching a constructive resolution.", tips: "Emphasize what you learned. Don't speak negatively about the other person." },
    { q: "Give an example of when you learned something new quickly to solve a problem.", guide: "Show your learning process: research, experimentation, seeking help, and applying the knowledge.", tips: "Mention specific resources you used. Show adaptability." },
  ],
  domainSpecific: [
    { q: "What do you think are the biggest challenges facing the {domain} industry right now?", guide: "Discuss current trends, regulatory changes, technological disruption, and market dynamics.", tips: "Show you've researched the company's domain. Connect to the company's work." },
    { q: "How would you approach {domain}-specific problem using {skill}?", guide: "Combine domain knowledge with technical skills. Propose a step-by-step approach.", tips: "Show both domain understanding and technical competence." },
  ],
  problemSolving: [
    { q: "You are given a dataset with millions of records. How would you approach analyzing it for insights?", guide: "Discuss data sampling, tool selection (Python/pandas, SQL), visualization approach, and validation methods.", tips: "Think aloud. Show your analytical process." },
    { q: "If you had to build {domain} feature from scratch in one week, how would you plan it?", guide: "Discuss MVP approach, technology choices, prioritization, testing strategy, and deployment plan.", tips: "Show realistic planning. Mention trade-offs and what you'd cut if needed." },
  ],
  company: [
    { q: "Why are you interested in interning at {company}, and how does this role fit your career goals?", guide: "Research the company beforehand. Connect your skills and interests to their mission and this specific role.", tips: "Be genuine. Mention specific projects or values of the company that resonate with you." },
  ],
};

function interviewPrep(internship, studentProfile) {
  const domain = internship.domain || "technology";
  const company = internship.companyName || "the company";
  const skills = studentProfile.skills || [];
  const interests = studentProfile.interests || [];

  const skill1 = skills[0] || "JavaScript";
  const skill2 = skills[1] || "Python";

  const questions = [];

  const techTemplates = INTERVIEW_QUESTION_TEMPLATES.technical;
  const techQ1 = techTemplates[0].q.replace("{domain}", domain);
  const techQ2 = techTemplates[1].q.replace("{skill1}", skill1).replace("{skill2}", skill2);
  const techQ3 = techTemplates[2].q.replace("{domain}", domain);

  questions.push(
    { question: techQ1, type: "technical", expectedAnswerGuide: techTemplates[0].guide, tips: techTemplates[0].tips },
    { question: techQ2, type: "technical", expectedAnswerGuide: techTemplates[1].guide, tips: techTemplates[1].tips },
    { question: techTemplates[3].q.replace("{skill}", skill1), type: "technical", expectedAnswerGuide: techTemplates[3].guide, tips: techTemplates[3].tips }
  );

  const behTemplates = INTERVIEW_QUESTION_TEMPLATES.behavioral;
  questions.push(
    { question: behTemplates[0].q, type: "behavioral", expectedAnswerGuide: behTemplates[0].guide, tips: behTemplates[0].tips },
    { question: behTemplates[1].q, type: "behavioral", expectedAnswerGuide: behTemplates[1].guide, tips: behTemplates[1].tips }
  );

  const domTemplates = INTERVIEW_QUESTION_TEMPLATES.domainSpecific;
  questions.push(
    { question: domTemplates[0].q.replace("{domain}", domain), type: "domain-specific", expectedAnswerGuide: domTemplates[0].guide, tips: domTemplates[0].tips },
    { question: domTemplates[1].q.replace("{domain}", domain).replace("{skill}", skill1), type: "domain-specific", expectedAnswerGuide: domTemplates[1].guide, tips: domTemplates[1].tips }
  );

  const probTemplates = INTERVIEW_QUESTION_TEMPLATES.problemSolving;
  questions.push(
    { question: probTemplates[0].q, type: "problem-solving", expectedAnswerGuide: probTemplates[0].guide, tips: probTemplates[0].tips },
    { question: probTemplates[1].q.replace("{domain}", domain), type: "problem-solving", expectedAnswerGuide: probTemplates[1].guide, tips: probTemplates[1].tips }
  );

  const compTemplate = INTERVIEW_QUESTION_TEMPLATES.company[0];
  questions.push(
    { question: compTemplate.q.replace("{company}", company), type: "company", expectedAnswerGuide: compTemplate.guide, tips: compTemplate.tips }
  );

  return { questions };
}

const INDIAN_CAREER_PATHS = [
  {
    title: "Software Development Engineer",
    companies: ["TCS", "Infosys", "Wipro", "Google India", "Microsoft India", "Amazon India", "Flipkart", "Razorpay"],
    requiredSkills: ["Java", "Python", "Data Structures", "Algorithms", "System Design"],
    domain: "Software Engineering",
  },
  {
    title: "Data Scientist / ML Engineer",
    companies: ["Fractal Analytics", "Mu Sigma", "Amazon India", "Google India", "Flipkart", "Ola", "Swiggy"],
    requiredSkills: ["Python", "Machine Learning", "SQL", "Statistics", "Deep Learning"],
    domain: "Data Science",
  },
  {
    title: "Full Stack Web Developer",
    companies: ["Razorpay", "Zomato", "PhonePe", "Freshworks", "BrowserStack", "Postman"],
    requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "REST API"],
    domain: "Web Development",
  },
  {
    title: "Cloud / DevOps Engineer",
    companies: ["AWS India", "Microsoft Azure India", "Google Cloud India", "Infosys", "Wipro", "TCS"],
    requiredSkills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform"],
    domain: "Cloud & DevOps",
  },
  {
    title: "Product Manager",
    companies: ["Flipkart", "Paytm", "Zomato", "Ola", "Swiggy", "BYJU'S", "Razorpay"],
    requiredSkills: ["Communication", "Leadership", "Data Analysis", "Project Management", "Market Research"],
    domain: "Product Management",
  },
  {
    title: "UI/UX Designer",
    companies: ["Flipkart", "PhonePe", "Zomato", "Ola", "Freshworks", "Postman"],
    requiredSkills: ["Figma", "UI/UX", "Wireframing", "Prototyping", "User Research"],
    domain: "Design",
  },
  {
    title: "Cybersecurity Analyst",
    companies: ["TCS", "Infosys", "Wipro", "Quick Heal", "CyberArk India", "IBM India"],
    requiredSkills: ["Linux", "Networking", "Python", "Security Analysis", "Penetration Testing"],
    domain: "Cybersecurity",
  },
  {
    title: "Data Analyst / Business Analyst",
    companies: ["Mu Sigma", "Fractal Analytics", "Amazon India", "Flipkart", "Deloitte India", "EY India"],
    requiredSkills: ["SQL", "Excel", "Python", "Data Visualization", "Statistics", "Power BI"],
    domain: "Analytics",
  },
];

function predictCareerPath(studentProfile) {
  const studentSkills = new Set((studentProfile.skills || []).map((s) => s.toLowerCase()));
  const interests = (studentProfile.interests || []).map((i) => i.toLowerCase());
  const cgpa = studentProfile.cgpa || 0;

  const scored = INDIAN_CAREER_PATHS.map((path) => {
    const requiredLower = path.requiredSkills.map((s) => s.toLowerCase());
    const matched = requiredLower.filter((s) => studentSkills.has(s));
    const matchRatio = matched.length / requiredLower.length;

    const interestBonus = interests.some((i) => path.domain.toLowerCase().includes(i) || path.title.toLowerCase().includes(i)) ? 0.15 : 0;
    const gpaBonus = cgpa >= 8.5 ? 0.1 : cgpa >= 7 ? 0.05 : 0;

    const confidence = Math.min(0.95, Math.round((matchRatio * 0.7 + interestBonus + gpaBonus + 0.1) * 100) / 100);

    const missingSkills = requiredLower.filter((s) => !studentSkills.has(s));
    const nextSteps = [];
    if (missingSkills.length > 0) nextSteps.push(`Learn ${missingSkills.slice(0, 3).join(", ")}`);
    nextSteps.push(`Build 2-3 projects in ${path.domain}`);
    nextSteps.push("Apply to internships at target companies");
    if (cgpa < 8) nextSteps.push("Work on improving academic performance");

    const reasoning = matched.length > 0
      ? `Your skills in ${matched.join(", ")} align well with this role. ${missingSkills.length > 0 ? `Building expertise in ${missingSkills.slice(0, 2).join(" and ")} will strengthen your candidacy.` : "You have a strong skill match."}`
      : `This role requires skills you are currently developing. Focused learning can help you transition into this path.`;

    return {
      title: path.title,
      confidence: Math.round(confidence * 100),
      reasoning,
      nextSteps,
      companies: path.companies,
    };
  });

  scored.sort((a, b) => b.confidence - a.confidence);
  return { predictions: scored.slice(0, 3) };
}

module.exports = { computeMatch, recommendInternships, parseResume, suggestCareers, analyzeSkillGap, ALL_SKILLS, SKILL_TAXONOMY, collaborativeFilter, hybridRecommend, generateCoverLetter, analyzeLinkedInProfile, analyzeGitHubProfile, generateLearningPath, interviewPrep, predictCareerPath };
