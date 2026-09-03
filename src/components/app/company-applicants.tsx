"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Users, Star, Mail, Phone, GraduationCap,
  Linkedin, Github, CheckCircle2, XCircle, Clock,
  Award, FileText, Sparkles, ChevronDown, ChevronUp,
  Target, AlertTriangle, Eye, X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortMode = "match" | "ats";

export function CompanyApplicants() {
  const { user, token, selectedApplicantInternshipId } = useApp();
  const queryClient = useQueryClient();
  const [selectedInternship, setSelectedInternship] = useState<string>(
    selectedApplicantInternshipId || "ALL"
  );
  const [sortBy, setSortBy] = useState<SortMode>("match");
  const [showHighATSOnly, setShowHighATSOnly] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, boolean>>({});
  const [resumeModalApp, setResumeModalApp] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["company-applications", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  const { data: intData } = useQuery({
    queryKey: ["my-internships"],
    queryFn: async () => {
      const res = await fetch("/api/internships/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  const myInternships = intData?.internships || [];

  let applications = data?.applications || [];
  if (selectedInternship !== "ALL") {
    applications = applications.filter((a: any) => a.internshipId === selectedInternship);
  }
  if (showHighATSOnly) {
    applications = applications.filter((a: any) => a.candidateAtsScore !== null && a.candidateAtsScore > 80);
  }

  if (sortBy === "ats") {
    applications = [...applications].sort((a: any, b: any) => (b.candidateAtsScore || 0) - (a.candidateAtsScore || 0));
  } else {
    applications = [...applications].sort((a: any, b: any) => b.matchScore - a.matchScore);
  }

  const updateStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["company-applications"] });
        const map: Record<string, { title: string; type: "success" | "info" | "warning" }> = {
          REVIEW: { title: "Marked as under review", type: "info" },
          INTERVIEW: { title: "Interview scheduled!", type: "info" },
          SELECTED: { title: "Candidate selected! Certificate generated.", type: "success" },
          REJECTED: { title: "Candidate rejected", type: "warning" },
        };
        useApp.getState().pushToast(map[status] || { title: "Updated", type: "info" });
      }
    } catch {}
  };

  const getATSBadgeColor = (score: number | null) => {
    if (score === null) return "bg-muted text-muted-foreground";
    if (score > 80) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (score >= 60) return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  const toggleAnalysis = (id: string) => {
    setExpandedAnalysis((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Applicants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-ranked candidates with ATS scores, match analysis and resume insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedInternship} onValueChange={setSelectedInternship}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All internships</SelectItem>
              {myInternships.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortMode)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Sort by Match</SelectItem>
              <SelectItem value="ats">Sort by ATS Score</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={showHighATSOnly ? "default" : "outline"}
            onClick={() => setShowHighATSOnly(!showHighATSOnly)}
            className={cn(
              "gap-1.5 text-xs",
              showHighATSOnly && "gradient-emerald text-white"
            )}
          >
            <Target className="w-3.5 h-3.5" />
            High ATS (&gt;80)
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 shimmer rounded-2xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No applicants yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {showHighATSOnly ? "No applicants with high ATS scores found" : "Applicants will appear here once students apply to your internships"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any, idx: number) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
            >
              <Card className="hover:shadow-premium transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 gradient-emerald shrink-0">
                      <AvatarFallback className="text-white font-bold">
                        {app.student?.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-base">{app.student?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {app.internship?.title} · Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.candidateAtsScore !== null && app.candidateAtsScore !== undefined && (
                            <Badge className={cn("text-xs gap-1", getATSBadgeColor(app.candidateAtsScore))}>
                              <Target className="w-3 h-3" />
                              ATS {app.candidateAtsScore}%
                            </Badge>
                          )}
                          <Badge
                            className={cn(
                              "text-xs",
                              app.status === "SELECTED" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                              app.status === "REJECTED" && "bg-red-500/10 text-red-700 dark:text-red-400",
                              app.status === "INTERVIEW" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                              app.status === "REVIEW" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                              app.status === "APPLIED" && "bg-muted text-muted-foreground"
                            )}
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                        {app.student?.college && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {app.student.college}
                          </span>
                        )}
                        {app.student?.cgpa && (
                          <span>CGPA: <strong className="text-foreground">{app.student.cgpa}</strong></span>
                        )}
                        {app.student?.branch && (
                          <span>{app.student.branch}</span>
                        )}
                        {app.student?.graduationYear && (
                          <span>· {app.student.graduationYear}</span>
                        )}
                      </div>

                      {/* Match score bar */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Sparkles className="w-3 h-3 text-primary" />
                              AI Match Score
                            </span>
                            <span className={cn(
                              "font-bold",
                              app.matchScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                              app.matchScore >= 60 ? "text-amber-600 dark:text-amber-400" :
                              "text-muted-foreground"
                            )}>
                              {app.matchScore}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${app.matchScore}%` }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                              className={cn(
                                "h-full rounded-full",
                                app.matchScore >= 80 ? "bg-emerald-500" :
                                app.matchScore >= 60 ? "bg-amber-500" :
                                "bg-muted-foreground"
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Matching / missing skills */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {app.matchingSkills?.slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                            + {s}
                          </span>
                        ))}
                        {app.missingSkills?.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                            - {s}
                          </span>
                        ))}
                      </div>

                      {/* Expandable ATS Resume Analysis */}
                      {app.candidateAtsScore !== null && app.candidateAtsScore !== undefined && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleAnalysis(app.id)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline mb-1"
                          >
                            {expandedAnalysis[app.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            View Resume Analysis
                          </button>
                          <AnimatePresence>
                            {expandedAnalysis[app.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 rounded-xl bg-muted/50 border border-border/40 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Skill Match</span>
                                    <span className={cn(
                                      "text-xs font-bold",
                                      app.matchScore >= 80 ? "text-emerald-600" :
                                      app.matchScore >= 60 ? "text-amber-600" : "text-red-600"
                                    )}>
                                      {app.matchScore}%
                                    </span>
                                  </div>
                                  {app.matchingSkills?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Strengths</p>
                                      <div className="flex flex-wrap gap-1">
                                        {app.matchingSkills.map((s: string) => (
                                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {app.missingSkills?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Gaps</p>
                                      <div className="flex flex-wrap gap-1">
                                        {app.missingSkills.map((s: string) => (
                                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-700 dark:text-red-400 font-medium">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {app.atsScoreAtApply && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                                      <span className="text-muted-foreground">ATS at application: <strong>{app.atsScoreAtApply}%</strong></span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Contact + actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
                          {app.student?.email && (
                            <a href={`mailto:${app.student.email}`} className="flex items-center gap-1 hover:text-primary">
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                          {app.student?.phone && (
                            <a href={`tel:${app.student.phone}`} className="flex items-center gap-1 hover:text-primary">
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                          {app.student?.linkedin && (
                            <a href={app.student.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                              <Linkedin className="w-3 h-3" />
                            </a>
                          )}
                          {app.student?.github && (
                            <a href={app.student.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                              <Github className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => setResumeModalApp(app)}
                            className="flex items-center gap-1 hover:text-primary ml-1"
                            title="View Full Resume"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="text-[10px]">Resume</span>
                          </button>
                        </div>

                        {app.status === "APPLIED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(app.id, "REVIEW")}
                              className="h-8 text-xs gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              Mark Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(app.id, "INTERVIEW")}
                              className="h-8 text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400"
                            >
                              <Star className="w-3 h-3" />
                              Interview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(app.id, "REJECTED")}
                              className="h-8 text-xs gap-1 border-red-500/40 text-red-600 dark:text-red-400"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        {app.status === "REVIEW" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(app.id, "INTERVIEW")}
                              className="h-8 text-xs gap-1 gradient-emerald text-white"
                            >
                              <Star className="w-3 h-3" />
                              Schedule Interview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(app.id, "REJECTED")}
                              className="h-8 text-xs gap-1 border-red-500/40 text-red-600 dark:text-red-400"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {app.status === "INTERVIEW" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(app.id, "SELECTED")}
                            className="h-8 text-xs gap-1 gradient-emerald text-white"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Select & Generate Certificate
                          </Button>
                        )}
                        {app.status === "SELECTED" && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1">
                            <Award className="w-3 h-3" />
                            Certificate sent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resume Modal */}
      <AnimatePresence>
        {resumeModalApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setResumeModalApp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-background rounded-2xl border border-border/40 shadow-2xl"
            >
              <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border/40 bg-background/95 backdrop-blur">
                <div>
                  <h3 className="font-semibold">{resumeModalApp.student?.name}</h3>
                  <p className="text-xs text-muted-foreground">{resumeModalApp.internship?.title}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setResumeModalApp(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                {/* Student Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Student Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {resumeModalApp.student?.email && <span>Email: {resumeModalApp.student.email}</span>}
                    {resumeModalApp.student?.phone && <span>Phone: {resumeModalApp.student.phone}</span>}
                    {resumeModalApp.student?.college && <span>College: {resumeModalApp.student.college}</span>}
                    {resumeModalApp.student?.degree && <span>Degree: {resumeModalApp.student.degree}</span>}
                    {resumeModalApp.student?.branch && <span>Branch: {resumeModalApp.student.branch}</span>}
                    {resumeModalApp.student?.cgpa && <span>CGPA: {resumeModalApp.student.cgpa}</span>}
                  </div>
                </div>

                {/* Skills */}
                {resumeModalApp.student?.skills?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {resumeModalApp.student.skills.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* ATS Score at Application */}
                {resumeModalApp.atsScoreAtApply && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">ATS Score at Application</h4>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">{resumeModalApp.atsScoreAtApply}%</div>
                      <Badge className={cn(
                        "text-xs",
                        resumeModalApp.atsScoreAtApply >= 80 ? "bg-emerald-500/10 text-emerald-700" :
                        resumeModalApp.atsScoreAtApply >= 60 ? "bg-amber-500/10 text-amber-700" :
                        "bg-red-500/10 text-red-700"
                      )}>
                        {resumeModalApp.atsScoreAtApply >= 80 ? "Good" :
                         resumeModalApp.atsScoreAtApply >= 60 ? "Moderate" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Match Analysis */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Match Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Match Score</span>
                      <span className="font-bold">{resumeModalApp.matchScore}%</span>
                    </div>
                    {resumeModalApp.matchingSkills?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Matching Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {resumeModalApp.matchingSkills.map((s: string) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {resumeModalApp.missingSkills?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {resumeModalApp.missingSkills.map((s: string) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-700 dark:text-red-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Letter */}
                {resumeModalApp.coverLetter && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Cover Letter</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {resumeModalApp.coverLetter}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
