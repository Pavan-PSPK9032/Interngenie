"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Users, Star, ArrowRight, Mail, Phone, GraduationCap,
  Linkedin, Github, Globe, CheckCircle2, XCircle, Clock,
  Loader2, Award, FileText, Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function CompanyApplicants() {
  const { user, token, selectedApplicantInternshipId } = useApp();
  const queryClient = useQueryClient();
  const [selectedInternship, setSelectedInternship] = useState<string>(
    selectedApplicantInternshipId || "ALL"
  );

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

  // Fetch all internships (to filter by company)
  const { data: intData } = useQuery({
    queryKey: ["all-internships"],
    queryFn: async () => {
      const res = await fetch("/api/internships");
      return res.json();
    },
  });

  const myInternships = (intData?.internships || []).filter(
    (i: any) => i.companyId === user?.companyId
  );

  let applications = data?.applications || [];
  if (selectedInternship !== "ALL") {
    applications = applications.filter((a: any) => a.internshipId === selectedInternship);
  }

  // Sort by match score
  applications = [...applications].sort((a: any, b: any) => b.matchScore - a.matchScore);

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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Applicants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-ranked candidates with match scores and skill breakdowns
          </p>
        </div>
        <Select value={selectedInternship} onValueChange={setSelectedInternship}>
          <SelectTrigger className="md:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All internships</SelectItem>
            {myInternships.map((i: any) => (
              <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              Applicants will appear here once students apply to your internships
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
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 gradient-emerald shrink-0">
                      <AvatarFallback className="text-white font-bold">
                        {app.student?.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-base">{app.student?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {app.internship?.title} · Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs shrink-0",
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

                      {/* Student info */}
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
                            ✓ {s}
                          </span>
                        ))}
                        {app.missingSkills?.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                            + {s}
                          </span>
                        ))}
                      </div>

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
    </div>
  );
}
