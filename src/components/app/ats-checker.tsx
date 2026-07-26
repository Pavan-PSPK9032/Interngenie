"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Loader2, AlertTriangle, CheckCircle2,
  ArrowRight, RefreshCw, Target, Lightbulb, ChevronDown, ChevronUp,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ATSReport } from "@/lib/types";

export function ATSChecker() {
  const { resumeData, navigate, token, pushToast } = useApp();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const importFromBuilder = () => {
    if (!resumeData) {
      pushToast({ title: "No resume data", message: "Build a resume first", type: "error" });
      return;
    }
    const lines: string[] = [];
    const p = resumeData.personal;
    lines.push(p.name, p.email, p.phone, p.address, p.careerObjective);
    resumeData.education.forEach((e) => lines.push(`${e.degree} ${e.branch} ${e.institution}`));
    resumeData.skills.forEach((s) => lines.push(s.name));
    resumeData.projects.forEach((pr) => { lines.push(pr.title, pr.description, pr.technologies.join(" ")); });
    resumeData.experience.forEach((e) => { lines.push(e.role, e.company, e.description, e.highlights.join(" ")); });
    resumeData.certifications.forEach((c) => lines.push(`${c.name} ${c.issuer}`));
    resumeData.languages.forEach((l) => lines.push(l.name));
    setText(lines.filter(Boolean).join("\n"));
    pushToast({ title: "Imported from Resume Builder", type: "success" });
  };

  const analyze = async () => {
    if (text.trim().length < 20) {
      pushToast({ title: "Text too short", message: "Enter at least 20 characters", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ats/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report || data);
      } else {
        pushToast({ title: "Analysis failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const scoreColor = (score: number) => score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const scoreBg = (score: number) => score >= 80 ? "stroke-emerald-500" : score >= 60 ? "stroke-amber-500" : "stroke-red-500";
  const gradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (grade.startsWith("B")) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (grade.startsWith("C")) return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ATS Score Checker</h1>
        <p className="text-sm text-muted-foreground mt-1">Analyze your resume against Applicant Tracking Systems</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" /> Resume Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={importFromBuilder} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Import from Resume Builder
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your resume text here or import from the Resume Builder..."
            className="min-h-[200px] resize-none text-xs font-mono"
          />
          <Button onClick={analyze} disabled={loading} className="w-full gradient-emerald text-white gap-2 shadow-glow">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analyzing..." : "Analyze Resume"}
          </Button>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-6">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Score Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                    <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round" className={scoreBg(report.score)}
                      strokeDasharray={`${(report.score / 100) * 314} 314`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-3xl font-bold", scoreColor(report.score))}>{report.score}</span>
                    <span className="text-[10px] text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold">ATS Score</h2>
                    <Badge className={cn("text-sm px-3 py-1", gradeColor(report.grade))}>{report.grade}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.score >= 80 ? "Excellent! Your resume is well-optimized for ATS systems." :
                     report.score >= 60 ? "Good, but there's room for improvement." :
                     "Your resume needs significant improvements for ATS compatibility."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary" /> Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(report.breakdown).map(([key, item]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-sm text-muted-foreground">{item.score}/{item.max}</span>
                  </div>
                  <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / item.max) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full rounded-full",
                        (item.score / item.max) >= 0.8 ? "bg-emerald-500" :
                        (item.score / item.max) >= 0.6 ? "bg-amber-500" : "bg-red-500"
                      )}
                    />
                  </div>
                  {item.details && <p className="text-[11px] text-muted-foreground">{item.details}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Missing Keywords & Suggested Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {report.missingKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[11px] border-amber-300 text-amber-700 dark:text-amber-400">{kw}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No missing keywords detected</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" /> Suggested Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.suggestedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {report.suggestedSkills.map((sk, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">{sk}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No skill suggestions at this time</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Improvements */}
          <Card>
            <CardHeader className="pb-3">
              <button onClick={() => toggleSection("improvements")} className="flex items-center justify-between w-full">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Improvements ({report.improvements.length})
                </CardTitle>
                {expandedSections.improvements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </CardHeader>
            {expandedSections.improvements && (
              <CardContent className="space-y-2">
                {report.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Bullet Points */}
          <Card>
            <CardHeader className="pb-3">
              <button onClick={() => toggleSection("bullets")} className="flex items-center justify-between w-full">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Bullet Point Suggestions ({report.bulletPointSuggestions.length})
                </CardTitle>
                {expandedSections.bullets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </CardHeader>
            {expandedSections.bullets && (
              <CardContent className="space-y-2">
                {report.bulletPointSuggestions.map((bp, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30">
                    <span className="text-primary shrink-0">-</span>
                    <span className="italic">{bp}</span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Summary Suggestion */}
          {report.summarySuggestion && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Suggested Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm p-3 rounded-lg bg-primary/5 border border-primary/10 leading-relaxed">
                  {report.summarySuggestion}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("resume-builder")} className="gradient-emerald text-white gap-2 shadow-glow">
              <ArrowRight className="w-4 h-4" /> Regenerate Resume
            </Button>
            <Button variant="outline" onClick={() => { setReport(null); setText(""); }} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Analyze Another
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
