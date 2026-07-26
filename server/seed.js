require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required. Add it to server/.env");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["STUDENT", "COMPANY", "ADMIN"], default: "STUDENT" },
  phone: String, college: String, degree: String, branch: String,
  cgpa: Number, graduationYear: Number,
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  preferredLocations: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  linkedin: String, github: String, portfolio: String,
  extractedSkills: { type: [String], default: [] },
  profileCompleted: { type: Number, default: 0 },
  companyId: String,
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
}, { timestamps: true });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  industry: String, description: String, website: String, location: String, size: String,
  verified: { type: Boolean, default: false },
  approved: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0 },
}, { timestamps: true });

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyId: { type: String, required: true },
  description: { type: String, required: true },
  responsibilities: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  domain: { type: String, required: true },
  location: { type: String, required: true },
  workMode: { type: String, enum: ["remote", "hybrid", "onsite"], default: "onsite" },
  duration: { type: Number, required: true },
  stipend: { type: Number, default: 0 },
  openings: { type: Number, default: 1 },
  deadline: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "INFO" },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Company = mongoose.model("Company", companySchema);
const Internship = mongoose.model("Internship", internshipSchema);
const Notification = mongoose.model("Notification", notificationSchema);

const COMPANIES = [
  { _id: "co_tcs", name: "Tata Consultancy Services", email: "careers@tcs.com", industry: "IT Services", description: "TCS is an IT services, consulting and business solutions organization.", website: "https://tcs.com", location: "Mumbai, India", size: "enterprise", verified: true, approved: true, rating: 4.2 },
  { _id: "co_infosys", name: "Infosys", email: "talent@infosys.com", industry: "IT Services", description: "Infosys is a global leader in next-generation digital services.", website: "https://infosys.com", location: "Bengaluru, India", size: "enterprise", verified: true, approved: true, rating: 4.1 },
  { _id: "co_flipkart", name: "Flipkart", email: "interns@flipkart.com", industry: "E-commerce", description: "India's leading e-commerce marketplace.", website: "https://flipkart.com", location: "Bengaluru, India", size: "large", verified: true, approved: true, rating: 4.3 },
  { _id: "co_zoho", name: "Zoho Corporation", email: "careers@zoho.com", industry: "SaaS", description: "Zoho offers beautifully smart software.", website: "https://zoho.com", location: "Chennai, India", size: "large", verified: true, approved: true, rating: 4.4 },
  { _id: "co_razorpay", name: "Razorpay", email: "talent@razorpay.com", industry: "Fintech", description: "India's only full-stack payments solution.", website: "https://razorpay.com", location: "Bengaluru, India", size: "medium", verified: true, approved: true, rating: 4.5 },
  { _id: "co_swiggy", name: "Swiggy", email: "careers@swiggy.com", industry: "Food Tech", description: "India's leading on-demand food delivery platform.", website: "https://swiggy.com", location: "Bengaluru, India", size: "large", verified: true, approved: true, rating: 4.2 },
  { _id: "co_zomato", name: "Zomato", email: "talent@zomato.com", industry: "Food Tech", description: "Ensuring nobody has a bad meal.", website: "https://zomato.com", location: "Gurugram, India", size: "large", verified: true, approved: true, rating: 4.1 },
  { _id: "co_paytm", name: "Paytm", email: "talent@paytm.com", industry: "Fintech", description: "India's largest digital payment platform.", website: "https://paytm.com", location: "Noida, India", size: "large", verified: true, approved: true, rating: 4.0 },
  { _id: "co_freshworks", name: "Freshworks", email: "careers@freshworks.com", industry: "SaaS", description: "AI-boosted software for customer service.", website: "https://freshworks.com", location: "Chennai, India", size: "medium", verified: true, approved: true, rating: 4.3 },
  { _id: "co_phonepe", name: "PhonePe", email: "talent@phonepe.com", industry: "Fintech", description: "India's leading digital payments platform.", website: "https://phonepe.com", location: "Bengaluru, India", size: "large", verified: true, approved: true, rating: 4.4 },
  { _id: "co_cred", name: "CRED", email: "talent@cred.club", industry: "Fintech", description: "Members-only club for credit card bill payments.", website: "https://cred.club", location: "Bengaluru, India", size: "medium", verified: true, approved: true, rating: 4.5 },
  { _id: "co_byjus", name: "BYJU'S", email: "careers@byjus.com", industry: "EdTech", description: "World's most valuable ed-tech company.", website: "https://byjus.com", location: "Bengaluru, India", size: "large", verified: true, approved: true, rating: 3.8 },
];

const INTERNSHIPS = [
  { _id: "in_001", title: "Data Science Intern", companyId: "co_flipkart", description: "Build ML models for personalized shopping experiences.", responsibilities: ["Build and deploy ML models", "Analyze customer behavior datasets", "Develop NLP pipelines"], requirements: ["B.Tech/M.Tech in CS", "Python and SQL"], skills: ["Python", "SQL", "Machine Learning", "Pandas", "NumPy", "Scikit-learn"], domain: "Data Science", location: "Bengaluru, India", workMode: "onsite", duration: 12, stipend: 35000, openings: 5 },
  { _id: "in_002", title: "Full Stack Developer Intern", companyId: "co_razorpay", description: "Build the future of digital payments.", responsibilities: ["Develop merchant dashboard features", "Build RESTful APIs"], requirements: ["JavaScript/TypeScript", "React and Node.js"], skills: ["React", "Node.js", "JavaScript", "TypeScript", "PostgreSQL", "REST"], domain: "Web Development", location: "Bengaluru, India", workMode: "hybrid", duration: 16, stipend: 40000, openings: 3 },
  { _id: "in_003", title: "AI/ML Research Intern", companyId: "co_tcs", description: "Cutting-edge research in NLP, computer vision, and LLMs.", responsibilities: ["Conduct literature surveys", "Prototype ML models"], requirements: ["B.Tech/M.Tech in CS/AI", "Python and ML"], skills: ["Python", "PyTorch", "TensorFlow", "NLP", "Deep Learning", "Machine Learning"], domain: "Artificial Intelligence", location: "Hyderabad, India", workMode: "onsite", duration: 24, stipend: 30000, openings: 4 },
  { _id: "in_004", title: "Frontend Engineer Intern", companyId: "co_zoho", description: "Build delightful UI for Zoho's business applications.", responsibilities: ["Build responsive UI components", "Optimize performance"], requirements: ["HTML, CSS, JavaScript", "React"], skills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind"], domain: "Web Development", location: "Chennai, India", workMode: "onsite", duration: 12, stipend: 25000, openings: 6 },
  { _id: "in_005", title: "Cloud DevOps Engineer Intern", companyId: "co_infosys", description: "Help enterprise clients migrate to AWS and Azure.", responsibilities: ["Build CI/CD pipelines", "Provision infrastructure"], requirements: ["Linux knowledge", "AWS familiarity"], skills: ["AWS", "Docker", "Kubernetes", "Linux", "Terraform", "CI/CD"], domain: "DevOps", location: "Pune, India", workMode: "hybrid", duration: 16, stipend: 28000, openings: 8 },
  { _id: "in_006", title: "UI/UX Design Intern", companyId: "co_freshworks", description: "Design user-friendly experiences for Freshworks products.", responsibilities: ["Conduct user research", "Create wireframes and prototypes"], requirements: ["Figma proficiency", "UX principles"], skills: ["Figma", "UI/UX", "Wireframing", "Prototyping", "Photoshop"], domain: "Design", location: "Chennai, India", workMode: "hybrid", duration: 12, stipend: 22000, openings: 3 },
  { _id: "in_007", title: "Backend Engineer Intern", companyId: "co_swiggy", description: "Scale order management and delivery allocation systems.", responsibilities: ["Build scalable backend services", "Optimize database performance"], requirements: ["Programming fundamentals", "Go, Java, or Node.js"], skills: ["Go", "Java", "Node.js", "PostgreSQL", "Redis", "Microservices"], domain: "Backend Development", location: "Bengaluru, India", workMode: "onsite", duration: 16, stipend: 35000, openings: 4 },
  { _id: "in_008", title: "Digital Marketing Intern", companyId: "co_zomato", description: "Drive growth through creative marketing campaigns.", responsibilities: ["Create social media content", "Run ad campaigns"], requirements: ["Passion for marketing", "Written communication"], skills: ["SEO", "Google Ads", "Content Marketing", "Social Media", "Analytics"], domain: "Marketing", location: "Gurugram, India", workMode: "hybrid", duration: 12, stipend: 18000, openings: 5 },
  { _id: "in_009", title: "Data Analyst Intern", companyId: "co_paytm", description: "Turn raw data into actionable insights.", responsibilities: ["Build dashboards in Power BI", "Write SQL queries"], requirements: ["Strong SQL skills", "Excel and Power BI"], skills: ["SQL", "Power BI", "Tableau", "Excel", "Python", "Data Analysis"], domain: "Data Analytics", location: "Noida, India", workMode: "onsite", duration: 12, stipend: 24000, openings: 6 },
  { _id: "in_010", title: "Mobile App Developer Intern", companyId: "co_phonepe", description: "Build the next generation Android app for 400M+ users.", responsibilities: ["Develop features in Kotlin", "Work with Jetpack Compose"], requirements: ["Kotlin or Java skills", "Android architecture"], skills: ["Kotlin", "Java", "Android", "REST", "UI/UX"], domain: "Mobile Development", location: "Bengaluru, India", workMode: "hybrid", duration: 16, stipend: 30000, openings: 4 },
  { _id: "in_011", title: "Product Management Intern", companyId: "co_cred", description: "Drive product strategy and execution.", responsibilities: ["Conduct user research", "Define product requirements"], requirements: ["Analytical skills", "Product metrics"], skills: ["Communication", "Analytics", "Project Management", "SQL"], domain: "Product Management", location: "Bengaluru, India", workMode: "onsite", duration: 12, stipend: 45000, openings: 2 },
  { _id: "in_012", title: "Cybersecurity Intern", companyId: "co_tcs", description: "Help enterprises detect and prevent security threats.", responsibilities: ["Monitor security events", "Perform vulnerability assessments"], requirements: ["Network security fundamentals", "Linux"], skills: ["Linux", "Python", "Bash", "Networking", "AWS"], domain: "Cybersecurity", location: "Hyderabad, India", workMode: "remote", duration: 12, stipend: 26000, openings: 5 },
];

const NOTIFICATIONS = [
  { _id: "n_001", userId: "DEMO_STUDENT", title: "New internship match!", message: "Data Science Intern at Flipkart - 92% match.", type: "INFO" },
  { _id: "n_002", userId: "DEMO_STUDENT", title: "Application under review", message: "Your AI/ML Research Intern application at TCS is under review.", type: "APPLICATION" },
  { _id: "n_003", userId: "DEMO_STUDENT", title: "Interview scheduled", message: "Full Stack Developer Intern at Razorpay interview scheduled.", type: "INTERVIEW" },
  { _id: "n_004", userId: "DEMO_STUDENT", title: "Profile 85% complete", message: "Add GitHub projects to boost to 100%.", type: "WARNING" },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected. Seeding...");

  await Company.deleteMany({});
  await Company.insertMany(COMPANIES);
  console.log(`Seeded ${COMPANIES.length} companies`);

  await Internship.deleteMany({});
  await Internship.insertMany(INTERNSHIPS);
  console.log(`Seeded ${INTERNSHIPS.length} internships`);

  await User.deleteMany({});
  const hash = bcrypt.hashSync("student123", 10);
  const companyHash = bcrypt.hashSync("company123", 10);
  const adminHash = bcrypt.hashSync("admin123", 10);

  const student = await User.create({
    _id: "DEMO_STUDENT", email: "arjun.sharma@student.edu", passwordHash: hash,
    name: "Arjun Sharma", role: "STUDENT", phone: "+91 98765 43210",
    college: "Indian Institute of Technology, Madras", degree: "B.Tech",
    branch: "Computer Science Engineering", cgpa: 8.7, graduationYear: 2027,
    skills: ["Python", "JavaScript", "React", "Node.js", "SQL", "Machine Learning", "Pandas", "NumPy"],
    interests: ["Data Science", "Web Development", "Artificial Intelligence"],
    preferredLocations: ["Bengaluru", "Remote", "Hyderabad"],
    languages: ["English", "Hindi", "Telugu"],
    linkedin: "https://linkedin.com/in/arjun-sharma", github: "https://github.com/arjun-sharma",
    portfolio: "https://arjun.dev", extractedSkills: ["Python", "JavaScript", "React", "Node.js"],
    profileCompleted: 85, isVerified: true, isApproved: true, emailVerified: true,
  });

  await User.create({
    _id: "DEMO_COMPANY", email: "hr@flipkart.com", passwordHash: companyHash,
    name: "Priya Reddy", role: "COMPANY", companyId: "co_flipkart",
    profileCompleted: 100, isVerified: true, isApproved: true, emailVerified: true,
  });

  await User.create({
    _id: "DEMO_ADMIN", email: "admin@pm-internship.gov.in", passwordHash: adminHash,
    name: "System Administrator", role: "ADMIN",
    profileCompleted: 100, isVerified: true, isApproved: true, emailVerified: true,
  });
  console.log("Seeded 3 demo users");

  await Notification.deleteMany({});
  NOTIFICATIONS[0].userId = student._id.toString();
  NOTIFICATIONS[1].userId = student._id.toString();
  NOTIFICATIONS[2].userId = student._id.toString();
  NOTIFICATIONS[3].userId = student._id.toString();
  await Notification.insertMany(NOTIFICATIONS);
  console.log(`Seeded ${NOTIFICATIONS.length} notifications`);

  console.log("Seeding complete!");
  await mongoose.disconnect();
}

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });
