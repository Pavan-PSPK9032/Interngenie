// Shared TypeScript types for the Internship Recommendation System

export type Role = "STUDENT" | "COMPANY" | "ADMIN";

export type ViewKey =
  | "home"
  | "internships"
  | "internship-detail"
  | "student-dashboard"
  | "student-profile"
  | "student-applications"
  | "company-dashboard"
  | "company-post-internship"
  | "company-applicants"
  | "admin-dashboard"
  | "admin-companies"
  | "admin-internships"
  | "admin-users"
  | "admin-reports"
  | "company-schedule"
  | "auth"
  | "about"
  | "resume-builder"
  | "ats-checker"
  | "interview-prep"
  | "profile-wizard"
  | "voice-assistant"
  | "forgot-password"
  | "admin-ai-dashboard"
  | "public-profile"
  | "register-resume"
  | "search";

export type ProfileVisibility = "public" | "private" | "recruiters";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type ApplicationStatus =
  | "APPLIED"
  | "REVIEW"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED";

export interface Skill {
  name: string;
  category: "programming" | "data" | "design" | "marketing" | "soft" | "cloud" | "other";
}

export interface Company {
  id: string;
  name: string;
  email: string;
  logoUrl?: string;
  industry?: string;
  description?: string;
  website?: string;
  location?: string;
  size?: string;
  verified: boolean;
  approved: boolean;
  rating: number;
  internshipCount?: number;
}

export interface Internship {
  id: string;
  title: string;
  companyId: string;
  company?: Company;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  domain: string;
  location: string;
  workMode: WorkMode;
  duration: number; // weeks
  stipend: number; // INR / month
  openings: number;
  deadline?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  internshipId: string;
  internship?: Internship;
  studentId: string;
  status: ApplicationStatus;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  coverLetter?: string;
  interviewScheduledAt?: string;
  feedback?: string;
  createdAt: string;
  // Tracking timeline weeks
  currentWeek?: number;
  totalWeeks?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: Role;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerPosition?: string;
  headline?: string;
  location?: string;
  phone?: string;
  address?: string;
  college?: string;
  degree?: string;
  branch?: string;
  cgpa?: number;
  graduationYear?: number;
  skills: string[];
  interests: string[];
  preferredLocations: string[];
  languages: string[];
  linkedin?: string;
  github?: string;
  portfolio?: string;
  resumeUrl?: string;
  resumeText?: string;
  resumeData?: unknown;
  extractedSkills: string[];
  profileCompleted: number;
  companyId?: string;
  isVerified: boolean;
  isApproved: boolean;
  emailVerified: boolean;
  dob?: string;
  gender?: string;
  careerObjective?: string;
  projects?: Array<Record<string, unknown>>;
  experience?: Array<Record<string, unknown>>;
  certifications?: Array<Record<string, unknown>>;
  courses?: Array<Record<string, unknown>>;
  achievements?: string[];
  profileViews?: number;
  searchAppearances?: number;
  privacySettings?: {
    visibility: ProfileVisibility;
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
    showLinkedIn: boolean;
    showGitHub: boolean;
    showPortfolio: boolean;
    showCertificates: boolean;
    showProjects: boolean;
    showExperience: boolean;
    showAtsScore: boolean;
    showResume: boolean;
  };
}

export interface ProfileBadge {
  name: string;
  icon: string;
}

export interface ProfileStats {
  profileViews: number;
  searchAppearances: number;
  followersCount: number;
  followingCount: number;
  applications: number;
  completedInternships: number;
  certificates: number;
  projects: number;
  atsScore: number | null;
  profileCompleted: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "INTERVIEW" | "APPLICATION" | "RESUME" | "ATS" | "CERTIFICATE";
  read: boolean;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  studentName: string;
  issueDate: string;
  certificateId: string;
  skills: string[];
}

export interface ChatMessage {
  id: string;
  userId?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface MatchResult {
  internshipId: string;
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

// ─── AI Recommendation Engine Types ──────────────────────────
export interface StudentProfile {
  skills: string[];
  interests: string[];
  preferredLocations: string[];
  cgpa?: number;
  domainHistory?: string[];
}

export interface InternshipFeatures {
  id: string;
  skills: string[];
  domain: string;
  location: string;
  workMode: WorkMode;
  stipend: number;
  duration: number;
}

// ─── Resume Builder Types ─────────────────────────────────────
export interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin: string;
    github: string;
    portfolio: string;
    careerObjective: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    branch: string;
    cgpa: number;
    startYear: number;
    endYear: number;
    isCurrently: boolean;
  }>;
  skills: Array<{
    name: string;
    category: string;
    proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    url: string;
    startDate: string;
    endDate: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    description: string;
    startDate: string;
    endDate: string;
    isCurrently: boolean;
    highlights: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    url: string;
  }>;
  languages: Array<{
    name: string;
    proficiency: "Native" | "Fluent" | "Intermediate" | "Beginner";
  }>;
  additional: {
    achievements: string;
    hobbies: string;
    strengths: string;
    references: Array<{
      name: string;
      title: string;
      email: string;
      phone: string;
    }>;
  };
}

export interface ParsedResume {
  personal: { name: string; email: string; phone: string; address: string; linkedin: string; github: string; portfolio?: string; dob?: string; gender?: string; };
  education: Array<{ institution: string; degree: string; branch: string; cgpa: number; startYear: number; endYear: number; }>;
  skills: Array<{ name: string; category: string; }>;
  softSkills?: Array<{ name: string; category: string; }>;
  projects: Array<{ title: string; description: string; technologies: string[]; }>;
  experience: Array<{ company: string; role: string; description: string; startDate: string; endDate: string; }>;
  certifications: Array<{ name: string; issuer: string; date: string; }>;
  languages: Array<{ name: string; proficiency: string; }>;
  achievements: string[];
  interests?: string[];
  courses?: Array<{ name: string; platform: string; date: string; }>;
  summary: string;
}

export interface SearchResult {
  students: Array<{
    id: string;
    name: string;
    username?: string;
    avatarUrl: string;
    email: string;
    college: string;
    branch: string;
    degree: string;
    headline?: string;
    skills: string[];
    graduationYear: number;
    profileCompleted: number;
    atsScore: number | null;
    atsGrade?: string;
    followersCount: number;
    status: string;
  }>;
  companies: Array<{
    id: string;
    name: string;
    logoUrl: string;
    industry: string;
    location: string;
    description: string;
  }>;
  internships: Array<{
    id: string;
    title: string;
    domain: string;
    location: string;
    company: string;
    companyId: string;
    skills: string[];
    stipend: number;
    workMode: string;
  }>;
  skills: Array<{ name: string; count: number }>;
  colleges: Array<{ name: string; count: number }>;
  certificates: Array<{
    id: string;
    name: string;
    organization: string;
    category: string;
    issueDate?: string;
    userId?: string;
  }>;
}

export type SearchFilter =
  | "all"
  | "people"
  | "companies"
  | "internships"
  | "skills"
  | "colleges"
  | "certificates";

export type SearchSort = "relevance" | "newest";

export interface PublicProfile {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string;
  bannerUrl?: string;
  bannerPosition?: string;
  headline?: string;
  college: string;
  branch: string;
  degree: string;
  graduationYear: number;
  location?: string;
  cgpa: number;
  skills: string[];
  summary: string;
  interests: string[];
  achievements: string[];
  languages: string[];
  profileCompleted: number;
  profileViews: number;
  searchAppearances: number;
  followersCount: number;
  followingCount: number;
  applicationsCount: number;
  certificatesCount: number;
  isFollowing?: boolean;
  badges?: Array<{ name: string; icon: string }>;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  projects?: Array<Record<string, unknown>>;
  experience?: Array<Record<string, unknown>>;
  certificates?: Array<{
    id: string;
    name: string;
    organization: string;
    category: string;
    issueDate: string;
    credentialId: string;
    verificationLink: string;
    fileUrl: string;
    fileType: string;
    description: string;
  }>;
  atsScore?: number;
  atsGrade?: string;
  completedInternships: number;
  completedInternshipDetails?: Array<{ title: string; companyId: string }>;
}

export interface ProfileCompleteness {
  score: number;
  suggestions: Array<{ label: string; missing?: boolean; done?: boolean }>;
  stats: {
    skills: number;
    projects: number;
    experience: number;
    certificates: number;
    certifications: number;
  };
}

export interface ATSBreakdown {
  formatting: { score: number; max: number; details: string; };
  keywords: { score: number; max: number; details: string; };
  skills: { score: number; max: number; details: string; };
  experience: { score: number; max: number; details: string; };
  education: { score: number; max: number; details: string; };
  grammar: { score: number; max: number; details: string; };
  projects: { score: number; max: number; details: string; };
  summary: { score: number; max: number; details: string; };
}

export interface AIImprovement {
  type: "missing_summary" | "missing_keywords" | "weak_project" | "grammar" | "missing_skills" | "bullet_point";
  title: string;
  current?: string;
  suggested: string;
  keywords?: string[];
  accepted?: boolean;
}

export interface ATSReport {
  score: number;
  grade: string;
  breakdown: Record<string, { score: number; max: number; details: string }>;
  missingKeywords: string[];
  suggestedSkills: string[];
  improvements: string[];
  bulletPointSuggestions: string[];
  summarySuggestion: string;
}

export interface InterviewQuestion {
  question: string;
  type: string;
  expectedAnswerGuide: string;
  tips: string;
}
