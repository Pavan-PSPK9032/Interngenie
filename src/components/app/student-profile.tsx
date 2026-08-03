"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon, Mail, GraduationCap, Code, MapPin,
  Link as LinkIcon, FileText, Sparkles,
  CheckCircle2, XCircle, Loader2, Save, Brain, Target,
  Github, Linkedin, Globe, Camera, ImagePlus, Trash2, Crop,
  Move, Share2, Download, Pencil, Check, X, Award, Trophy,
  FolderGit2, Briefcase, Layers, Eye, Users, Search, BadgeCheck,
  ExternalLink, Clock, TrendingUp,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ALL_SKILLS } from "@/lib/constants";
import { CertificatesSection } from "@/components/app/certificates-section";
import { PrivacySettings } from "@/components/app/privacy-settings";
import { ProfileCompleteness } from "@/components/app/profile-completeness";
import { ProfileImageEditor } from "@/components/app/profile-image-editor";
import { ShareProfileModal } from "@/components/app/share-profile-modal";

type TabKey =
  | "about" | "education" | "skills" | "projects" | "experience"
  | "certificates" | "achievements" | "resume" | "internships" | "recommendations";

const TABS: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: "about", label: "About", icon: UserIcon },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "skills", label: "Skills", icon: Code },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "certificates", label: "Certificates", icon: Award },
  { key: "achievements", label: "Achievements", icon: Trophy },
  { key: "resume", label: "Resume", icon: FileText },
  { key: "internships", label: "Internships", icon: Layers },
  { key: "recommendations", label: "Recommendations", icon: Sparkles },
];

export function StudentProfile() {
  const { user, token, updateUser, pushToast, navigate, historyTick, lastHistoryDomain } = useApp();
  const queryClient = useQueryClient();
  const bannerRef = useRef<HTMLDivElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
    headline: user?.headline || "",
    location: user?.location || "",
    username: user?.username || "",
    careerObjective: user?.careerObjective || "",
    resumeText: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [shareOpen, setShareOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSrc, setEditorSrc] = useState("");
  const [editorKind, setEditorKind] = useState<"banner" | "avatar">("avatar");
  const [bannerPos, setBannerPos] = useState(user?.bannerPosition || "50% 50%");
  const [coverDragging, setCoverDragging] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username || "");

  // Resync the edit form whenever an undo/redo restores profile state
  useEffect(() => {
    if (lastHistoryDomain !== "user") return;
    const u = useApp.getState().user;
    if (!u) return;
    setForm({
      name: u.name || "",
      phone: u.phone || "",
      college: u.college || "",
      degree: u.degree || "",
      branch: u.branch || "",
      cgpa: u.cgpa || 0,
      graduationYear: u.graduationYear || 2027,
      skills: u.skills || [],
      interests: u.interests || [],
      preferredLocations: u.preferredLocations || [],
      languages: u.languages || [],
      linkedin: u.linkedin || "",
      github: u.github || "",
      portfolio: u.portfolio || "",
      headline: u.headline || "",
      location: u.location || "",
      username: u.username || "",
      careerObjective: u.careerObjective || "",
      resumeText: "",
    });
    setBannerPos(u.bannerPosition || "50% 50%");
    setUsernameDraft(u.username || "");
  }, [historyTick, lastHistoryDomain]);

  // Career suggestions
  const { data: careerData } = useQuery({
    queryKey: ["careers", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/careers", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  // Skill gap analysis
  const { data: gapData } = useQuery({
    queryKey: ["skill-gap", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/skill-gap", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  // Profile completeness
  const { data: completenessData } = useQuery({
    queryKey: ["profile-completeness"],
    queryFn: async () => {
      const res = await fetch("/api/profile/completeness", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  // Own full profile (ATS score, followers, views)
  const { data: meData } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const res = await fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  // Profile statistics
  const { data: statsData } = useQuery({
    queryKey: ["profile-stats"],
    queryFn: async () => {
      const res = await fetch("/api/profile/stats", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  // Applications (Internships tab)
  const { data: applicationsData } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const res = await fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  // Recommendations
  const { data: recData } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/recommendations", { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  const me = meData?.profile;
  const stats = statsData?.stats;
  const applications = applicationsData?.applications || [];
  const recommendations = recData?.recommendations || [];
  const atsScore = me?.atsScore ?? null;
  const profileViews = me?.profileViews ?? user?.profileViews ?? 0;
  const searchAppearances = me?.searchAppearances ?? user?.searchAppearances ?? 0;
  const followersCount = me?.followersCount ?? 0;
  const completion = completenessData?.score ?? user?.profileCompleted ?? 0;

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    if (!form.skills.includes(skill)) setForm({ ...form, skills: [...form.skills, skill] });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const patchProfile = async (patch: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        queryClient.invalidateQueries({ queryKey: ["profile-me"] });
        queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
        queryClient.invalidateQueries({ queryKey: ["profile-completeness"] });
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
        return true;
      }
      pushToast({ title: "Failed", message: data.error, type: "error" });
      return false;
    } catch {
      pushToast({ title: "Network error", type: "error" });
      return false;
    }
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        pushToast({ title: "Profile saved!", message: `Profile completion: ${data.user.profileCompleted}%`, type: "success" });
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
        queryClient.invalidateQueries({ queryKey: ["profile-me"] });
        queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
        queryClient.invalidateQueries({ queryKey: ["profile-completeness"] });
      } else {
        pushToast({ title: "Save failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

  const decodeImage = (dataUrl: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = dataUrl;
    });

  const handleFile = async (file: File | undefined, kind: "banner" | "avatar") => {
    if (!file) {
      pushToast({ title: "No file selected", message: "Please pick an image to continue", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      pushToast({ title: "File too large", message: "Maximum size is 5 MB", type: "error" });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await decodeImage(dataUrl);
      setEditorKind(kind);
      setEditorSrc(dataUrl);
      setEditorOpen(true);
    } catch {
      pushToast({ title: "Could not read this image", message: `${file.name} isn't a valid image`, type: "error" });
    }
  };

  const applyEditedImage = async (dataUrl: string) => {
    const patch = editorKind === "banner" ? { bannerUrl: dataUrl } : { avatarUrl: dataUrl };
    const ok = await patchProfile(patch);
    if (ok) {
      pushToast({ title: editorKind === "banner" ? "Cover banner updated" : "Profile photo updated", type: "success" });
      if (editorKind === "avatar") updateUser({ avatarUrl: dataUrl });
    }
    setEditorOpen(false);
  };

  const removeBanner = async () => {
    const ok = await patchProfile({ bannerUrl: "" });
    if (ok) pushToast({ title: "Cover banner removed", type: "success" });
  };

  const removeAvatar = async () => {
    const ok = await patchProfile({ avatarUrl: "" });
    if (ok) pushToast({ title: "Profile photo removed", type: "success" });
  };

  const onCoverPointerMove = (e: React.PointerEvent) => {
    if (!coverDragging || !bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setBannerPos(`${x.toFixed(0)}% ${y.toFixed(0)}%`);
  };

  const onCoverPointerUp = async () => {
    if (!coverDragging) return;
    setCoverDragging(false);
    const ok = await patchProfile({ bannerPosition: bannerPos });
    if (ok) pushToast({ title: "Banner position saved", type: "success" });
  };

  const saveUsername = async () => {
    const val = usernameDraft.trim().toLowerCase().replace(/^@/, "");
    if (val === user?.username) {
      setEditingUsername(false);
      return;
    }
    const ok = await patchProfile({ username: val });
    if (ok) {
      setForm((f) => ({ ...f, username: val }));
      pushToast({ title: "Username updated", message: `Your profile is now at /profile/${val}`, type: "success" });
      setEditingUsername(false);
    }
  };

  const downloadResume = async () => {
    if (user?.resumeUrl) {
      window.open(user.resumeUrl, "_blank");
      return;
    }
    if (user?.resumeText) {
      const blob = new Blob([user.resumeText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.name.replace(/\s+/g, "_")}_Resume.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    pushToast({ title: "No resume yet", message: "Build your resume in the Resume Builder", type: "info" });
    navigate("resume-builder");
  };

  if (!user) return null;

  const header = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl glass-card border-white/[0.08] shadow-premium"
    >
      {/* ── Cover banner ─────────────────────────────── */}
      <div
        ref={bannerRef}
        onPointerMove={onCoverPointerMove}
        onPointerUp={onCoverPointerUp}
        className={cn("relative h-44 sm:h-56 md:h-[280px] w-full select-none", coverDragging && "cursor-grabbing")}
      >
        {form.bannerUrl || user?.bannerUrl ? (
          <img
            src={form.bannerUrl || user?.bannerUrl}
            alt="Cover banner"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: bannerPos }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-violet-600/35 to-cyan-500/50">
            <div className="absolute -top-16 -right-16 w-72 h-72 orb-indigo animate-float-slow" />
            <div className="absolute -bottom-24 left-1/4 w-80 h-80 orb-cyan animate-blob" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        )}

        {coverDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-white/20 text-xs font-medium">
              <Move className="w-4 h-4" /> Drag to reposition
            </div>
          </div>
        )}

        {/* Banner actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("resume-builder")}
            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white border border-white/20 rounded-full h-8 text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Improve with AI
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="bg-white/10 hover:bg-white/20 backdrop-blur text-white border border-white/20 rounded-full h-8 w-8"
                aria-label="Edit banner"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-white/10">
              <DropdownMenuItem onClick={() => bannerInputRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" /> Upload / Change
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCoverDragging(true)}>
                <Move className="w-4 h-4 mr-2" /> Reposition
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={removeBanner} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Remove Banner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Profile photo + identity ─────────────────── */}
      <div className="px-5 sm:px-7 pb-5">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16 sm:-mt-20 md:-mt-24">
          <div className="relative shrink-0">
            <Avatar className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 border-4 border-background shadow-glow">
              {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
              <AvatarFallback className="text-white text-4xl font-bold">
                {(form.name || user.name || "S").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-400 border-[3px] border-background" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full gradient-primary text-white flex items-center justify-center shadow-glow border-2 border-background hover:scale-105 transition-transform"
                  aria-label="Edit profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 glass-card border-white/10">
                <DropdownMenuItem onClick={() => avatarInputRef.current?.click()}>
                  <ImagePlus className="w-4 h-4 mr-2" /> Upload / Replace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => avatarInputRef.current?.click()}>
                  <Crop className="w-4 h-4 mr-2" /> Crop, Zoom &amp; Rotate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={removeAvatar} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Photo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 min-w-0 pt-3 md:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {form.name || user.name}
            </h1>

            {/* Username */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {editingUsername ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">@</span>
                  <Input
                    value={usernameDraft}
                    onChange={(e) => setUsernameDraft(e.target.value.replace(/^@/, ""))}
                    className="h-7 w-44 px-2 text-sm"
                    placeholder="username"
                  />
                  <button onClick={saveUsername} className="text-emerald-500 hover:text-emerald-400 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingUsername(false); setUsernameDraft(user?.username || ""); }} className="text-muted-foreground hover:text-foreground p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingUsername(true); setUsernameDraft(user?.username || ""); }}
                  className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  title="Edit username"
                >
                  <span className="flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4 text-cyan-400" />
                    @{user?.username || "username"}
                  </span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">{form.headline || "Computer Science Student"}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {form.college && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> {form.college}
                </span>
              )}
              {(form.location || user?.location) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {form.location || user?.location}
                </span>
              )}
              {form.degree && <span>{[form.degree, form.branch].filter(Boolean).join(" · ")}</span>}
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {followersCount} followers
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 md:pt-0">
            <Button size="sm" className="gradient-primary text-white shadow-glow gap-1.5 text-xs" onClick={() => setActiveTab("about")}>
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="gap-1.5 text-xs">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            <Button size="sm" variant="outline" onClick={downloadResume} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Resume
            </Button>
          </div>
        </div>

        {/* Completion + ATS bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>Profile completion</span>
              <span className="font-semibold">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {completion >= 80
                ? "Great job! Your profile is recruiter-ready."
                : "A complete profile gets up to 4x more applications."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-center">
              <div className="text-xl font-bold gradient-text">{completion}%</div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Complete</p>
            </div>
            {atsScore != null && (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-center">
                <div className={cn(
                  "text-xl font-bold",
                  atsScore >= 80 ? "text-emerald-400" : atsScore >= 50 ? "text-amber-400" : "text-red-400"
                )}>
                  {atsScore}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ATS Score</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const statsRow = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      <StatCard label="Profile Views" value={profileViews} icon={<Eye className="w-4 h-4" />} />
      <StatCard label="Search Appearances" value={searchAppearances} icon={<Search className="w-4 h-4" />} />
      <StatCard label="Followers" value={followersCount} icon={<Users className="w-4 h-4" />} />
      <StatCard label="Applications" value={stats?.applications ?? applications.length} icon={<Layers className="w-4 h-4" />} />
      <StatCard label="Completed Internships" value={stats?.completedInternships ?? 0} icon={<Briefcase className="w-4 h-4" />} />
      <StatCard label="Certificates" value={stats?.certificates ?? 0} icon={<Award className="w-4 h-4" />} />
      <StatCard label="Projects" value={stats?.projects ?? 0} icon={<FolderGit2 className="w-4 h-4" />} />
      <StatCard label="ATS Score" value={atsScore ?? 0} icon={<TrendingUp className="w-4 h-4" />} />
      <StatCard label="Profile Completion" value={`${completion}%`} icon={<CheckCircle2 className="w-4 h-4" />} />
    </motion.div>
  );

  const tabBar = (
    <div className="sticky top-[84px] z-30 -mx-1 px-1 glass-card border-white/10 rounded-2xl">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "relative shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors",
              activeTab === t.key ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === t.key && (
              <motion.span
                layoutId="profile-tab-active"
                className="absolute inset-0 bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 border border-white/10 rounded-xl"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-5">
      {header}
      {statsRow}
      {tabBar}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "about" && (
                <AboutTab
                  form={form}
                  setForm={setForm}
                  userEmail={user.email}
                  onSaveUsername={saveUsername}
                  usernameDraft={usernameDraft}
                  setUsernameDraft={setUsernameDraft}
                  editingUsername={editingUsername}
                  setEditingUsername={setEditingUsername}
                />
              )}
              {activeTab === "education" && <EducationTab form={form} setForm={setForm} />}
              {activeTab === "skills" && (
                <SkillsTab
                  form={form}
                  skillInput={skillInput}
                  setSkillInput={setSkillInput}
                  addSkill={addSkill}
                  removeSkill={removeSkill}
                />
              )}
              {activeTab === "projects" && <ProjectsTab projects={user.projects || []} onNavigate={navigate} />}
              {activeTab === "experience" && <ExperienceTab experience={user.experience || []} onNavigate={navigate} />}
              {activeTab === "certificates" && <CertificatesSection />}
              {activeTab === "achievements" && <AchievementsTab achievements={user.achievements || []} onNavigate={navigate} />}
              {activeTab === "resume" && (
                <ResumeTab
                  user={user}
                  form={form}
                  setForm={setForm}
                  parsing={parsing}
                  parseResume={parseResume}
                  downloadResume={downloadResume}
                  navigate={navigate}
                />
              )}
              {activeTab === "internships" && (
                <InternshipsTab applications={applications} onNavigate={navigate} />
              )}
              {activeTab === "recommendations" && (
                <RecommendationsTab recommendations={recommendations} onNavigate={navigate} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Sticky save bar */}
          <div className="sticky bottom-4 z-30">
            <div className="glass-card border-white/10 shadow-premium rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold">Unsaved changes</p>
                <p className="text-[10px] text-muted-foreground truncate">Keep your profile updated to stay discoverable</p>
              </div>
              <Button onClick={save} disabled={saving} className="gradient-emerald text-white shadow-glow gap-1.5 shrink-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <ProfileCompleteness />
          <PrivacySettings />
          <CareerCard careerData={careerData} />
          <GapCard gapData={gapData} />
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0], "banner"); e.target.value = ""; }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0], "avatar"); e.target.value = ""; }}
      />

      {editorOpen && (
        <ProfileImageEditor
          open={editorOpen}
          src={editorSrc}
          aspect={editorKind === "banner" ? 3.2 : 1}
          shape={editorKind === "banner" ? "rect" : "circle"}
          title={editorKind === "banner" ? "Crop Cover Banner" : "Edit Profile Photo"}
          onClose={() => setEditorOpen(false)}
          onSave={applyEditedImage}
        />
      )}
      <ShareProfileModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card className="glass-card border-white/[0.08]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none truncate">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── About ─────────────────────────────────────────── */
function AboutTab({
  form, setForm, userEmail, editingUsername, setEditingUsername, usernameDraft, setUsernameDraft,
}: {
  form: any; setForm: any; userEmail: string;
  editingUsername: boolean; setEditingUsername: (v: boolean) => void;
  usernameDraft: string; setUsernameDraft: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="w-5 h-5 text-primary" /> About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="Computer Science Student | Aspiring Full Stack Developer"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Summary / Career Objective</Label>
            <Textarea
              value={form.careerObjective}
              onChange={(e) => setForm({ ...form, careerObjective: e.target.value })}
              placeholder="Tell recruiters about yourself..."
              className="mt-1 min-h-[110px] resize-none text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Bengaluru, Karnataka, India"
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-primary" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Username</Label>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm text-muted-foreground">@</span>
              <Input
                value={editingUsername ? usernameDraft : form.username}
                onChange={(e) => { setUsernameDraft(e.target.value.replace(/^@/, "")); setForm({ ...form, username: e.target.value.replace(/^@/, "") }); }}
                placeholder="username"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={userEmail} disabled className="mt-1 bg-muted/50" />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="w-5 h-5 text-primary" /> Online Presence
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-primary" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Preferred Locations (comma separated)</Label>
            <Input
              value={form.preferredLocations.join(", ")}
              onChange={(e) =>
                setForm({ ...form, preferredLocations: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })
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
                setForm({ ...form, interests: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })
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
                setForm({ ...form, languages: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })
              }
              placeholder="English, Hindi, Telugu"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Education ─────────────────────────────────────── */
function EducationTab({ form, setForm }: { form: any; setForm: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="w-5 h-5 text-primary" /> Education
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
  );
}

/* ─── Skills ────────────────────────────────────────── */
function SkillsTab({
  form, skillInput, setSkillInput, addSkill, removeSkill,
}: {
  form: any; skillInput: string; setSkillInput: (v: string) => void;
  addSkill: (s: string) => void; removeSkill: (s: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code className="w-5 h-5 text-primary" /> Skills
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

        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
          {form.skills.map((s: string) => (
            <motion.div key={s} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Badge variant="secondary" className="gap-1 pr-1.5 py-1">
                {s}
                <button onClick={() => removeSkill(s)} className="ml-1 hover:text-destructive rounded-full">
                  <XCircle className="w-3 h-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
          {form.skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Projects ──────────────────────────────────────── */
function ProjectsTab({ projects, onNavigate }: { projects: Array<Record<string, any>>; onNavigate: (v: any) => void }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-primary" /> Projects
            <Badge variant="secondary" className="text-[10px]">{projects.length}</Badge>
          </h2>
        </div>
        {projects.length === 0 ? (
          <div className="py-8 text-center">
            <FolderGit2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => onNavigate("resume-builder")}>
              <Sparkles className="w-3.5 h-3.5" /> Add projects in Resume Builder
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {projects.map((p, i) => (
                <div key={i} className="p-4 rounded-xl glass-card border-white/[0.08]">
                  <p className="text-sm font-semibold">{p.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  {p.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.technologies.map((t: string) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">{t}</span>
                      ))}
                    </div>
                  )}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-2">
                      <ExternalLink className="w-3 h-3" /> {p.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onNavigate("resume-builder")}>
              <Pencil className="w-3.5 h-3.5" /> Edit in Resume Builder
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Experience ────────────────────────────────────── */
function ExperienceTab({ experience, onNavigate }: { experience: Array<Record<string, any>>; onNavigate: (v: any) => void }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Experience
          <Badge variant="secondary" className="text-[10px]">{experience.length}</Badge>
        </h2>
        {experience.length === 0 ? (
          <div className="py-8 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No experience added yet</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => onNavigate("resume-builder")}>
              <Sparkles className="w-3.5 h-3.5" /> Add experience in Resume Builder
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {experience.map((exp, i) => (
                <div key={i} className="p-4 rounded-xl glass-card border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{exp.role || "Role"}</p>
                    {exp.startDate && (
                      <span className="text-[10px] text-muted-foreground">
                        {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary mt-0.5">{exp.company}</p>
                  <p className="text-xs mt-1.5 line-clamp-3">{exp.description}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onNavigate("resume-builder")}>
              <Pencil className="w-3.5 h-3.5" /> Edit in Resume Builder
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Achievements ──────────────────────────────────── */
function AchievementsTab({ achievements, onNavigate }: { achievements: string[]; onNavigate: (v: any) => void }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Achievements
          <Badge variant="secondary" className="text-[10px]">{achievements.length}</Badge>
        </h2>
        {achievements.length === 0 ? (
          <div className="py-8 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No achievements yet</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => onNavigate("resume-builder")}>
              <Sparkles className="w-3.5 h-3.5" /> Add achievements in Resume Builder
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {achievements.map((a, i) => (
              <li key={i} className="flex items-start gap-2 p-3 rounded-xl glass-card border-white/[0.08] text-sm">
                <Trophy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Resume ────────────────────────────────────────── */
function ResumeTab({
  user, form, setForm, parsing, parseResume, downloadResume, navigate,
}: {
  user: any; form: any; setForm: any; parsing: boolean;
  parseResume: () => void; downloadResume: () => void; navigate: (v: any) => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> My Resume
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {user.resumeUrl || user.resumeText ? "Your resume is ready to download." : "No resume uploaded yet."}
              </p>
            </div>
            <div className="flex gap-2">
              {user.resumeUrl && (
                <a href={user.resumeUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> Open PDF
                  </Button>
                </a>
              )}
              <Button size="sm" className="gradient-emerald text-white gap-1.5 text-xs" onClick={downloadResume}>
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("resume-builder")}>
                <Sparkles className="w-3.5 h-3.5" /> Build / Edit
              </Button>
            </div>
          </div>

          {user.resumeText && (
            <div className="rounded-xl bg-black/20 border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Resume text preview</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6 font-sans">{user.resumeText.slice(0, 900)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" /> AI Resume Parser
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
          <Button onClick={parseResume} disabled={parsing} className="w-full gradient-emerald text-white gap-2">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Parse with AI
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Internships ───────────────────────────────────── */
function InternshipsTab({ applications, onNavigate }: { applications: Array<Record<string, any>>; onNavigate: (v: any) => void }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> My Internships
          <Badge variant="secondary" className="text-[10px]">{applications.length}</Badge>
        </h2>
        {applications.length === 0 ? (
          <div className="py-8 text-center">
            <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">You haven't applied to any internships yet</p>
            <Button size="sm" className="gradient-primary text-white mt-3 gap-1.5 text-xs" onClick={() => onNavigate("internships")}>
              <Briefcase className="w-3.5 h-3.5" /> Browse Internships
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate("internship-detail", { internshipId: a.internshipId })}
                className="w-full text-left p-4 rounded-xl glass-card border-white/[0.08] hover:border-primary/30 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{a.internship?.title || "Internship"}</p>
                  <Badge className={cn(
                    "text-[9px] shrink-0",
                    a.status === "SELECTED" ? "bg-emerald-500/15 text-emerald-400" :
                    a.status === "INTERVIEW" ? "bg-amber-500/15 text-amber-400" :
                    a.status === "REJECTED" ? "bg-red-500/15 text-red-400" :
                    "bg-primary/15 text-primary"
                  )}>
                    {a.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.internship?.company?.name || ""} {a.matchScore != null && `· ${a.matchScore}% match`}
                </p>
                <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Applied {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Recommendations ──────────────────────────────── */
function RecommendationsTab({ recommendations, onNavigate }: { recommendations: Array<Record<string, any>>; onNavigate: (v: any) => void }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Recommended For You
          <Badge variant="secondary" className="text-[10px]">{recommendations.length}</Badge>
        </h2>
        {recommendations.length === 0 ? (
          <div className="py-8 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Complete your profile and add skills to get AI-powered matches</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => onNavigate("student-profile")}>
              <UserIcon className="w-3.5 h-3.5" /> Improve Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate("internship-detail", { internshipId: r.id })}
                className="w-full text-left p-4 rounded-xl glass-card border-white/[0.08] hover:border-primary/30 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{r.title}</p>
                  <Badge className="gradient-primary text-white text-[9px] shrink-0">{r.matchScore}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.company?.name || ""} {r.location && `· ${r.location}`} {r.workMode && `· ${r.workMode}`}
                </p>
                {r.matchingSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {r.matchingSkills.slice(0, 4).map((sk: string) => (
                      <Badge key={sk} variant="outline" className="text-[9px]">{sk}</Badge>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Right rail cards ──────────────────────────────── */
function CareerCard({ careerData }: { careerData: any }) {
  return (
    <Card className="glass-card border-white/[0.08]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> Career Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(careerData?.careers || []).slice(0, 3).map((c: any, i: number) => (
          <div key={i} className="p-3 rounded-xl glass-card border-white/[0.08]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold">{c.title}</p>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-md",
                c.matchScore >= 70 ? "bg-emerald-500/10 text-emerald-500" :
                c.matchScore >= 40 ? "bg-amber-500/10 text-amber-500" :
                "bg-white/[0.05] text-muted-foreground"
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
  );
}

function GapCard({ gapData }: { gapData: any }) {
  return (
    <Card className="glass-card border-white/[0.08]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Skill Gap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {(gapData?.gaps || []).slice(0, 5).map((g: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="font-medium">{g.skill}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px]">in {g.frequency} internships</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                g.importance === "critical" ? "bg-red-500/10 text-red-500" :
                g.importance === "recommended" ? "bg-amber-500/10 text-amber-500" :
                "bg-white/[0.05] text-muted-foreground"
              )}>
                {g.importance}
              </span>
            </div>
          </div>
        ))}
        {(gapData?.gaps || []).length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No skill gaps detected!</p>
        )}
      </CardContent>
    </Card>
  );
}
