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

export const TESTIMONIALS = [
  { icon: "target", title: "Personalized recommendations", description: "Every internship is scored against your profile with a transparent, explainable AI match." },
  { icon: "file-text", title: "AI resume analysis", description: "Upload your resume and get a score, extracted skills, and actionable improvements." },
  { icon: "trending-up", title: "Skill gap detection", description: "See exactly which skills you're missing for each role and how to learn them." },
  { icon: "compass", title: "Career guidance", description: "Get interview prep, learning paths, and guidance tailored to your goals." },
  { icon: "clipboard-check", title: "Application tracking", description: "Follow every application from submitted to interview to outcome." },
];

export const FAQS = [
  { q: "What is InternGenie?", a: "InternGenie is an AI-powered platform that helps students discover internships that match their skills and interests, analyze and improve their resumes, and plan their careers step by step." },
  { q: "How does AI internship matching work?", a: "We analyze your resume to extract your skills, education, and experience, then compare your profile against available internships using a transparent weighted score that covers skill similarity, interests, location, and experience." },
  { q: "How is my match score calculated?", a: "Your match score is an AI-generated compatibility estimate. It combines skill similarity, career interests, education, location preference, and experience into a 0-100 score. It is a helpful signal, not a guarantee of success." },
  { q: "Can I upload my resume?", a: "Yes. Upload a PDF resume and our parser automatically extracts your skills, education, projects, experience, and certifications to build your profile and power your recommendations." },
  { q: "Can InternGenie improve my resume?", a: "Yes. Our resume analyzer gives you a score with strengths, weaknesses, and specific suggestions, plus an AI resume builder to rewrite and enhance sections." },
  { q: "How does skill gap analysis work?", a: "For each internship, we compare your skills against the required skills and show you exactly which ones you're missing, along with learning recommendations." },
  { q: "Can I track my applications?", a: "Yes. Your dashboard shows the status of every application, from applied to under review to interview and beyond." },
  { q: "Is InternGenie a government website?", a: "No. InternGenie is an independent AI-powered career platform. It is not an official government website and has no affiliation with the Government of India." },
  { q: "How is my data protected?", a: "Your data is stored securely, passwords are hashed, and private profile information is never exposed publicly. See our privacy policy for details." },
];

export const STATS = [
  { label: "AI Internship Matching", value: "Hybrid", icon: "sparkles" },
  { label: "Resume Analysis", value: "AI-Powered", icon: "file-text" },
  { label: "Skill Gap Detection", value: "Built-in", icon: "trending-up" },
  { label: "Career Guidance", value: "Always Free", icon: "compass" },
];
