"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon, Mail, Phone, MapPin, Linkedin, Github, Globe,
  GraduationCap, Code, FolderGit2, Briefcase, Award, Languages,
  Plus, Trash2, ChevronLeft, ChevronRight, Check, Download,
  FileText, Palette, Eye, Loader2, Save,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SKILL_TAXONOMY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ResumePreview } from "./resume-preview";
import type { ResumeData } from "@/lib/types";

const STEPS = [
  { label: "Personal", icon: UserIcon },
  { label: "Education", icon: GraduationCap },
  { label: "Skills", icon: Code },
  { label: "Projects", icon: FolderGit2 },
  { label: "Experience", icon: Briefcase },
  { label: "Certs", icon: Award },
  { label: "Languages", icon: Languages },
  { label: "Additional", icon: FileText },
  { label: "Preview", icon: Eye },
];

const EMPTY_RESUME: ResumeData = {
  personal: { name: "", email: "", phone: "", address: "", linkedin: "", github: "", portfolio: "", careerObjective: "" },
  education: [{ institution: "", degree: "", branch: "", cgpa: 0, startYear: 2024, endYear: 2028, isCurrently: true }],
  skills: [],
  projects: [],
  experience: [],
  certifications: [],
  languages: [],
  additional: { achievements: "", hobbies: "", strengths: "", references: [] },
};

const COLORS = ["#059669", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#0891b2", "#4f46e5", "#be185d"];

function loadSaved(): ResumeData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("resume-builder-data");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(data: ResumeData) {
  try { localStorage.setItem("resume-builder-data", JSON.stringify(data)); } catch {}
}

export function ResumeBuilder() {
  const { resumeData, setResumeData, resumeTemplate, setResumeTemplate, resumeColor, setResumeColor, navigate, token, pushToast, historyTick, lastHistoryDomain, recordResumeEdit } = useApp();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ResumeData>(resumeData || loadSaved() || EMPTY_RESUME);
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>(Object.keys(SKILL_TAXONOMY)[0]);
  const [saving, setSaving] = useState(false);
  const dataRef = useRef<ResumeData>(data);

  useEffect(() => { saveLocal(data); }, [data]);

  // Resync the editor document whenever an undo/redo restores resume state
  useEffect(() => {
    if (lastHistoryDomain !== "resume") return;
    const next = useApp.getState().resumeData || loadSaved() || EMPTY_RESUME;
    dataRef.current = next;
    setData(next);
  }, [historyTick, lastHistoryDomain]);

  const snapshotFor = (resumeData: ResumeData) => ({
    resumeData,
    resumeTemplate: useApp.getState().resumeTemplate,
    resumeColor: useApp.getState().resumeColor,
  });

  const update = useCallback((patch: Partial<ResumeData>) => {
    const before = snapshotFor(dataRef.current);
    const next = { ...dataRef.current, ...patch };
    dataRef.current = next;
    setData(next);
    recordResumeEdit(before, snapshotFor(next));
  }, [recordResumeEdit]);

  const updatePersonal = useCallback((patch: Partial<ResumeData["personal"]>) => {
    const before = snapshotFor(dataRef.current);
    const next = { ...dataRef.current, personal: { ...dataRef.current.personal, ...patch } };
    dataRef.current = next;
    setData(next);
    recordResumeEdit(before, snapshotFor(next));
  }, [recordResumeEdit]);

  const updateAdditional = useCallback((patch: Partial<ResumeData["additional"]>) => {
    const before = snapshotFor(dataRef.current);
    const next = { ...dataRef.current, additional: { ...dataRef.current.additional, ...patch } };
    dataRef.current = next;
    setData(next);
    recordResumeEdit(before, snapshotFor(next));
  }, [recordResumeEdit]);

  const canProceed = () => {
    switch (step) {
      case 0: return data.personal.name.trim().length > 0 && data.personal.email.trim().length > 0;
      default: return true;
    }
  };

  const handleSaveToProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeData: data }),
      });
      if (res.ok) {
        setResumeData(data);
        pushToast({ title: "Resume saved to profile", type: "success" });
      } else {
        pushToast({ title: "Save failed", type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const text = generateTextResume(data);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.personal.name || "resume"}-resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("resume-printable");
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Resume - ${data.personal.name}</title>
      <style>
        body{font-family:Georgia,serif;margin:0;padding:40px;color:#111;line-height:1.5;}
        h1{font-size:22px;margin:0 0 4px;}
        h2{font-size:14px;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:4px;margin:16px 0 8px;color:${resumeColor};}
        p{margin:2px 0;font-size:12px;}
        .section{margin-bottom:12px;}
        .flex-row{display:flex;justify-content:space-between;font-size:12px;}
        .badge{display:inline-block;background:#eee;padding:1px 6px;border-radius:3px;font-size:11px;margin:2px;}
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resume Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Build your professional resume step by step</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("ats-checker")} className="gap-1.5">
          <FileText className="w-4 h-4" /> ATS Check
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex items-center gap-1 min-w-max pb-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <button
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  i === step ? "gradient-emerald text-white shadow-glow" :
                  i < step ? "bg-primary/10 text-primary" :
                  "bg-muted/50 text-muted-foreground"
                )}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("w-4 h-px mx-0.5", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Split: form + live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="min-w-0">
          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <PersonalStep data={data} update={updatePersonal} />}
              {step === 1 && <EducationStep data={data} update={update} />}
              {step === 2 && <SkillsStep data={data} update={update} activeCategory={activeSkillCategory} setActiveCategory={setActiveSkillCategory} />}
              {step === 3 && <ProjectsStep data={data} update={update} />}
              {step === 4 && <ExperienceStep data={data} update={update} />}
              {step === 5 && <CertsStep data={data} update={update} />}
              {step === 6 && <LanguagesStep data={data} update={update} />}
              {step === 7 && <AdditionalStep data={data} update={updateAdditional} />}
              {step === 8 && (
                <PreviewStep
                  data={data}
                  template={resumeTemplate}
                  setTemplate={setResumeTemplate}
                  color={resumeColor}
                  setColor={setResumeColor}
                  onPrint={handlePrint}
                  onDownload={handleDownload}
                  onSave={handleSaveToProfile}
                  saving={saving}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < 8 && (
              <Button
                onClick={() => setStep((s) => Math.min(8, s + 1))}
                disabled={!canProceed()}
                className="gradient-emerald text-white gap-1.5 shadow-glow"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {step === 8 && (
              <Button
                onClick={() => { setResumeData(data); pushToast({ title: "Resume data saved", type: "success" }); }}
                className="gradient-emerald text-white gap-1.5 shadow-glow"
              >
                <Save className="w-4 h-4" /> Save Resume
              </Button>
            )}
          </div>
        </div>

        {/* Sticky live preview */}
        {step !== 8 && (
          <aside className="hidden lg:block sticky top-24">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" /> Live Preview
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Template</Label>
                  <div className="flex gap-1.5 mt-1.5">
                    {(["classic", "modern", "minimal"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setResumeTemplate(t)}
                        className={cn(
                          "flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium capitalize border transition-all",
                          resumeTemplate === t
                            ? "border-primary bg-primary/10 text-primary shadow-glow"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Accent Color</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setResumeColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform hover:scale-110",
                          resumeColor === c && "ring-2 ring-offset-2 ring-offset-background ring-white/60 scale-110"
                        )}
                        style={{ background: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="aspect-[210/297] w-full overflow-hidden rounded-lg border border-border bg-white shadow-premium">
                  <div className="w-[200%] scale-50 origin-top-left">
                    <ResumePreview data={data} template={resumeTemplate} color={resumeColor} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>

      {/* Print area (hidden, used for PDF generation) */}
      <div id="resume-printable" className="hidden">
        <ResumePreview data={data} template={resumeTemplate} color={resumeColor} />
      </div>
    </div>
  );
}

/* ─── Step 1: Personal ─────────────────────────────────────── */
function PersonalStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData["personal"]>) => void }) {
  const p = data.personal;
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserIcon className="w-5 h-5 text-primary" /> Personal Information</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Full Name *</Label>
          <Input value={p.name} onChange={(e) => update({ name: e.target.value })} placeholder="Arjun Sharma" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email *</Label>
          <Input type="email" value={p.email} onChange={(e) => update({ email: e.target.value })} placeholder="arjun@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input value={p.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Address</Label>
          <Input value={p.address} onChange={(e) => update({ address: e.target.value })} placeholder="Bengaluru, India" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</Label>
          <Input value={p.linkedin} onChange={(e) => update({ linkedin: e.target.value })} placeholder="https://linkedin.com/in/username" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Github className="w-3 h-3" /> GitHub</Label>
          <Input value={p.github} onChange={(e) => update({ github: e.target.value })} placeholder="https://github.com/username" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Portfolio</Label>
          <Input value={p.portfolio} onChange={(e) => update({ portfolio: e.target.value })} placeholder="https://yourportfolio.com" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Career Objective</Label>
          <Textarea value={p.careerObjective} onChange={(e) => update({ careerObjective: e.target.value })} placeholder="Write a brief career objective..." className="min-h-[100px] resize-none" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Step 2: Education ────────────────────────────────────── */
function EducationStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  const edu = data.education;
  const set = (arr: ResumeData["education"]) => update({ education: arr });

  const add = () => set([...edu, { institution: "", degree: "", branch: "", cgpa: 0, startYear: 2024, endYear: 2028, isCurrently: false }]);
  const remove = (i: number) => set(edu.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<ResumeData["education"][0]>) => set(edu.map((e, idx) => idx === i ? { ...e, ...p } : e));

  return (
    <div className="space-y-4">
      {edu.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Education #{i + 1}</CardTitle>
              {edu.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Institution</Label>
                <Input value={e.institution} onChange={(ev) => patch(i, { institution: ev.target.value })} placeholder="IIT Madras" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Degree</Label>
                <Input value={e.degree} onChange={(ev) => patch(i, { degree: ev.target.value })} placeholder="B.Tech" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Branch</Label>
                <Input value={e.branch} onChange={(ev) => patch(i, { branch: ev.target.value })} placeholder="Computer Science" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CGPA</Label>
                <Input type="number" step="0.1" min="0" max="10" value={e.cgpa || ""} onChange={(ev) => patch(i, { cgpa: Number(ev.target.value) })} placeholder="8.5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Year</Label>
                <Input type="number" value={e.startYear} onChange={(ev) => patch(i, { startYear: Number(ev.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Year</Label>
                <Input type="number" value={e.isCurrently ? 2028 : e.endYear} onChange={(ev) => patch(i, { endYear: Number(ev.target.value) })} disabled={e.isCurrently} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" checked={e.isCurrently} onChange={(ev) => patch(i, { isCurrently: ev.target.checked })} className="rounded" />
                <Label className="text-xs">Currently studying here</Label>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <Button variant="outline" onClick={add} className="w-full gap-1.5 border-dashed"><Plus className="w-4 h-4" /> Add Education</Button>
    </div>
  );
}

/* ─── Step 3: Skills ───────────────────────────────────────── */
function SkillsStep({ data, update, activeCategory, setActiveCategory }: {
  data: ResumeData; update: (p: Partial<ResumeData>) => void; activeCategory: string; setActiveCategory: (c: string) => void;
}) {
  const skills = data.skills;
  const set = (arr: ResumeData["skills"]) => update({ skills: arr });

  const toggleSkill = (name: string) => {
    const existing = skills.find((s) => s.name === name);
    if (existing) {
      set(skills.filter((s) => s.name !== name));
    } else {
      set([...skills, { name, category: activeCategory, proficiency: "Intermediate" }]);
    }
  };

  const setProficiency = (name: string, prof: ResumeData["skills"][0]["proficiency"]) => {
    set(skills.map((s) => s.name === name ? { ...s, proficiency: prof } : s));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Code className="w-5 h-5 text-primary" /> Skills
          <Badge variant="secondary" className="text-[10px]">{skills.length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(SKILL_TAXONOMY).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                activeCategory === cat ? "gradient-emerald text-white" : "bg-muted/50 hover:bg-primary/10 text-muted-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/30 min-h-[80px]">
          {(SKILL_TAXONOMY[activeCategory] || []).map((skill) => {
            const selected = skills.find((s) => s.name === skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs transition-all",
                  selected ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 hover:border-primary/40"
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
        {skills.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground">Selected Skills</p>
            {skills.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{s.name}</Badge>
                  <button onClick={() => toggleSkill(s.name)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
                <Select value={s.proficiency} onValueChange={(v) => setProficiency(s.name, v as any)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Step 4: Projects ─────────────────────────────────────── */
function ProjectsStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  const projects = data.projects;
  const set = (arr: ResumeData["projects"]) => update({ projects: arr });
  const add = () => set([...projects, { title: "", description: "", technologies: [], url: "", startDate: "", endDate: "" }]);
  const remove = (i: number) => set(projects.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<ResumeData["projects"][0]>) => set(projects.map((e, idx) => idx === i ? { ...e, ...p } : e));

  return (
    <div className="space-y-4">
      {projects.map((p, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Project #{i + 1}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={p.title} onChange={(e) => patch(i, { title: e.target.value })} placeholder="E-commerce Platform" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input value={p.url} onChange={(e) => patch(i, { url: e.target.value })} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={p.description} onChange={(e) => patch(i, { description: e.target.value })} placeholder="Brief description of the project..." className="min-h-[80px] resize-none" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Technologies (comma separated)</Label>
                <Input
                  value={p.technologies.join(", ")}
                  onChange={(e) => patch(i, { technologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={p.startDate} onChange={(e) => patch(i, { startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={p.endDate} onChange={(e) => patch(i, { endDate: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <Button variant="outline" onClick={add} className="w-full gap-1.5 border-dashed"><Plus className="w-4 h-4" /> Add Project</Button>
    </div>
  );
}

/* ─── Step 5: Experience ───────────────────────────────────── */
function ExperienceStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  const exp = data.experience;
  const set = (arr: ResumeData["experience"]) => update({ experience: arr });
  const add = () => set([...exp, { company: "", role: "", description: "", startDate: "", endDate: "", isCurrently: false, highlights: [""] }]);
  const remove = (i: number) => set(exp.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<ResumeData["experience"][0]>) => set(exp.map((e, idx) => idx === i ? { ...e, ...p } : e));

  return (
    <div className="space-y-4">
      {exp.map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Experience #{i + 1}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Company</Label>
                <Input value={e.company} onChange={(ev) => patch(i, { company: ev.target.value })} placeholder="Flipkart" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Input value={e.role} onChange={(ev) => patch(i, { role: ev.target.value })} placeholder="Software Engineering Intern" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={e.description} onChange={(ev) => patch(i, { description: ev.target.value })} placeholder="Describe your role..." className="min-h-[80px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={e.startDate} onChange={(ev) => patch(i, { startDate: ev.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={e.endDate} onChange={(ev) => patch(i, { endDate: ev.target.value })} disabled={e.isCurrently} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" checked={e.isCurrently} onChange={(ev) => patch(i, { isCurrently: ev.target.checked })} className="rounded" />
                <Label className="text-xs">Currently working here</Label>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Highlights (one per line)</Label>
                <Textarea
                  value={e.highlights.join("\n")}
                  onChange={(ev) => patch(i, { highlights: ev.target.value.split("\n").filter(Boolean) })}
                  placeholder="Improved API performance by 40%&#10;Led a team of 3 developers"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <Button variant="outline" onClick={add} className="w-full gap-1.5 border-dashed"><Plus className="w-4 h-4" /> Add Experience</Button>
    </div>
  );
}

/* ─── Step 6: Certifications ───────────────────────────────── */
function CertsStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  const certs = data.certifications;
  const set = (arr: ResumeData["certifications"]) => update({ certifications: arr });
  const add = () => set([...certs, { name: "", issuer: "", date: "", url: "" }]);
  const remove = (i: number) => set(certs.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<ResumeData["certifications"][0]>) => set(certs.map((e, idx) => idx === i ? { ...e, ...p } : e));

  return (
    <div className="space-y-4">
      {certs.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Certification #{i + 1}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={c.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="AWS Cloud Practitioner" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issuer</Label>
                <Input value={c.issuer} onChange={(e) => patch(i, { issuer: e.target.value })} placeholder="Amazon Web Services" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={c.date} onChange={(e) => patch(i, { date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input value={c.url} onChange={(e) => patch(i, { url: e.target.value })} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <Button variant="outline" onClick={add} className="w-full gap-1.5 border-dashed"><Plus className="w-4 h-4" /> Add Certification</Button>
    </div>
  );
}

/* ─── Step 7: Languages ────────────────────────────────────── */
function LanguagesStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  const langs = data.languages;
  const set = (arr: ResumeData["languages"]) => update({ languages: arr });
  const add = () => set([...langs, { name: "", proficiency: "Intermediate" as const }]);
  const remove = (i: number) => set(langs.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<ResumeData["languages"][0]>) => set(langs.map((e, idx) => idx === i ? { ...e, ...p } : e));

  return (
    <div className="space-y-4">
      {langs.map((l, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Language #{i + 1}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Language</Label>
                <Input value={l.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="English" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Proficiency</Label>
                <Select value={l.proficiency} onValueChange={(v) => patch(i, { proficiency: v as any })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Native">Native</SelectItem>
                    <SelectItem value="Fluent">Fluent</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <Button variant="outline" onClick={add} className="w-full gap-1.5 border-dashed"><Plus className="w-4 h-4" /> Add Language</Button>
    </div>
  );
}

/* ─── Step 8: Additional ───────────────────────────────────── */
function AdditionalStep({ data, update }: { data: ResumeData; update: (p: Partial<ResumeData["additional"]>) => void }) {
  const a = data.additional;
  const refs = a.references;
  const setRefs = (arr: ResumeData["additional"]["references"]) => update({ references: arr });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="text-lg">Achievements</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={a.achievements} onChange={(e) => update({ achievements: e.target.value })} placeholder="List your notable achievements..." className="min-h-[100px] resize-none" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Hobbies & Interests</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={a.hobbies} onChange={(e) => update({ hobbies: e.target.value })} placeholder="Chess, Photography, Open Source Contributing..." className="min-h-[80px] resize-none" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Strengths</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={a.strengths} onChange={(e) => update({ strengths: e.target.value })} placeholder="Detail your key professional strengths..." className="min-h-[80px] resize-none" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">References</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setRefs([...refs, { name: "", title: "", email: "", phone: "" }])} className="gap-1"><Plus className="w-3 h-3" /> Add</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {refs.map((r, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border/40">
              <Input value={r.name} onChange={(e) => setRefs(refs.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Name" />
              <Input value={r.title} onChange={(e) => setRefs(refs.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Title" />
              <Input value={r.email} onChange={(e) => setRefs(refs.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))} placeholder="Email" />
              <div className="flex gap-2">
                <Input value={r.phone} onChange={(e) => setRefs(refs.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} placeholder="Phone" />
                <Button variant="ghost" size="sm" onClick={() => setRefs(refs.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Step 9: Preview & Generate ───────────────────────────── */
function PreviewStep({ data, template, setTemplate, color, setColor, onPrint, onDownload, onSave, saving }: {
  data: ResumeData;
  template: "classic" | "modern" | "minimal";
  setTemplate: (t: "classic" | "modern" | "minimal") => void;
  color: string;
  setColor: (c: string) => void;
  onPrint: () => void;
  onDownload: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <Label className="text-xs">Template</Label>
          </div>
          <div className="flex gap-1.5">
            {(["classic", "modern", "minimal"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                  template === t ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-primary/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">Color</Label>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn("w-6 h-6 rounded-full transition-all", color === c && "ring-2 ring-offset-2 ring-primary")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="border border-border/40 rounded-xl overflow-hidden bg-white shadow-lg">
        <ResumePreview data={data} template={template} color={color} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onPrint} className="gradient-emerald text-white gap-2 shadow-glow">
          <FileText className="w-4 h-4" /> Generate PDF
        </Button>
        <Button onClick={onDownload} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Download
        </Button>
        <Button onClick={onSave} disabled={saving} variant="outline" className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save to Profile
        </Button>
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
function generateTextResume(data: ResumeData): string {
  const lines: string[] = [];
  const p = data.personal;
  lines.push(p.name.toUpperCase());
  lines.push([p.email, p.phone, p.address].filter(Boolean).join(" | "));
  if (p.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
  if (p.github) lines.push(`GitHub: ${p.github}`);
  if (p.portfolio) lines.push(`Portfolio: ${p.portfolio}`);
  if (p.careerObjective) { lines.push("", "CAREER OBJECTIVE", p.careerObjective); }
  if (data.education.length) {
    lines.push("", "EDUCATION");
    data.education.forEach((e) => {
      lines.push(`${e.degree} in ${e.branch} - ${e.institution} (${e.startYear}-${e.isCurrently ? "Present" : e.endYear})${e.cgpa ? ` | CGPA: ${e.cgpa}` : ""}`);
    });
  }
  if (data.skills.length) {
    lines.push("", "SKILLS");
    const grouped: Record<string, string[]> = {};
    data.skills.forEach((s) => { (grouped[s.category] = grouped[s.category] || []).push(`${s.name} (${s.proficiency})`); });
    Object.entries(grouped).forEach(([cat, items]) => lines.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${items.join(", ")}`));
  }
  if (data.projects.length) {
    lines.push("", "PROJECTS");
    data.projects.forEach((pr) => {
      lines.push(`${pr.title}${pr.url ? ` - ${pr.url}` : ""}`);
      if (pr.description) lines.push(pr.description);
      if (pr.technologies.length) lines.push(`Tech: ${pr.technologies.join(", ")}`);
    });
  }
  if (data.experience.length) {
    lines.push("", "EXPERIENCE");
    data.experience.forEach((e) => {
      lines.push(`${e.role} at ${e.company} (${e.startDate}-${e.isCurrently ? "Present" : e.endDate})`);
      if (e.description) lines.push(e.description);
      e.highlights.forEach((h) => lines.push(`- ${h}`));
    });
  }
  if (data.certifications.length) {
    lines.push("", "CERTIFICATIONS");
    data.certifications.forEach((c) => lines.push(`${c.name} - ${c.issuer}${c.date ? ` (${c.date})` : ""}`));
  }
  if (data.languages.length) {
    lines.push("", "LANGUAGES");
    lines.push(data.languages.map((l) => `${l.name} (${l.proficiency})`).join(", "));
  }
  const a = data.additional;
  if (a.achievements) lines.push("", "ACHIEVEMENTS", a.achievements);
  if (a.strengths) lines.push("", "STRENGTHS", a.strengths);
  if (a.hobbies) lines.push("", "HOBBES", a.hobbies);
  if (a.references.length) {
    lines.push("", "REFERENCES");
    a.references.forEach((r) => lines.push(`${r.name} - ${r.title}${r.email ? ` (${r.email})` : ""}`));
  }
  return lines.join("\n");
}
