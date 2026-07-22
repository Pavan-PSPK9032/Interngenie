"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Briefcase, Plus, X, Save, Loader2, CheckCircle2,
  Calendar, IndianRupee, MapPin, Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_SKILLS } from "@/lib/ai-engine";
import { cn } from "@/lib/utils";

const DOMAINS = [
  "Data Science", "Web Development", "Artificial Intelligence", "Backend Development",
  "DevOps", "Design", "Marketing", "Data Analytics", "Mobile Development",
  "Product Management", "Cybersecurity",
];

export function PostInternship() {
  const { user, token, navigate, pushToast } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibilities: [""],
    requirements: [""],
    benefits: [""],
    skills: [] as string[],
    domain: "",
    location: "",
    workMode: "onsite",
    duration: 12,
    stipend: 20000,
    openings: 1,
    deadline: "",
  });
  const [skillInput, setSkillInput] = useState("");

  const updateArrField = (field: "responsibilities" | "requirements" | "benefits", idx: number, val: string) => {
    const arr = [...form[field]];
    arr[idx] = val;
    setForm({ ...form, [field]: arr });
  };

  const addArrField = (field: "responsibilities" | "requirements" | "benefits") => {
    setForm({ ...form, [field]: [...form[field], ""] });
  };

  const removeArrField = (field: "responsibilities" | "requirements" | "benefits", idx: number) => {
    const arr = form[field].filter((_, i) => i !== idx);
    setForm({ ...form, [field]: arr.length ? arr : [""] });
  };

  const addSkill = (s: string) => {
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput("");
  };

  const submit = async () => {
    if (!form.title || !form.description || !form.domain || !form.location) {
      pushToast({ title: "Missing fields", message: "Please fill all required fields", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/internships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          responsibilities: form.responsibilities.filter(Boolean),
          requirements: form.requirements.filter(Boolean),
          benefits: form.benefits.filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ title: "Internship posted!", message: "Students can now apply", type: "success" });
        navigate("company-dashboard");
      } else {
        pushToast({ title: "Failed to post", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Post a New Internship</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reach 1.2M+ talented students with AI-powered matching
        </p>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Internship Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Data Science Intern"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the internship role, what the intern will work on, and what they'll learn..."
                className="mt-1.5 min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Domain *</Label>
                <Select value={form.domain} onValueChange={(v) => setForm({ ...form, domain: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Work Mode</Label>
                <Select value={form.workMode} onValueChange={(v) => setForm({ ...form, workMode: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location *</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Bengaluru, India"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Duration (weeks)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Stipend (₹/month)</Label>
                <Input
                  type="number"
                  value={form.stipend}
                  onChange={(e) => setForm({ ...form, stipend: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Openings</Label>
                <Input
                  type="number"
                  value={form.openings}
                  onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Application Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Required Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="flex flex-wrap gap-1.5">
              {ALL_SKILLS.slice(0, 20).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="text-xs px-2 py-1 rounded-md bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
              {form.skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1.5 py-1">
                  {s}
                  <button onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic arrays: responsibilities, requirements, benefits */}
        {[
          { field: "responsibilities" as const, label: "Responsibilities", placeholder: "e.g. Build ML models for recommendation systems" },
          { field: "requirements" as const, label: "Requirements / Eligibility", placeholder: "e.g. Strong Python and SQL skills" },
          { field: "benefits" as const, label: "Benefits & Perks", placeholder: "e.g. ₹35,000/month stipend + mentorship" },
        ].map((sec) => (
          <Card key={sec.field}>
            <CardHeader>
              <CardTitle className="text-lg">{sec.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {form[sec.field].map((val, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={val}
                    onChange={(e) => updateArrField(sec.field, idx, e.target.value)}
                    placeholder={sec.placeholder}
                  />
                  {form[sec.field].length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrField(sec.field, idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addArrField(sec.field)}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add {sec.label.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <div className="flex gap-3 sticky bottom-4">
          <Button
            variant="outline"
            onClick={() => navigate("company-dashboard")}
            className="glass-strong"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="flex-1 gradient-emerald text-white shadow-glow h-12 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Post Internship
          </Button>
        </div>
      </div>
    </div>
  );
}
