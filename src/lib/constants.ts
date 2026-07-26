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
  { name: "Sneha Patel", role: "Data Science Intern at Flipkart", image: "", quote: "The AI recommendation engine matched me with 12 internships in my dream domain. Got an offer from Flipkart within 2 weeks of applying!", rating: 5 },
  { name: "Rohit Kumar", role: "Full Stack Intern at Razorpay", image: "", quote: "The skill gap analysis was a game-changer. I learned exactly what I needed to crack interviews at top companies.", rating: 5 },
  { name: "Ananya Iyer", role: "UI/UX Intern at Freshworks", image: "", quote: "The chatbot guided me through every step — from resume building to interview tips. Felt like having a personal career coach.", rating: 5 },
  { name: "Vikram Singh", role: "DevOps Intern at Infosys", image: "", quote: "The match percentage feature gave me confidence to apply. The application tracking kept me informed throughout.", rating: 5 },
  { name: "Pooja Nair", role: "ML Research Intern at TCS", image: "", quote: "The resume parser automatically extracted all my skills. Saved hours of manual entry. Brilliant platform!", rating: 5 },
  { name: "Karthik Reddy", role: "Product Intern at CRED", image: "", quote: "From application to certificate, the entire journey was seamless. Got my completion certificate in 12 weeks.", rating: 5 },
];

export const FAQS = [
  { q: "What is the PM Internship Scheme?", a: "The PM Internship Scheme is a Government of India initiative that provides internship opportunities to youth across India, connecting them with top companies for hands-on industry experience and skill development." },
  { q: "How does the AI recommendation engine work?", a: "Our hybrid engine combines content-based filtering (skill cosine similarity), collaborative filtering (Jaccard overlap), location and domain preferences, and stipend/duration heuristics to compute a 0-100 match score for every internship." },
  { q: "Can I apply for internships without uploading a resume?", a: "Yes, but we strongly recommend uploading your resume. Our AI parser automatically extracts your skills, education, projects, and experience." },
  { q: "Is the platform free for students?", a: "Yes, the platform is completely free for students under the PM Internship Scheme." },
  { q: "How long are the internships?", a: "Internships range from 8 to 24 weeks. Most are 12-16 weeks. You can filter by duration in the search page." },
  { q: "Will I get a certificate after completion?", a: "Yes, every completed internship comes with a verified digital certificate that includes your name, the internship title, the company, and the skills you demonstrated." },
  { q: "Can companies hire interns full-time after the internship?", a: "Yes, many companies offer Pre-Placement Offers (PPOs) to top-performing interns." },
  { q: "Does the platform support mobile devices?", a: "Yes, the platform is a Progressive Web App (PWA) — installable on Android and iOS." },
];

export const STATS = [
  { label: "Active Students", value: "1,250,000+", icon: "users" },
  { label: "Partner Companies", value: "12,500+", icon: "building" },
  { label: "Open Internships", value: "45,000+", icon: "briefcase" },
  { label: "Successful Placements", value: "320,000+", icon: "check-circle" },
];
