"use client";
import { motion } from "framer-motion";
import {
  User as UserIcon, Mail, Phone, GraduationCap, Code, MapPin,
  Languages, Link as LinkIcon, Upload, FileText, Sparkles,
  CheckCircle2, XCircle, Loader2, Save, Brain, Target,
  Github, Linkedin, Globe,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ALL_SKILLS, SKILL_CATEGORIES, SKILL_TAXONOMY } from "@/lib/constants";
import { CertificatesSection } from "@/components/app/certificates-section";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { ProfileCompleteness } from "@/components/app/profile-completeness";

export function StudentProfile() {
  const { user, token, updateUser, pushToast, navigate } = useApp();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    college: user?.college || "",
    degree: user?.degree || "",
    branch: user?.branch || "",
    cgpa: user?.cgpa || 0,
    graduationYear: user?.graduationYear || 2027,
    skills: user?.skills || [],
    interests: user?.interests || [],
    preferredLocations: user?.preferredLocations || [],
    languages: user?.languages || [],
    linkedin: user?.linkedin || "",
    github: user?.github || "",
    portfolio: user?.portfolio || "",
    resumeText: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Career suggestions
  const { data: careerData } = useQuery({
    queryKey: ["careers", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/careers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  // Skill gap analysis
  const { data: gapData } = useQuery({
    queryKey: ["skill-gap", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/skill-gap", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  // Profile completeness
  const { data: completenessData } = useQuery({
    queryKey: ["profile-completeness"],
    queryFn: async () => {
      const res = await fetch("/api/profile/completeness", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    if (!form.skills.includes(skill)) {
      setForm({ ...form, skills: [...form.skills, skill] });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const parseResume = async () => {
    if (form.resumeText.length < 20) {
      pushToast({ title: "Resume too short", message: "Paste at least 200 characters", type: "error" });
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: form.resumeText }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, skills: data.mergedSkills }));
        updateUser({
          skills: data.mergedSkills,
          profileCompleted: Math.min(100, (user?.profileCompleted || 0) + 15),
        });
        pushToast({
          title: "Resume parsed!",
          message: `Extracted ${data.parsed.skills.length} skills, ${data.parsed.education.length} education entries`,
          type: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      } else {
        pushToast({ title: "Parse failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        pushToast({ title: "Profile saved!", message: `Profile completion: ${data.user.profileCompleted}%`, type: "success" });
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      } else {
        pushToast({ title: "Save failed", type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* LinkedIn-style cover header */}
      <div className="relative overflow-hidden rounded-3xl glass-card border-white/[0.08] shadow-premium">
        <div className="relative h-36 md:h-44 bg-gradient-to-br from-indigo-600/40 via-violet-600/30 to-cyan-500/40">
          <div className="absolute -top-16 -right-16 w-64 h-64 orb-indigo animate-float-slow" />
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 orb-cyan animate-blob" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <button
            onClick={() => navigate("resume-builder")}
            className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full px-3 py-1.5 border border-white/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Improve with AI
          </button>
        </div>

        <div className="px-5 sm:px-7 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-14">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl gradient-primary flex items-center justify-center border-4 border-background shadow-glow">
                <span className="text-3xl font-bold text-white">
                  {(form.name || user.name || "S").charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-background" />
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                {form.name || user.name}
              </h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px]">
                  {user.role}
                </Badge>
                {(form.college || form.degree) && (
                  <Badge variant="secondary" className="text-[10px]">
                    {[form.degree, form.branch].filter(Boolean).join(" · ") || form.college}
                  </Badge>
                )}
                {form.skills.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{form.skills.length} skills</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {completenessData?.score ?? user.profileCompleted}%
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Complete</p>
              </div>
            </div>
          </div>

          <Progress value={user.profileCompleted} className="h-2 mt-5" />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-muted-foreground">
              {(completenessData?.score ?? user.profileCompleted) >= 80
                ? "Great job! Your profile is recruiter-ready."
                : "Keep completing sections to boost your AI match score."}
            </p>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              A complete profile gets up to 4x more applications
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Personal details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon className="w-5 h-5 text-primary" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={user.email} disabled className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Graduation Year</Label>
                <Input
                  type="number"
                  value={form.graduationYear}
                  onChange={(e) => setForm({ ...form, graduationYear: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
                Academic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">College</Label>
                <Input
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  placeholder="IIT Madras"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Degree</Label>
                <Input
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  placeholder="B.Tech"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Branch</Label>
                <Input
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  placeholder="Computer Science"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">CGPA</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.cgpa}
                  onChange={(e) => setForm({ ...form, cgpa: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="w-5 h-5 text-primary" />
                Skills
                <Badge variant="secondary" className="text-[10px]">{form.skills.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Add a skill (e.g. Python, React)..."
                  className="flex-1"
                />
                <Button onClick={() => addSkill(skillInput)} size="sm" className="gradient-emerald text-white">
                  Add
                </Button>
              </div>

              {/* Suggested skills */}
              <div className="flex flex-wrap gap-1.5">
                {ALL_SKILLS
                  .filter((s) => !form.skills.includes(s))
                  .slice(0, 15)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="text-xs px-2 py-1 rounded-md bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
              </div>

              {/* Selected skills */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
                {form.skills.map((s) => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Badge variant="secondary" className="gap-1 pr-1.5 py-1">
                      {s}
                      <button
                        onClick={() => removeSkill(s)}
                        className="ml-1 hover:text-destructive rounded-full"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
                {form.skills.length === 0 && (
                  <p className="text-xs text-muted-foreground">No skills added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resume parser */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Resume Parser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Paste your resume text below. Our AI will extract skills, education, projects, and experience automatically.
              </p>
              <Textarea
                value={form.resumeText}
                onChange={(e) => setForm({ ...form, resumeText: e.target.value })}
                placeholder="Paste your resume text here..."
                className="min-h-[160px] resize-none text-xs font-mono"
              />
              <Button
                onClick={parseResume}
                disabled={parsing}
                className="w-full gradient-emerald text-white gap-2"
              >
                {parsing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Parse with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Preferred Locations (comma separated)</Label>
                <Input
                  value={form.preferredLocations.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferredLocations: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Bengaluru, Remote, Hyderabad"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Interests (comma separated)</Label>
                <Input
                  value={form.interests.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      interests: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Data Science, Web Development, AI"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Languages (comma separated)</Label>
                <Input
                  value={form.languages.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="English, Hindi, Telugu"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="w-5 h-5 text-primary" />
                Online Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Certificates */}
          <CertificatesSection />

          {/* Privacy settings */}
          <PrivacySettings />

          <Button
            onClick={save}
            disabled={saving}
            className="w-full gradient-emerald text-white shadow-glow h-12 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </Button>
        </div>

        {/* Sidebar: AI insights */}
        <div className="space-y-4">
          {/* Career suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Career Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(careerData?.careers || []).slice(0, 3).map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-border/40 bg-card/30">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{c.title}</p>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-md",
                      c.matchScore >= 70 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                      c.matchScore >= 40 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {c.matchScore}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.domain}</p>
                  <p className="text-[11px] mt-1">{c.reason}</p>
                  {c.missingSkills.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Missing: {c.missingSkills.slice(0, 3).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skill gap analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Skill Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(gapData?.gaps || []).slice(0, 5).map((g: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{g.skill}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">in {g.frequency} internships</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      g.importance === "critical" ? "bg-red-500/10 text-red-700 dark:text-red-400" :
                      g.importance === "recommended" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {g.importance}
                    </span>
                  </div>
                </div>
              ))}
              {(gapData?.gaps || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No skill gaps detected!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Profile completeness */}
          <ProfileCompleteness />
        </div>
      </div>
    </div>
  );
}
