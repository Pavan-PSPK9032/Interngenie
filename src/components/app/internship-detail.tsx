"use client";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Briefcase, Calendar, IndianRupee, Star,
  Heart, Share2, CheckCircle2, XCircle, Sparkles, Zap,
  Building2, ExternalLink, Clock, Users, Loader2, Send, Award,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function InternshipDetail() {
  const { selectedInternshipId, navigate, user, token, savedInternships, toggleSaved, pushToast } = useApp();
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["internship", selectedInternshipId],
    queryFn: async () => {
      const res = await fetch(`/api/internships/${selectedInternshipId}`);
      if (!res.ok) return { internship: null };
      return res.json();
    },
    enabled: !!selectedInternshipId,
  });

  // Fetch match for this internship (if student)
  const { data: recData } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "STUDENT",
  });

  const internship = data?.internship;
  const match = recData?.recommendations?.find(
    (r: any) => r.internshipId === selectedInternshipId
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="h-64 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-lg font-semibold">Internship not found</p>
        <Button onClick={() => navigate("internships")} className="mt-4">Back to search</Button>
      </div>
    );
  }

  const saved = savedInternships.includes(internship.id);

  const apply = async () => {
    if (!user) {
      navigate("auth");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          internshipId: internship.id,
          coverLetter: coverLetter || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({
          title: "Application submitted!",
          message: `Match score: ${data.match.score}% · We'll notify you of updates`,
          type: "success",
        });
        navigate("student-applications");
      } else {
        pushToast({ title: "Could not apply", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <Button
        variant="ghost"
        onClick={() => navigate("internships")}
        className="mb-4 gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to internships
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-emerald flex items-center justify-center shrink-0 shadow-glow">
                    <span className="text-white font-bold text-2xl">
                      {internship.company?.name?.charAt(0) || "I"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight">{internship.title}</h1>
                    <button
                      onClick={() => pushToast({ title: internship.company?.name, message: internship.company?.description, type: "info" })}
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {internship.company?.name}
                    </button>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{internship.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />{internship.workMode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{internship.duration} weeks
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {internship.company?.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-border/40">
                  <Badge className="gradient-emerald text-white">{internship.domain}</Badge>
                  <Badge variant="secondary">{internship.workMode}</Badge>
                  <Badge variant="secondary">{internship.openings} openings</Badge>
                  {internship.deadline && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      Apply by {new Date(internship.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About the role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {internship.description}
              </p>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {internship.responsibilities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What you'll do</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {internship.responsibilities.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full gradient-emerald flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{r}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Requirements / Eligibility */}
          {internship.requirements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {internship.requirements.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{r}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {internship.benefits?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Perks & Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {internship.benefits.map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{b}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover letter (only if student) */}
          {user?.role === "STUDENT" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Letter (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the company why you're a great fit... (our AI will auto-fill your skills and resume)"
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Your resume, profile, and skills will be auto-attached.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Match score card */}
          {match && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-primary/30 shadow-glow">
                <CardContent className="p-5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Match Score
                  </p>
                  <div className="relative inline-flex items-center justify-center mb-3">
                    <div
                      className="match-ring w-28 h-28 rounded-full flex items-center justify-center"
                      style={{ ["--score" as any]: match.score }}
                    >
                      <div className="w-22 h-22 rounded-full bg-card flex flex-col items-center justify-center p-2">
                        <span className={cn(
                          "text-3xl font-bold",
                          match.score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                          match.score >= 60 ? "text-amber-600 dark:text-amber-400" :
                          "text-muted-foreground"
                        )}>
                          {match.score}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">match</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills breakdown */}
                  <div className="text-left space-y-2 mt-4">
                    {match.matchingSkills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Matching Skills ({match.matchingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.matchingSkills.map((s: string) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {match.missingSkills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Missing Skills ({match.missingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.missingSkills.map((s: string) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reasons */}
                  <div className="text-left mt-4 pt-4 border-t border-border/40 space-y-1.5">
                    <p className="text-xs font-semibold mb-1.5">Why this matches:</p>
                    {match.reasons.map((r: string, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Zap className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                        {r}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stipend card */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Stipend</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{internship.stipend.toLocaleString("en-IN")}
                  <span className="text-xs text-muted-foreground font-normal">/month</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold">{internship.duration} weeks</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Openings</p>
                  <p className="text-sm font-semibold">{internship.openings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apply button */}
          <div className="sticky bottom-4">
            <Card className="glass-strong">
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={apply}
                  disabled={applying}
                  className="w-full gradient-emerald text-white shadow-glow h-12 gap-2"
                >
                  {applying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      One-Click Apply
                    </>
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSaved(internship.id)}
                    className="gap-1.5"
                  >
                    <Heart className={cn("w-3.5 h-3.5", saved && "fill-primary text-primary")} />
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pushToast({ title: "Link copied", message: "Share this internship with friends", type: "info" })}
                    className="gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                </div>
                {!user && (
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Sign in to apply
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Company info */}
          {internship.company && (
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold mb-3">About the company</p>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12 gradient-emerald">
                    <AvatarFallback className="text-white font-bold">
                      {internship.company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{internship.company.name}</p>
                    <p className="text-xs text-muted-foreground">{internship.company.industry}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {internship.company.description}
                </p>
                {internship.company.website && (
                  <Button variant="ghost" size="sm" className="w-full mt-3 gap-1 text-xs" asChild>
                    <a href={internship.company.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                      Visit website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
