"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Sparkles, Loader2, CheckCircle2, XCircle, ArrowRight,
  RefreshCw, Target, ChevronDown, ChevronUp, Upload, X, Save, Briefcase,
  GraduationCap, Award, FolderGit2, User as UserIcon,
  Mail, Phone, MapPin, Linkedin, Github, Zap, Eye,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ATSReport, ParsedResume, AIImprovement } from "@/lib/types";

export function ATSChecker() {
  const { resumeData, navigate, token, pushToast } = useApp();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ATS Resume Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyze and optimize your resume for Applicant Tracking Systems</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 h-10">
          <TabsTrigger value="generate" onClick={() => navigate("resume-builder")} className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Generate Resume
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" /> Upload Resume
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadTab resumeData={resumeData} navigate={navigate} token={token} pushToast={pushToast} />
        </TabsContent>

        <TabsContent value="generate">
          <div className="py-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Go to the Resume Builder to create a new resume, then return here for ATS analysis.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UploadTab({ resumeData, navigate, token, pushToast }: {
  resumeData: any; navigate: any; token: string | null; pushToast: any;
}) {
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [improvements, setImprovements] = useState<AIImprovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [activeEdits, setActiveEdits] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resumeText.trim().length >= 20) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        analyzeText(resumeText);
      }, 800);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [resumeText]);

  const analyzeText = async (text: string) => {
    try {
      const res = await fetch("/api/ats/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeText: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report || data);
      }
    } catch {}
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) {
      pushToast({ title: "Unsupported format", message: "Use PDF, DOCX, DOC, or TXT", type: "error" });
      return;
    }

    setLoading(true);
    try {
      if (ext === "txt") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          setResumeText(text);
          await uploadAndParse(text, ext!);
          setLoading(false);
        };
        reader.readAsText(file);
      } else {
        const text = extractTextFromFile(file);
        setResumeText(text);
        await uploadAndParse(text, ext!);
        setLoading(false);
      }
    } catch {
      pushToast({ title: "Parse failed", message: "Could not read file", type: "error" });
      setLoading(false);
    }
  };

  const extractTextFromFile = (file: File): string => {
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
    return `Resume: ${name}\n\nNote: For PDF/DOCX files, the text extraction happens on the backend.\nThe file "${file.name}" has been selected for upload.\n\nPlease paste the resume text manually for best results, or use the Resume Builder to create an ATS-optimized resume.`;
  };

  const uploadAndParse = async (text: string, type: string) => {
    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, type }),
      });
      const data = await res.json();
      if (res.ok && data.parsed) {
        setParsed(data.parsed);
        setResumeText(text);
        pushToast({ title: "Resume parsed successfully", type: "success" });
      } else {
        pushToast({ title: "Parse error", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImportFromBuilder = () => {
    if (!resumeData) {
      pushToast({ title: "No resume data", message: "Build a resume first", type: "error" });
      return;
    }
    const lines: string[] = [];
    const p = resumeData.personal;
    lines.push(p.name, p.email, p.phone, p.address, p.careerObjective);
    resumeData.education?.forEach((e: any) => {
      lines.push("EDUCATION");
      lines.push(`${e.degree} ${e.branch} - ${e.institution} (${e.startYear}-${e.endYear})${e.cgpa ? ` CGPA: ${e.cgpa}` : ""}`);
    });
    lines.push("SKILLS");
    resumeData.skills?.forEach((s: any) => lines.push(s.name));
    resumeData.projects?.forEach((pr: any) => {
      lines.push("PROJECTS");
      lines.push(`${pr.title} - ${pr.description} Tech: ${pr.technologies.join(", ")}`);
    });
    resumeData.experience?.forEach((e: any) => {
      lines.push("EXPERIENCE");
      lines.push(`${e.role} at ${e.company} (${e.startDate}-${e.endDate})`);
      if (e.description) lines.push(e.description);
    });
    resumeData.certifications?.forEach((c: any) => {
      lines.push("CERTIFICATIONS");
      lines.push(`${c.name} - ${c.issuer}`);
    });
    const text = lines.filter(Boolean).join("\n");
    setResumeText(text);
    uploadAndParse(text, "text");
    pushToast({ title: "Imported from Resume Builder", type: "success" });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim().length > 10) {
        setResumeText(text);
        await uploadAndParse(text, "text");
      }
    } catch {
      pushToast({ title: "Clipboard access denied", type: "error" });
    }
  };

  const updateParsedField = (section: string, field: string, value: any) => {
    if (!parsed) return;
    const updated = { ...parsed };
    if (section === "personal") {
      (updated.personal as any)[field] = value;
    } else if (Array.isArray((updated as any)[section])) {
      (updated as any)[section] = value;
    } else {
      (updated as any)[section] = value;
    }
    setParsed(updated);
  };

  const addSkill = (name: string) => {
    if (!parsed || !name.trim()) return;
    updateParsedField("skills", "add", [...parsed.skills, { name: name.trim(), category: "other" }]);
  };

  const removeSkill = (idx: number) => {
    if (!parsed) return;
    updateParsedField("skills", "remove", parsed.skills.filter((_, i) => i !== idx));
  };

  const handleSaveToProfile = async () => {
    if (!parsed) return;
    try {
      const res = await fetch("/api/resume/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeData: parsed }),
      });
      if (res.ok) {
        pushToast({ title: "Saved to profile", type: "success" });
      } else {
        pushToast({ title: "Save failed", type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  const handleAIImprove = async () => {
    if (!resumeText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ats/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (res.ok && data.report) {
        const items: AIImprovement[] = [];
        if (data.report.summarySuggestion) {
          items.push({
            type: "missing_summary",
            title: "Add Professional Summary",
            suggested: data.report.summarySuggestion,
          });
        }
        if (data.report.missingKeywords?.length > 0) {
          items.push({
            type: "missing_keywords",
            title: "Add Missing Keywords",
            suggested: `Consider adding these keywords: ${data.report.missingKeywords.slice(0, 8).join(", ")}`,
            keywords: data.report.missingKeywords.slice(0, 8),
          });
        }
        if (data.report.bulletPointSuggestions?.length > 0) {
          data.report.bulletPointSuggestions.forEach((s: string) => {
            items.push({ type: "bullet_point", title: "Improve Bullet Points", suggested: s });
          });
        }
        data.report.improvements?.forEach((imp: string) => {
          items.push({ type: "missing_skills", title: "Improvement", suggested: imp });
        });
        setImprovements(items);
        pushToast({ title: "AI suggestions generated", type: "success" });
      }
    } catch {
      pushToast({ title: "AI analysis failed", type: "error" });
    } finally {
      setAiLoading(false);
    }
  };

  const applyImprovement = (idx: number) => {
    setImprovements((prev) => prev.map((item, i) => i === idx ? { ...item, accepted: true } : item));
    pushToast({ title: "Suggestion accepted", type: "success" });
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!parsed && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300",
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
              dragOver ? "bg-primary/10" : "bg-muted/50"
            )}>
              <Upload className={cn("w-8 h-8", dragOver ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop your resume here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, DOC, or TXT</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="hidden"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleImportFromBuilder} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Import from Builder
            </Button>
            <Button variant="outline" size="sm" onClick={handlePaste} className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Paste from Clipboard
            </Button>
          </div>

          <div className="mt-4">
            <Label className="text-xs mb-1.5 block">Or paste resume text directly</Label>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="min-h-[140px] resize-none text-xs font-mono"
            />
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-6">
              <Skeleton className="w-28 h-28 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* Parsed Results */}
      {parsed && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Parsed Resume
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setParsed(null); setReport(null); setResumeText(""); setImprovements([]); }} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> New Upload
              </Button>
              <Button size="sm" onClick={handleSaveToProfile} className="gradient-emerald text-white gap-1.5 text-xs shadow-glow">
                <Save className="w-3.5 h-3.5" /> Save to Profile
              </Button>
            </div>
          </div>

          {/* Personal Info Card */}
          <ParsedSectionCard
            title="Personal Info"
            icon={<UserIcon className="w-4 h-4 text-primary" />}
            editable={activeEdits.personal}
            onToggleEdit={() => setActiveEdits((p) => ({ ...p, personal: !p.personal }))}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditableField label="Name" value={parsed.personal.name} editing={activeEdits.personal}
                onChange={(v) => updateParsedField("personal", "name", v)} icon={<UserIcon className="w-3 h-3" />} />
              <EditableField label="Email" value={parsed.personal.email} editing={activeEdits.personal}
                onChange={(v) => updateParsedField("personal", "email", v)} icon={<Mail className="w-3 h-3" />} />
              <EditableField label="Phone" value={parsed.personal.phone} editing={activeEdits.personal}
                onChange={(v) => updateParsedField("personal", "phone", v)} icon={<Phone className="w-3 h-3" />} />
              <EditableField label="Address" value={parsed.personal.address} editing={activeEdits.personal}
                onChange={(v) => updateParsedField("personal", "address", v)} icon={<MapPin className="w-3 h-3" />} />
              <EditableField label="LinkedIn" value={parsed.personal.linkedin} editing={activeEdits.personal}
                onChange={(v) => updateParsedField("personal", "linkedin", v)} icon={<Linkedin className="w-3 h-3" />} />
              <EditableField label="GitHub" value={parsed.personal.github} editing={activeEdits.personal}
                onChange={(v) => updateParsedField("personal", "github", v)} icon={<Github className="w-3 h-3" />} />
            </div>
          </ParsedSectionCard>

          {/* Skills Card */}
          <ParsedSectionCard
            title="Skills"
            icon={<Zap className="w-4 h-4 text-primary" />}
            badge={`${parsed.skills.length} found`}
            editable={activeEdits.skills}
            onToggleEdit={() => setActiveEdits((p) => ({ ...p, skills: !p.skills }))}
          >
            {parsed.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {parsed.skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px] gap-1 pr-1">
                    {s.name}
                    {activeEdits.skills && (
                      <button onClick={() => removeSkill(i)} className="ml-0.5 hover:text-destructive">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </Badge>
                ))}
                {activeEdits.skills && (
                  <AddSkillInline onAdd={addSkill} />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No skills detected</p>
            )}

          </ParsedSectionCard>

          {/* Education Card */}
          {parsed.education.length > 0 && (
            <ParsedSectionCard
              title="Education"
              icon={<GraduationCap className="w-4 h-4 text-primary" />}
              badge={`${parsed.education.length} entries`}
            >
              <div className="space-y-2">
                {parsed.education.map((edu, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-sm font-medium">{edu.degree}{edu.branch ? ` in ${edu.branch}` : ""}</p>
                    {edu.institution && <p className="text-xs text-muted-foreground mt-0.5">{edu.institution}</p>}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {edu.startYear > 0 && <span>{edu.startYear} - {edu.endYear || "Present"}</span>}
                      {edu.cgpa > 0 && <span>CGPA: {edu.cgpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ParsedSectionCard>
          )}

          {/* Experience Card */}
          {parsed.experience.length > 0 && (
            <ParsedSectionCard
              title="Experience"
              icon={<Briefcase className="w-4 h-4 text-primary" />}
              badge={`${parsed.experience.length} entries`}
            >
              <div className="space-y-2">
                {parsed.experience.map((exp, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-sm font-medium">{exp.role}</p>
                    {exp.company && <p className="text-xs text-primary">{exp.company}</p>}
                    {(exp.startDate || exp.endDate) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{exp.startDate} - {exp.endDate || "Present"}</p>
                    )}
                    {exp.description && <p className="text-xs mt-1.5 leading-relaxed">{exp.description.slice(0, 300)}</p>}
                  </div>
                ))}
              </div>
            </ParsedSectionCard>
          )}

          {/* Projects Card */}
          {parsed.projects.length > 0 && (
            <ParsedSectionCard
              title="Projects"
              icon={<FolderGit2 className="w-4 h-4 text-primary" />}
              badge={`${parsed.projects.length} entries`}
            >
              <div className="space-y-2">
                {parsed.projects.map((proj, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-sm font-medium">{proj.title}</p>
                    {proj.description && <p className="text-xs mt-1 leading-relaxed">{proj.description.slice(0, 250)}</p>}
                    {proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proj.technologies.map((t, ti) => (
                          <Badge key={ti} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ParsedSectionCard>
          )}

          {/* Certifications Card */}
          {parsed.certifications.length > 0 && (
            <ParsedSectionCard
              title="Certifications"
              icon={<Award className="w-4 h-4 text-primary" />}
              badge={`${parsed.certifications.length} entries`}
            >
              <div className="space-y-1.5">
                {parsed.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium">{cert.name}</span>
                    {cert.issuer && <span className="text-muted-foreground text-xs">- {cert.issuer}</span>}
                  </div>
                ))}
              </div>
            </ParsedSectionCard>
          )}

          {/* ATS Score Section */}
          {report && (
            <ATSScoreSection report={report} onNavigate={navigate} />
          )}

          {/* AI Improvement Panel */}
          <AIImprovementPanel
            improvements={improvements}
            onImprove={handleAIImprove}
            onApply={applyImprovement}
            aiLoading={aiLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

function ParsedSectionCard({ title, icon, badge, editable, onToggleEdit, children }: {
  title: string; icon: React.ReactNode; badge?: string;
  editable?: boolean; onToggleEdit?: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon} {title}
            {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
          </CardTitle>
          {onToggleEdit && (
            <Button variant="ghost" size="sm" onClick={onToggleEdit} className="text-xs h-7 gap-1">
              {editable ? <><X className="w-3 h-3" /> Cancel</> : <><FileText className="w-3 h-3" /> Edit</>}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EditableField({ label, value, editing, onChange, icon }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] flex items-center gap-1 text-muted-foreground">{icon} {label}</Label>
      {editing ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
      ) : (
        <p className="text-sm truncate">{value || <span className="text-muted-foreground italic">Not detected</span>}</p>
      )}
    </div>
  );
}

function AddSkillInline({ onAdd }: { onAdd: (s: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-1">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val); setVal(""); } }}
        placeholder="+ Add"
        className="h-6 w-24 text-[10px] px-2"
      />
    </div>
  );
}

function ATSScoreSection({ report, onNavigate }: { report: ATSReport; onNavigate: any }) {
  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };
  const scoreStroke = (score: number) => {
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-amber-500";
    if (score >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };
  const gradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    if (grade.startsWith("B")) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    if (grade.startsWith("C")) return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  };
  const breakdownMeta: Record<string, { label: string; max: number }> = {
    keywords: { label: "Keywords", max: 25 },
    formatting: { label: "Formatting", max: 15 },
    skills: { label: "Skills", max: 15 },
    experience: { label: "Experience", max: 15 },
    achievements: { label: "Education & Achievements", max: 10 },
    grammar: { label: "Grammar", max: 10 },
    structure: { label: "Structure", max: 10 },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                <motion.circle
                  cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
                  className={scoreStroke(report.score)}
                  initial={{ strokeDasharray: "0 314" }}
                  animate={{ strokeDasharray: `${(report.score / 100) * 314} 314` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-bold", scoreColor(report.score))}>{report.score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">ATS Score</h2>
                <Badge className={cn("text-sm px-3 py-1 border", gradeColor(report.grade))}>{report.grade}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.score >= 80
                  ? "Excellent! Your resume is well-optimized for ATS systems."
                  : report.score >= 60
                  ? "Good, but there is room for improvement."
                  : report.score >= 40
                  ? "Your resume needs improvements for better ATS compatibility."
                  : "Your resume needs significant changes for ATS compatibility."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" /> Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(report.breakdown).map(([key, item]) => {
            const meta = breakdownMeta[key] || { label: key, max: item.max };
            const pct = item.max > 0 ? (item.score / item.max) * 100 : 0;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className="text-sm text-muted-foreground">{item.score}/{item.max}</span>
                </div>
                <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className={cn("h-full rounded-full",
                      pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"
                    )}
                  />
                </div>
                {item.details && <p className="text-[11px] text-muted-foreground">{item.details}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onNavigate("resume-builder")} className="gradient-emerald text-white gap-2 shadow-glow">
          <ArrowRight className="w-4 h-4" /> Regenerate Resume
        </Button>
      </div>
    </motion.div>
  );
}

function AIImprovementPanel({ improvements, onImprove, onApply, aiLoading }: {
  improvements: AIImprovement[];
  onImprove: () => void;
  onApply: (idx: number) => void;
  aiLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const pendingCount = improvements.filter((i) => !i.accepted).length;

  return (
    <Card>
      <CardHeader>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI Suggestions
            {improvements.length > 0 && (
              <Badge className="text-[10px] px-1.5">{pendingCount} pending</Badge>
            )}
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </CardHeader>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <CardContent className="space-y-3">
              {improvements.length === 0 && !aiLoading && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Click the button below to get AI-powered improvement suggestions.
                </p>
              )}
              {improvements.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-3 rounded-xl border transition-colors",
                    item.accepted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/20 border-border/30"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {item.accepted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.suggested}</p>
                      {item.keywords && item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.keywords.map((kw, ki) => (
                            <Badge key={ki} variant="outline" className="text-[10px] border-primary/30 text-primary">{kw}</Badge>
                          ))}
                        </div>
                      )}
                      {!item.accepted && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => onApply(idx)}
                          className="mt-2 h-6 text-[11px] text-primary hover:text-primary gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button
                onClick={onImprove}
                disabled={aiLoading}
                className="w-full gradient-emerald text-white gap-2 shadow-glow"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Analyzing..." : "Improve Resume with AI"}
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
