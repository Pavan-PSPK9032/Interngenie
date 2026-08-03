"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, ArrowRight, CheckCircle2, User as UserIcon,
  Eye, EyeOff, GraduationCap, MapPin, Phone, Linkedin, Github,
  Globe, Calendar, Save, ChevronLeft, Zap, Target, Sparkles, Plus,
  Trash2, Briefcase, FolderGit2, Award, BookOpen, Languages as LanguagesIcon,
  Heart, Trophy, Lock, BadgeCheck, FileText,
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

interface EditableState {
  personal: {
    name: string; email: string; phone: string; address: string;
    linkedin: string; github: string; portfolio: string; dob: string; gender: string;
  };
  education: { institution: string; degree: string; branch: string; cgpa: string; endYear: string };
  skills: string;
  softSkills: string[];
  summary: string;
  projects: Array<{ title: string; description: string; technologies: string }>;
  experience: Array<{ company: string; role: string; description: string }>;
  certifications: Array<{ name: string; issuer: string; date: string }>;
  courses: Array<{ name: string; platform: string; date: string }>;
  languages: string;
  interests: string;
  achievements: string;
}

export function RegisterResume() {
  const { login, navigate, pushToast } = useApp();
  const [step, setStep] = useState<"basic" | "review">("basic");
  const [basic, setBasic] = useState({ name: "", phone: "" });
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ExtractedInfo | null>(null);
  const [editable, setEditable] = useState<EditableState | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      pushToast({ title: "Unsupported format", message: "Use PDF, DOC, DOCX, or TXT", type: "error" });
      return;
    }
    setFile(f);
    setFileName(f.name);
  };

  const readAndParse = async () => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    setExtracting(true);
    try {
      if (ext === "txt") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          await uploadAndParse(text, file.name);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          await uploadAndParse("", file.name, base64);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      pushToast({ title: "Parse failed", message: "Could not read file", type: "error" });
      setExtracting(false);
    }
  };

  const uploadAndParse = async (text: string, fileNameArg?: string, fileBase64?: string) => {
    try {
      const body: Record<string, string> = {};
      if (text) body.text = text;
      if (fileNameArg) body.fileName = fileNameArg;
      if (fileBase64) body.fileBase64 = fileBase64;

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        const p = data.parsed as ExtractedInfo;
        setParsed(p);
        setResumeText(data.resumeText || text);
        setEditable(initEditable(p, basic));
        setStep("review");
        pushToast({ title: "Resume parsed", message: "AI extracted your details — review & edit below", type: "success" });
      } else {
        pushToast({ title: "Parse error", message: data.error, type: "error" });
        setFile(null);
        setFileName("");
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
      setFile(null);
      setFileName("");
    } finally {
      setExtracting(false);
    }
  };

  const initEditable = (p: ExtractedInfo, b: { name: string; phone: string }): EditableState => {
    const personal = p.personal || {};
    const edu = p.education?.[0];
    const soft = (p.softSkills || []).map((s) => s.name);
    return {
      personal: {
        name: b.name || personal.name || "",
        email: personal.email || "",
        phone: b.phone || personal.phone || "",
        address: personal.address || "",
        linkedin: personal.linkedin || "",
        github: personal.github || "",
        portfolio: personal.portfolio || "",
        dob: personal.dob || "",
        gender: personal.gender || "",
      },
      education: {
        institution: edu?.institution || "",
        degree: edu?.degree || "",
        branch: edu?.branch || "",
        cgpa: edu?.cgpa ? String(edu.cgpa) : "",
        endYear: edu?.endYear ? String(edu.endYear) : "",
      },
      skills: [...(p.skills || []).map((s) => s.name), ...soft].join(", "),
      softSkills: soft,
      summary: p.summary || "",
      projects: (p.projects || []).map((pr) => ({ ...pr, technologies: (pr.technologies || []).join(", ") })),
      experience: (p.experience || []).map((ex) => ({ company: ex.company, role: ex.role, description: ex.description })),
      certifications: (p.certifications || []).map((c) => ({ name: c.name, issuer: c.issuer, date: c.date })),
      courses: (p.courses || []).map((c) => ({ name: c.name, platform: c.platform, date: c.date })),
      languages: (p.languages || []).map((l) => l.name).join(", "),
      interests: (p.interests || []).join(", "),
      achievements: (p.achievements || []).join("\n"),
    };
  };

  const buildResumeData = (ed: EditableState): ExtractedInfo => {
    return {
      personal: { ...ed.personal },
      education: [{
        institution: ed.education.institution,
        degree: ed.education.degree,
        branch: ed.education.branch,
        cgpa: parseFloat(ed.education.cgpa) || 0,
        startYear: parsed?.education?.[0]?.startYear || 0,
        endYear: parseInt(ed.education.endYear) || 0,
      }],
      skills: ed.skills.split(",").map((s) => s.trim()).filter(Boolean).map((name) => ({ name, category: "other" })),
      softSkills: ed.softSkills.map((name) => ({ name, category: "soft" })),
      projects: ed.projects.filter((p) => p.title.trim()).map((p) => ({ ...p, technologies: p.technologies.split(",").map((t) => t.trim()).filter(Boolean) })),
      experience: ed.experience.filter((e) => e.role.trim() || e.company.trim()),
      certifications: ed.certifications.filter((c) => c.name.trim()),
      courses: ed.courses.filter((c) => c.name.trim()),
      languages: ed.languages.split(",").map((l) => l.trim()).filter(Boolean).map((name) => ({ name, proficiency: "Intermediate" })),
      interests: ed.interests.split(",").map((i) => i.trim()).filter(Boolean),
      achievements: ed.achievements.split("\n").map((a) => a.trim()).filter(Boolean),
      summary: ed.summary,
    };
  };

  const canContinue = basic.name.trim().length >= 2 && basic.phone.replace(/\D/g, "").length >= 10 && !!file && !extracting;

  const continueToReview = async () => {
    if (!canContinue) return;
    await readAndParse();
  };

  const update = (k: keyof EditableState, v: unknown) =>
    setEditable((ed) => (ed ? { ...ed, [k]: v } as EditableState : ed));

  const updateNested = (ed: EditableState, key: "personal" | "education", field: string, v: string) => ({
    ...ed,
    [key]: { ...ed[key], [field]: v },
  });

  const missingFields = (ed: EditableState) => {
    const missing: string[] = [];
    if (!ed.personal.email.trim()) missing.push("email");
    if (!ed.education.institution.trim()) missing.push("college");
    if (!ed.education.degree.trim()) missing.push("degree");
    if (!ed.skills.trim()) missing.push("skills");
    return missing;
  };

  const extractedCount = (ed: EditableState) => {
    let count = 0;
    const strs = [ed.personal.name, ed.personal.email, ed.personal.phone, ed.personal.address,
      ed.personal.linkedin, ed.personal.github, ed.personal.portfolio, ed.personal.dob, ed.personal.gender,
      ed.education.institution, ed.education.degree, ed.education.branch, ed.skills, ed.summary,
      ed.languages, ed.interests];
    count += strs.filter((s) => s.trim().length > 0).length;
    count += ed.projects.filter((p) => p.title.trim()).length;
    count += ed.experience.filter((e) => e.role.trim()).length;
    count += ed.certifications.filter((c) => c.name.trim()).length;
    count += ed.courses.filter((c) => c.name.trim()).length;
    count += ed.achievements.split("\n").filter((a) => a.trim()).length;
    return count;
  };

  const submit = async () => {
    if (!editable) return;
    if (!editable.personal.email.trim()) {
      pushToast({ title: "Email required", message: "Please add your email address", type: "error" });
      return;
    }
    if (!password) {
      pushToast({ title: "Password required", message: "Create a password to secure your account", type: "error" });
      return;
    }
    if (password.length < 6) {
      pushToast({ title: "Password too short", message: "Use at least 6 characters", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const finalResumeData = buildResumeData(editable);
      const res = await fetch("/api/auth/register/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          resumeData: finalResumeData,
          password,
          additionalFields: {
            email: editable.personal.email,
            name: editable.personal.name,
            phone: editable.personal.phone,
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Smart Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Three quick fields — our AI reads your resume and builds your entire profile
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "basic" && (
          <motion.div
            key="basic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card className="glass-strong overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl gradient-emerald flex items-center justify-center shrink-0 shadow-glow">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Everything else, we've got it</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Share your name, number, and resume. We'll extract your skills, education,
                      projects, certifications and more — automatically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Name"
                    value={basic.name}
                    onChange={(v) => setBasic((b) => ({ ...b, name: v }))}
                    placeholder="e.g., Rahul Sharma"
                    icon={<UserIcon className="w-3.5 h-3.5" />}
                  />
                  <Field
                    label="Mobile Number"
                    value={basic.phone}
                    onChange={(v) => setBasic((b) => ({ ...b, phone: v }))}
                    placeholder="e.g., 9876543210"
                    icon={<Phone className="w-3.5 h-3.5" />}
                    type="tel"
                  />
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300",
                    dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  {fileName ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <BadgeCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{fileName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Click to change file</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Drop your resume here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, or TXT</p>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {["Profile auto-fill", "ATS Score", "Skill Detection", "Certificate Import"].map((f, i) => (
                    <div key={i} className="rounded-xl border border-border bg-muted/20 px-2 py-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      <p className="text-[11px] font-medium leading-tight">{f}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={continueToReview}
              disabled={!canContinue}
              className="w-full gradient-emerald text-white gap-2 shadow-glow h-11"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Reading your resume...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            {!canContinue && (
              <p className="text-center text-xs text-muted-foreground">
                {!basic.name.trim() && "Enter your full name. "}
                {basic.name.trim() && basic.phone.replace(/\D/g, "").length < 10 && "Enter a valid 10-digit mobile number. "}
                {basic.name.trim() && basic.phone.replace(/\D/g, "").length >= 10 && !file && "Upload your resume."}
              </p>
            )}
          </motion.div>
        )}

        {step === "review" && editable && parsed && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <Card className="glass-strong">
              <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Resume parsed successfully</p>
                    <p className="text-xs text-muted-foreground">{extractedCount(editable)} details extracted — all editable below</p>
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="w-28 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, extractedCount(editable) * 4)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full gradient-emerald rounded-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Section icon={<UserIcon className="w-4 h-4 text-primary" />} title="Personal & Contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name *" value={editable.personal.name} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "name", v))} />
                <Field label="Email *" value={editable.personal.email} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "email", v))} type="email" />
                <Field label="Mobile" value={editable.personal.phone} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "phone", v))} icon={<Phone className="w-3.5 h-3.5" />} />
                <Field label="Address" value={editable.personal.address} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "address", v))} icon={<MapPin className="w-3.5 h-3.5" />} />
                <Field label="LinkedIn" value={editable.personal.linkedin} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "linkedin", v))} icon={<Linkedin className="w-3.5 h-3.5" />} />
                <Field label="GitHub" value={editable.personal.github} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "github", v))} icon={<Github className="w-3.5 h-3.5" />} />
                <Field label="Portfolio" value={editable.personal.portfolio} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "portfolio", v))} icon={<Globe className="w-3.5 h-3.5" />} />
                <Field label="Date of Birth" value={editable.personal.dob} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "dob", v))} icon={<Calendar className="w-3.5 h-3.5" />} />
                <Field label="Gender" value={editable.personal.gender} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "gender", v))} />
              </div>
            </Section>

            <Section icon={<GraduationCap className="w-4 h-4 text-primary" />} title="Education">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="College / University" value={editable.education.institution} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "institution", v))} />
                <Field label="Degree" value={editable.education.degree} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "degree", v))} />
                <Field label="Branch" value={editable.education.branch} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "branch", v))} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CGPA" value={editable.education.cgpa} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "cgpa", v))} />
                  <Field label="Graduation Year" value={editable.education.endYear} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "endYear", v))} />
                </div>
              </div>
            </Section>

            <Section icon={<Zap className="w-4 h-4 text-primary" />} title="Skills & Career Objective">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Zap className="w-3 h-3" /> Skills</Label>
                  <Input
                    value={editable.skills}
                    onChange={(e) => update("skills", e.target.value)}
                    placeholder="React, Node.js, Python, ..."
                    className="h-9 text-sm"
                  />
                  {editable.softSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editable.softSkills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[11px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Career Objective</Label>
                  <Textarea
                    value={editable.summary}
                    onChange={(e) => update("summary", e.target.value)}
                    placeholder="Seeking an internship in..."
                    className="min-h-[60px] resize-none text-xs"
                  />
                </div>
              </div>
            </Section>

            <ListItemSection
              icon={<FolderGit2 className="w-4 h-4 text-primary" />}
              title="Projects"
              items={editable.projects}
              emptyText="No projects found in your resume"
              fields={[{ key: "title", label: "Title", placeholder: "Project name" }]}
              addItem={{ title: "", description: "", technologies: "" }}
              onItems={(items) => update("projects", items)}
              renderExtra={(item, set) => (
                <>
                  <Textarea
                    value={item.description}
                    onChange={(e) => set({ ...item, description: e.target.value })}
                    placeholder="What did you build?"
                    className="min-h-[56px] resize-none text-xs"
                  />
                  <Input
                    value={item.technologies}
                    onChange={(e) => set({ ...item, technologies: e.target.value })}
                    placeholder="Tech: React, Node.js"
                    className="h-9 text-sm"
                  />
                </>
              )}
            />

            <ListItemSection
              icon={<Briefcase className="w-4 h-4 text-primary" />}
              title="Experience & Internships"
              items={editable.experience}
              emptyText="No experience found in your resume"
              fields={[
                { key: "role", label: "Role", placeholder: "e.g., Frontend Intern" },
                { key: "company", label: "Company", placeholder: "Company name" },
              ]}
              addItem={{ company: "", role: "", description: "" }}
              onItems={(items) => update("experience", items)}
              renderExtra={(item, set) => (
                <Textarea
                  value={item.description}
                  onChange={(e) => set({ ...item, description: e.target.value })}
                  placeholder="What did you do?"
                  className="min-h-[56px] resize-none text-xs"
                />
              )}
            />

            <ListItemSection
              icon={<Award className="w-4 h-4 text-primary" />}
              title="Certifications"
              items={editable.certifications}
              emptyText="No certifications found in your resume"
              fields={[{ key: "name", label: "Certification", placeholder: "e.g., AWS Cloud Practitioner" }]}
              addItem={{ name: "", issuer: "", date: "" }}
              onItems={(items) => update("certifications", items)}
              renderExtra={(item, set) => (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={item.issuer}
                    onChange={(e) => set({ ...item, issuer: e.target.value })}
                    placeholder="Issued by (e.g., Coursera)"
                    className="h-9 text-sm"
                  />
                  <Input
                    value={item.date}
                    onChange={(e) => set({ ...item, date: e.target.value })}
                    placeholder="Date / Year"
                    className="h-9 text-sm"
                  />
                </div>
              )}
            />

            {editable.courses.length > 0 && (
              <ListItemSection
                icon={<BookOpen className="w-4 h-4 text-primary" />}
                title="Courses"
                items={editable.courses}
                emptyText="No courses found"
                fields={[{ key: "name", label: "Course", placeholder: "Course name" }]}
                addItem={{ name: "", platform: "", date: "" }}
                onItems={(items) => update("courses", items)}
                renderExtra={(item, set) => (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.platform}
                      onChange={(e) => set({ ...item, platform: e.target.value })}
                      placeholder="Platform"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={item.date}
                      onChange={(e) => set({ ...item, date: e.target.value })}
                      placeholder="Date / Year"
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              />
            )}

            <Section icon={<LanguagesIcon className="w-4 h-4 text-primary" />} title="Languages, Interests & Achievements">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Languages" value={editable.languages} onChange={(v) => update("languages", v)} placeholder="English, Hindi, ..." icon={<LanguagesIcon className="w-3.5 h-3.5" />} />
                <Field label="Interests" value={editable.interests} onChange={(v) => update("interests", v)} placeholder="Coding, Chess, ..." icon={<Heart className="w-3.5 h-3.5" />} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Trophy className="w-3 h-3" /> Achievements (one per line)</Label>
                <Textarea
                  value={editable.achievements}
                  onChange={(e) => update("achievements", e.target.value)}
                  placeholder={"Runner-up, Smart India Hackathon\nBest Project Award 2024"}
                  className="min-h-[70px] resize-none text-xs"
                />
              </div>
            </Section>

            <Section
              icon={<Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              title="Just a few things we still need"
              accent
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!editable.personal.email.trim() && (
                  <Field label="Email Address *" value={editable.personal.email} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "personal", "email", v))} type="email" />
                )}
                {!editable.education.institution.trim() && (
                  <Field label="College / University *" value={editable.education.institution} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "institution", v))} />
                )}
                {!editable.education.degree.trim() && (
                  <Field label="Degree *" value={editable.education.degree} onChange={(v) => setEditable((ed) => ed && updateNested(ed, "education", "degree", v))} />
                )}
                {!editable.skills.trim() && (
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1 text-muted-foreground"><Zap className="w-3 h-3" /> Skills *</Label>
                    <Input value={editable.skills} onChange={(e) => update("skills", e.target.value)} placeholder="React, Python, ..." className="h-9 text-sm" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Lock className="w-3 h-3" /> Create Password *
                  </Label>
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPwd ? "text" : "password"}
                      placeholder="At least 6 characters"
                      className="h-9 text-sm pr-10"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {missingFields(editable).length > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  Still missing: {missingFields(editable).join(", ")} — add them above to make your profile stronger.
                </p>
              )}
            </Section>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep("basic")} className="gap-1.5">
                <ChevronLeft className="w-4 h-4" /> Re-upload
              </Button>
              <Button onClick={submit} disabled={loading} className="flex-1 gradient-emerald text-white gap-2 shadow-glow h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? "Setting up your account..." : "Complete Registration"}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              We'll instantly create your account, run an ATS check on your resume, save your certificates,
              and take you straight to your dashboard.
            </p>
          </motion.div>
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

function Section({ icon, title, children, accent }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <Card className={cn(accent && "border-amber-500/30")}>
      <CardContent className="p-5 space-y-4">
        <h2 className={cn("text-base font-bold flex items-center gap-2", accent && "text-amber-600 dark:text-amber-400")}>
          {icon} {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}

interface ListItem<T> {
  [key: string]: unknown;
}

function ListItemSection<T extends ListItem<T>>({ icon, title, items, fields, addItem, onItems, renderExtra, emptyText }: {
  icon: React.ReactNode;
  title: string;
  items: T[];
  fields: Array<{ key: string; label: string; placeholder: string }>;
  addItem: T;
  onItems: (items: T[]) => void;
  renderExtra?: (item: T, set: (item: T) => void) => React.ReactNode;
  emptyText: string;
}) {
  const updateItem = (i: number, item: T) => {
    const next = [...items];
    next[i] = item;
    onItems(next);
  };
  const add = () => onItems([...items, { ...addItem }]);
  const remove = (i: number) => onItems(items.filter((_, idx) => idx !== i));

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">{icon} {title}</h2>
          <button type="button" onClick={add} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {items.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-xl border border-dashed border-border px-3 py-2.5">
            <FileText className="w-3.5 h-3.5" /> {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fields.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                      <Input
                        value={String(item[f.key] ?? "")}
                        onChange={(e) => updateItem(i, { ...item, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
                {renderExtra && renderExtra(item, (updated) => updateItem(i, updated))}
                <div className="flex justify-end">
                  <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
