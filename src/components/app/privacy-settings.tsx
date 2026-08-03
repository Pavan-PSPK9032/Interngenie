"use client";
import { Shield, Loader2, Globe, Mail, Phone, Linkedin, Github, Briefcase, FolderGit2, Award, FileText, ScanLine } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileVisibility } from "@/lib/types";

const VISIBILITY_OPTIONS: Array<{ value: ProfileVisibility; label: string; hint: string }> = [
  { value: "public", label: "Public", hint: "Anyone can view your profile" },
  { value: "recruiters", label: "Recruiters", hint: "Only companies & admins" },
  { value: "private", label: "Private", hint: "Only you" },
];

export function PrivacySettings() {
  const { user, token, updateUser, pushToast } = useApp();
  const p = user?.privacySettings || {
    visibility: "public",
    profilePublic: true,
    showEmail: false,
    showPhone: false,
    showLinkedIn: true,
    showGitHub: true,
    showPortfolio: true,
    showCertificates: true,
    showProjects: true,
    showExperience: true,
    showAtsScore: true,
    showResume: true,
  };
  const [settings, setSettings] = useState(p);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ privacySettings: data.user.privacySettings });
        pushToast({ title: "Privacy settings saved", type: "success" });
      } else {
        pushToast({ title: "Save failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (k: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [k]: !s[k] }));

  const toggles: Array<{
    key: keyof typeof settings;
    label: string;
    icon: typeof Mail;
    hint: string;
  }> = [
    { key: "profilePublic", label: "Public profile", icon: Globe, hint: "Let companies discover you in search and view your profile" },
    { key: "showAtsScore", label: "ATS score", icon: ScanLine, hint: "Show your AI resume score on your public profile" },
    { key: "showResume", label: "Resume", icon: FileText, hint: "Let recruiters view and download your resume" },
    { key: "showEmail", label: "Email", icon: Mail, hint: "Show your email on your public profile" },
    { key: "showPhone", label: "Phone", icon: Phone, hint: "Show your phone number on your public profile" },
    { key: "showLinkedIn", label: "LinkedIn", icon: Linkedin, hint: "Show your LinkedIn link" },
    { key: "showGitHub", label: "GitHub", icon: Github, hint: "Show your GitHub link" },
    { key: "showPortfolio", label: "Portfolio", icon: Globe, hint: "Show your portfolio link" },
    { key: "showCertificates", label: "Certificates", icon: Award, hint: "Show your certificates" },
    { key: "showProjects", label: "Projects", icon: FolderGit2, hint: "Show your projects" },
    { key: "showExperience", label: "Experience", icon: Briefcase, hint: "Show your work experience" },
  ];

  return (
    <Card className={cn(settings.visibility !== "private" && "border-primary/30")}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Privacy & Visibility</h2>
            <p className="text-xs text-muted-foreground">Control what others can see on your profile</p>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <p className="text-xs font-semibold mb-2">Who can see your profile?</p>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSettings((s) => ({ ...s, visibility: opt.value, profilePublic: opt.value === "public" }))}
                className={cn(
                  "px-2 py-2 rounded-lg text-center transition-all",
                  settings.visibility === opt.value
                    ? "bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 text-white border border-white/10"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{opt.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {toggles.map((t) => (
            <button
              key={t.key}
              onClick={() => toggle(t.key)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                settings[t.key]
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/40 hover:border-primary/20"
              )}
            >
              <t.icon className={cn("w-4 h-4 shrink-0", settings[t.key] ? "text-primary" : "text-muted-foreground")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", settings[t.key] && "text-primary")}>{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.hint}</p>
              </div>
              <span
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors shrink-0",
                  settings[t.key] ? "bg-emerald-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                    settings[t.key] ? "left-5.5" : "left-0.5"
                  )}
                />
              </span>
            </button>
          ))}
        </div>

        <div
          className={cn(
            "rounded-xl p-3 text-xs flex items-center gap-2",
            settings.visibility === "private"
              ? "bg-muted text-muted-foreground"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}
        >
          <Globe className="w-4 h-4 shrink-0" />
          {settings.visibility === "private"
            ? "Your profile is private — only you can see it. Choose a wider audience to get discovered."
            : settings.visibility === "recruiters"
              ? "Your profile is visible to companies and admins for hiring and matching."
              : "Your profile is public — students, companies, and employers can find you in search."}
        </div>

        <Button onClick={save} disabled={saving} className="w-full gradient-emerald text-white gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Save Privacy Settings
        </Button>
      </CardContent>
    </Card>
  );
}
