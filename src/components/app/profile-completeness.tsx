"use client";
import { motion } from "framer-motion";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileCompleteness } from "@/lib/types";

export function ProfileCompleteness() {
  const { token, navigate } = useApp();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-completeness"],
    queryFn: async () => {
      const res = await fetch("/api/profile/completeness", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()) as ProfileCompleteness;
    },
    enabled: !!token,
  });

  const score = data?.score ?? 0;
  const missing = data?.suggestions?.filter((s) => s.missing) || [];
  const done = data?.suggestions?.filter((s) => s.done) || [];
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const goFix = (label: string) => {
    if (label.includes("projects") || label.includes("experience") || label.includes("certifications")) {
      navigate("student-profile");
    } else if (label.includes("resume")) {
      navigate("resume-builder");
    } else {
      navigate("profile-wizard");
    }
  };

  return (
    <Card className="glass-strong overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          {/* Progress ring */}
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
              <circle
                cx="64" cy="64" r={radius}
                fill="none" strokeWidth="10"
                className="stroke-muted/40"
              />
              <motion.circle
                cx="64" cy="64" r={radius}
                fill="none" strokeWidth="10" strokeLinecap="round"
                className={cn(
                  "stroke-[url(#pcm-gradient)]",
                  score >= 80 ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                )}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="pcm-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold gradient-text">{isLoading ? "--" : score}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">complete</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Profile Strength
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isLoading
                ? "Calculating your profile strength..."
                : score >= 80
                  ? "Great job! Your profile is recruiter-ready."
                  : score >= 50
                    ? "You're getting there. Complete a few more sections."
                    : "Let's boost your profile to get noticed by companies."}
            </p>

            {!isLoading && done.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {done.map((d, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {d.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Missing suggestions */}
        {!isLoading && missing.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Suggestions to reach 100%
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {missing.slice(0, 6).map((m, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30">
                  <span className="text-xs flex items-center gap-1.5 min-w-0">
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-primary shrink-0"
                    onClick={() => goFix(m.label)}
                  >
                    Fix
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && missing.length === 0 && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> All sections completed! Make your profile public to get discovered.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
