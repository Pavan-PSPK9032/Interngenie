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
  | "admin-reports"
  | "company-schedule"
  | "auth"
  | "about"
  | "resume-builder"
  | "ats-checker"
  | "interview-prep"
  | "profile-wizard"
  | "voice-assistant"
  | "forgot-password";

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
  role: Role;
  avatarUrl?: string;
  phone?: string;
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
  extractedSkills: string[];
  profileCompleted: number;
  companyId?: string;
  isVerified: boolean;
  isApproved: boolean;
  emailVerified: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "INTERVIEW" | "APPLICATION";
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
