"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Loader2, ArrowRight, CheckCircle2,
  XCircle, User as UserIcon, Eye, EyeOff, GraduationCap,
  MapPin, Phone, Linkedin, Github, Globe, Calendar,
  Save, ChevronLeft, Zap, Target,
} from "lucide-react";
import { useState, useRef } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExtractedInfo {
  personal: { name: string; email: string; phone: string; address: string; linkedin: string; github: string; portfolio: string; dob: string; gender: string; };
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

export function RegisterResume() {
  const { login, navigate, pushToast } = useApp();
  const [step, setStep] = useState<"choose" | "upload" | "review">("choose");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [parsed, setParsed] = useState<ExtractedInfo | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    linkedin: "",
    github: "",
    portfolio: "",
    dob: "",
    gender: "",
    college: "",
    degree: "",
    branch: "",
    cgpa: "",
    graduationYear: "",
    careerObjective: "",
    skills: "",
    summary: "",
  });

  const [extraFields, setExtraFields] = useState({
    preferredLocation: "",
    expectedStipend: "",
    workMode: "remote",
  });

  const applyParsed = (p: ExtractedInfo) => {
    const personal = p.personal || {};
    const edu = p.education?.[0] || {};
    const allSkills = [...(p.skills || []).map((s) => s.name), ...(p.softSkills || []).map((s) => s.name)];
    setForm((f) => ({
      ...f,
      name: personal.name || f.name,
      email: personal.email || f.email,
      phone: personal.phone || f.phone,
      address: personal.address || f.address,
      linkedin: personal.linkedin || f.linkedin,
      github: personal.github || f.github,
      portfolio: personal.portfolio || f.portfolio,
      dob: personal.dob || f.dob,
      gender: personal.gender || f.gender,
      college: edu.institution || f.college,
      degree: edu.degree || f.degree,
      branch: edu.branch || f.branch,
      cgpa: edu.cgpa ? String(edu.cgpa) : f.cgpa,
      graduationYear: edu.endYear ? String(edu.endYear) : f.graduationYear,
      careerObjective: p.summary || f.careerObjective,
      skills: allSkills.length ? allSkills.join(", ") : f.skills,
    }));
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      pushToast({ title: "Unsupported format", message: "Use PDF, DOCX, or TXT", type: "error" });
      return;
    }
    setExtracting(true);
    try {
      if (ext === "txt") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          await uploadAndParse(text, "", file.name);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          await uploadAndParse("", ext!, file.name, base64);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      pushToast({ title: "Parse failed", message: "Could not read file", type: "error" });
      setExtracting(false);
    }
  };

  const uploadAndParse = async (text: string, type: string, fileName?: string, fileBase64?: string) => {
    try {
      const body: Record<string, string> = {};
      if (text) body.text = text;
      if (type) body.type = type;
      if (fileName) body.fileName = fileName;
      if (fileBase64) body.fileBase64 = fileBase64;

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        setParsed(data.parsed as ExtractedInfo);
        setResumeText(data.resumeText || text);
        applyParsed(data.parsed as ExtractedInfo);
        setStep("review");
        pushToast({ title: "Resume parsed successfully", type: "success" });
      } else {
        pushToast({ title: "Parse error", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const missingFields = () => {
    const missing: string[] = [];
    if (!form.email.trim()) missing.push("Email");
    if (!form.name.trim()) missing.push("Full Name");
    if (!form.password) missing.push("Password");
    if (!form.phone.trim()) missing.push("Phone Number");
    if (!form.college.trim()) missing.push("College");
    if (!form.degree.trim()) missing.push("Degree");
    if (!form.branch.trim()) missing.push("Branch");
    if (!form.skills.trim()) missing.push("Skills");
    return missing;
  };

  const extractionPercent = () => {
    const fields = [
      form.name, form.email, form.phone, form.address, form.linkedin, form.github,
      form.portfolio, form.college, form.degree, form.branch, form.cgpa,
      form.graduationYear, form.skills, form.careerObjective,
    ];
    const filled = fields.filter((f) => f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.password) {
      pushToast({ title: "Missing required fields", message: "Email, name, and password are required", type: "error" });
      return;
    }
    if (form.password.length < 6) {
      pushToast({ title: "Password too short", message: "Use at least 6 characters", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const base = parsed || {
        personal: {} as ExtractedInfo["personal"],
        education: [] as ExtractedInfo["education"],
        skills: [] as ExtractedInfo["skills"],
        softSkills: [] as ExtractedInfo["softSkills"],
        projects: [] as ExtractedInfo["projects"],
        experience: [] as ExtractedInfo["experience"],
        certifications: [] as ExtractedInfo["certifications"],
        languages: [] as ExtractedInfo["languages"],
        achievements: [] as ExtractedInfo["achievements"],
        interests: [] as ExtractedInfo["interests"],
        courses: [] as ExtractedInfo["courses"],
        summary: "",
      };

      const finalResumeData = {
        ...base,
        personal: {
          ...(base.personal || {}),
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          linkedin: form.linkedin,
          github: form.github,
          portfolio: form.portfolio,
          dob: form.dob,
          gender: form.gender,
        },
        education:
          form.college || form.degree
            ? [
                {
                  institution: form.college,
                  degree: form.degree,
                  branch: form.branch,
                  cgpa: parseFloat(form.cgpa) || 0,
                  startYear: base.education?.[0]?.startYear || 0,
                  endYear: parseInt(form.graduationYear) || base.education?.[0]?.endYear || 0,
                },
              ]
            : base.education || [],
        skills:
          form.skills.trim().length > 0
            ? form.skills.split(",").map((s) => ({ name: s.trim(), category: "other" })).filter((s) => s.name)
            : base.skills || [],
        summary: form.careerObjective || base.summary || "",
      };

      const res = await fetch("/api/auth/register/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          resumeData: finalResumeData,
          password: form.password,
          additionalFields: {
            email: form.email,
            name: form.name,
            preferredLocation: extraFields.preferredLocation,
            expectedStipend: extraFields.expectedStipend,
            workMode: extraFields.workMode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ title: "Registration failed", message: data.error, type: "error" });
        return;
      }
      login(data.user, data.token);
      pushToast({ title: "Account created!", message: `Welcome, ${data.user.name}!`, type: "success" });
    } catch {
      pushToast({ title: "Error", message: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-8">
        <button
          onClick={() => navigate("auth")}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to login
        </button>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register in seconds — upload your resume and we'll do the rest
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Option 1: Google */}
            <Card className="glass-strong overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
              onClick={() => navigate("auth")}>
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Continue with Google</p>
                  <p className="text-sm text-muted-foreground">Use your Google account for instant sign-up</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Option 2: Resume */}
            <Card className="glass-strong overflow-hidden border-primary/30 cursor-pointer hover:border-primary transition-all group"
              onClick={() => setStep("upload")}>
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl gradient-emerald flex items-center justify-center shrink-0 shadow-glow group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Register using Resume</p>
                  <p className="text-sm text-muted-foreground">
                    Upload your resume — we'll auto-fill your profile with AI
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Card className="glass-strong overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
              onClick={() => navigate("auth")}>
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Sign up manually</p>
                  <p className="text-sm text-muted-foreground">Use email and password (standard form)</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep("choose")}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300",
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              {extracting ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Extracting your resume...</p>
                  <p className="text-xs text-muted-foreground">AI is reading every detail</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop your resume here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT</p>
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                className="hidden"
              />
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Your resume data stays private. You'll review everything before creating your account.
            </p>
          </motion.div>
        )}

        {step === "review" && parsed && (
          <motion.form
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={submit}
            className="space-y-5"
          >
            {/* Extraction summary */}
            <Card className="glass-strong">
              <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Resume Uploaded Successfully</p>
                    <p className="text-xs text-muted-foreground">{extractionPercent()}% Information Extracted</p>
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="w-28 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${extractionPercent()}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full gradient-emerald rounded-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary" /> Personal Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full Name *" value={form.name} onChange={(v) => update("name", v)} required />
                  <Field label="Email *" value={form.email} onChange={(v) => update("email", v)} required type="email" />
                  <Field label="Password *" value={form.password} onChange={(v) => update("password", v)} required type={showPwd ? "text" : "password"}
                    icon={
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} icon={<Phone className="w-3.5 h-3.5" />} />
                  <Field label="Address" value={form.address} onChange={(v) => update("address", v)} icon={<MapPin className="w-3.5 h-3.5" />} />
                  <Field label="LinkedIn" value={form.linkedin} onChange={(v) => update("linkedin", v)} icon={<Linkedin className="w-3.5 h-3.5" />} />
                  <Field label="GitHub" value={form.github} onChange={(v) => update("github", v)} icon={<Github className="w-3.5 h-3.5" />} />
                  <Field label="Portfolio" value={form.portfolio} onChange={(v) => update("portfolio", v)} icon={<Globe className="w-3.5 h-3.5" />} />
                  <Field label="Date of Birth" value={form.dob} onChange={(v) => update("dob", v)} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <Field label="Gender" value={form.gender} onChange={(v) => update("gender", v)} />
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Education
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="College / University" value={form.college} onChange={(v) => update("college", v)} />
                  <Field label="Degree" value={form.degree} onChange={(v) => update("degree", v)} />
                  <Field label="Branch" value={form.branch} onChange={(v) => update("branch", v)} />
                  <Field label="CGPA" value={form.cgpa} onChange={(v) => update("cgpa", v)} />
                  <Field label="Graduation Year" value={form.graduationYear} onChange={(v) => update("graduationYear", v)} />
                </div>
              </CardContent>
            </Card>

            {/* Skills & Objective */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Skills & Career
                </h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Zap className="w-3 h-3" /> Skills</Label>
                    <Input value={form.skills} onChange={(e) => update("skills", e.target.value)} placeholder="React, Node.js, Python, ..." className="h-9 text-sm" />
                    {parsed.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsed.skills.slice(0, 12).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[11px]">{s.name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Career Objective</Label>
                    <Textarea
                      value={form.careerObjective}
                      onChange={(e) => update("careerObjective", e.target.value)}
                      placeholder="Seeking an internship in..."
                      className="min-h-[60px] resize-none text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing info */}
            <Card className="border-amber-500/30">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Target className="w-4 h-4" /> Missing Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Preferred Location" value={extraFields.preferredLocation} onChange={(v) => setExtraFields((e) => ({ ...e, preferredLocation: v }))} placeholder="e.g., Hyderabad" />
                  <Field label="Expected Stipend" value={extraFields.expectedStipend} onChange={(v) => setExtraFields((e) => ({ ...e, expectedStipend: v }))} placeholder="e.g., 20000" />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Work Mode</Label>
                    <div className="flex gap-1.5">
                      {["remote", "hybrid", "onsite"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setExtraFields((e) => ({ ...e, workMode: m }))}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize",
                            extraFields.workMode === m ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing required fields warning */}
            {missingFields().length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" /> Missing required fields
                </p>
                <p className="text-xs text-muted-foreground mt-1">{missingFields().join(", ")}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep("upload")} className="gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Re-upload
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 gradient-emerald text-white gap-2 shadow-glow h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? "Creating account..." : "Finish Registration"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1 text-muted-foreground">
        {icon} {label}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} className="h-9 text-sm" required={required} />
    </div>
  );
}
