"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon, Phone, GraduationCap, MapPin, Link as LinkIcon,
  Briefcase, IndianRupee, Loader2, CheckCircle2, ArrowRight,
  ArrowLeft, Code, Target, Sparkles, Globe, Github, Linkedin,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SKILL_TAXONOMY, SKILL_CATEGORIES } from "@/lib/constants";

const DOMAINS = [
  "Data Science", "Web Development", "Artificial Intelligence", "Backend Development",
  "DevOps", "Design", "Marketing", "Data Analytics", "Mobile Development",
  "Product Management", "Cybersecurity",
];

const LOCATIONS = [
  "Bengaluru", "Hyderabad", "Chennai", "Mumbai", "Pune",
  "Noida", "Gurugram", "Delhi", "Remote",
];

const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const ROLE_TYPES = [
  "Software Developer", "Data Analyst", "ML Engineer", "UI/UX Designer",
  "Product Manager", "DevOps Engineer", "Full Stack Developer",
  "Backend Developer", "Frontend Developer", "Marketing Analyst",
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

export function ProfileWizard() {
  const { user, token, updateUser, pushToast, navigate } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [skillTab, setSkillTab] = useState<string>(SKILL_CATEGORIES[0] || "programming");

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    college: user?.college || "",
    degree: user?.degree || "",
    branch: user?.branch || "",
    cgpa: user?.cgpa || 5,
    graduationYear: user?.graduationYear || 2027,
    skills: user?.skills || [] as string[],
    interests: user?.interests || [] as string[],
    preferredLocations: user?.preferredLocations || [] as string[],
    linkedin: user?.linkedin || "",
    github: user?.github || "",
    portfolio: user?.portfolio || "",
    preferredRole: "",
    expectedStipend: 10000,
    preferredWorkMode: "",
  });

  const totalSteps = 7;
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const skip = () => next();

  const toggleSkill = (skill: string) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  };

  const toggleInterest = (interest: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  };

  const toggleLocation = (loc: string) => {
    setForm((f) => ({
      ...f,
      preferredLocations: f.preferredLocations.includes(loc)
        ? f.preferredLocations.filter((l) => l !== loc)
        : [...f.preferredLocations, loc],
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user || form);
        pushToast({ title: "Profile saved!", message: "Your profile has been set up.", type: "success" });
      } else {
        pushToast({ title: "Save failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full gradient-emerald flex items-center justify-center shadow-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Welcome to InternGenie</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Let&apos;s set up your profile in a few quick steps. This helps us find the best internship matches for you.
              </p>
            </div>
            <Button onClick={next} className="gradient-emerald text-white h-12 px-8 gap-2 shadow-glow">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Basic Information</h2>
                <p className="text-xs text-muted-foreground">Tell us about yourself</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">College / University</Label>
                <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="IIT Madras" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Degree</Label>
                <Input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="B.Tech" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Branch / Major</Label>
                <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="Computer Science" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Graduation Year</Label>
                <Input type="number" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs">CGPA: {form.cgpa.toFixed(1)} / 10</Label>
              <Slider value={[form.cgpa]} onValueChange={(v) => setForm({ ...form, cgpa: v[0] })} max={10} step={0.1} className="mt-2" />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Your Skills</h2>
                <p className="text-xs text-muted-foreground">
                  Pick the skills you know <Badge variant="secondary" className="ml-1 text-[10px]">{form.skills.length} selected</Badge>
                </p>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {SKILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSkillTab(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize",
                    skillTab === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Skills grid */}
            <div className="flex flex-wrap gap-2 min-h-[120px]">
              {(SKILL_TAXONOMY[skillTab] || []).map((skill) => {
                const selected = form.skills.includes(skill);
                return (
                  <motion.button
                    key={skill}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-muted/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {selected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {skill}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Interests & Location</h2>
                <p className="text-xs text-muted-foreground">What domains excite you?</p>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Domains of Interest</Label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map((d) => (
                  <motion.button
                    key={d}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleInterest(d)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.interests.includes(d)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-muted/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {form.interests.includes(d) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {d}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Preferred Locations</Label>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((loc) => (
                  <motion.button
                    key={loc}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleLocation(loc)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.preferredLocations.includes(loc)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-muted/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {form.preferredLocations.includes(loc) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {loc === "Remote" ? "Remote" : loc}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Online Presence</h2>
                <p className="text-xs text-muted-foreground">All fields are optional</p>
              </div>
            </div>

            <div className="space-y-4">
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
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Career Goals</h2>
                <p className="text-xs text-muted-foreground">Help us match you better</p>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Preferred Role Type</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_TYPES.map((role) => (
                  <motion.button
                    key={role}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm({ ...form, preferredRole: form.preferredRole === role ? "" : role })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.preferredRole === role
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-muted/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {form.preferredRole === role && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {role}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Preferred Work Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {WORK_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setForm({ ...form, preferredWorkMode: form.preferredWorkMode === m.value ? "" : m.value })}
                    className={cn(
                      "px-3 py-2.5 rounded-lg border text-xs font-medium transition-all",
                      form.preferredWorkMode === m.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">
                Expected Stipend: Rs.{form.expectedStipend.toLocaleString("en-IN")}/month
              </Label>
              <Slider
                value={[form.expectedStipend]}
                onValueChange={(v) => setForm({ ...form, expectedStipend: v[0] })}
                max={50000}
                step={1000}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Rs.0</span>
                <span>Rs.50,000</span>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={direction} className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full gradient-emerald flex items-center justify-center shadow-glow">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">All Set!</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Your profile is ready. We&apos;ll use this information to find the best internship matches for you.
              </p>
            </div>

            <Card className="max-w-sm mx-auto">
              <CardContent className="p-4 space-y-3">
                <div className="text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Skills</span>
                    <span className="font-medium">{form.skills.length} added</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Interests</span>
                    <span className="font-medium">{form.interests.length} selected</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Locations</span>
                    <span className="font-medium">{form.preferredLocations.length} selected</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Profile completion</span>
                    <span className="font-medium gradient-text">{Math.min(100, 30 + form.skills.length * 2 + form.interests.length * 3 + (form.linkedin ? 5 : 0) + (form.github ? 5 : 0))}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={async () => {
                await saveAll();
                navigate("student-dashboard");
              }}
              disabled={saving}
              className="gradient-emerald text-white h-12 px-8 gap-2 shadow-glow"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Go to Dashboard
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12 flex-1 flex flex-col">
        {/* Progress bar */}
        {step > 0 && step < totalSteps - 1 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Step {step} of {totalSteps - 2}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 flex items-center">
          <div className="w-full">
            <AnimatePresence mode="wait" custom={direction}>
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation buttons */}
        {step > 0 && step < totalSteps - 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/40">
            <Button variant="ghost" onClick={prev} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex gap-2">
              {step !== 1 && (
                <Button variant="outline" onClick={skip} className="gap-1.5">
                  Skip
                </Button>
              )}
              <Button onClick={next} className="gradient-emerald text-white gap-1.5 shadow-glow">
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
