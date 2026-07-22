"use client";
import { motion } from "framer-motion";
import {
  Briefcase, Clock, CheckCircle2, XCircle, Loader2,
  Calendar, Award, ChevronRight, FileText, Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_STAGES = ["APPLIED", "REVIEW", "INTERVIEW", "SELECTED"];

export function StudentApplications() {
  const { user, token, navigate } = useApp();
  const [filter, setFilter] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  const applications = (data?.applications || []).filter((a: any) =>
    filter === "ALL" ? true : a.status === filter
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your applications from submission to selection
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="ALL" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="APPLIED" className="text-xs">Applied</TabsTrigger>
          <TabsTrigger value="REVIEW" className="text-xs">Review</TabsTrigger>
          <TabsTrigger value="INTERVIEW" className="text-xs">Interview</TabsTrigger>
          <TabsTrigger value="SELECTED" className="text-xs">Selected</TabsTrigger>
          <TabsTrigger value="REJECTED" className="text-xs">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse internships and apply with one click
            </p>
            <Button onClick={() => navigate("internships")} className="mt-4 gradient-emerald text-white">
              Browse Internships
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any, idx: number) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ApplicationCard app={app} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app }: { app: any }) {
  const { navigate } = useApp();
  const currentStageIdx = STATUS_STAGES.indexOf(app.status);
  const isRejected = app.status === "REJECTED";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className="w-12 h-12 rounded-xl gradient-emerald flex items-center justify-center shrink-0 shadow-glow">
            <span className="text-white font-bold text-lg">
              {app.internship?.company?.name?.charAt(0) || "I"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => navigate("internship-detail", { internshipId: app.internshipId })}
                  className="font-semibold text-base hover:text-primary text-left truncate block"
                >
                  {app.internship?.title}
                </button>
                <p className="text-sm text-muted-foreground truncate">
                  {app.internship?.company?.name} · {app.internship?.location}
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

            {/* Match score */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs">
                Match score: <strong>{app.matchScore}%</strong>
              </span>
              <span className="text-xs text-muted-foreground">
                · Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              {app.interviewScheduledAt && (
                <span className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  · <Calendar className="w-3 h-3" />
                  Interview: {new Date(app.interviewScheduledAt).toLocaleDateString("en-IN")}
                </span>
              )}
            </div>

            {/* Timeline / progress */}
            {!isRejected ? (
              <div className="relative">
                <div className="flex items-center justify-between">
                  {STATUS_STAGES.map((stage, i) => {
                    const isDone = i <= currentStageIdx;
                    const isCurrent = i === currentStageIdx;
                    return (
                      <div key={stage} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && (
                          <div
                            className={cn(
                              "absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2",
                              i <= currentStageIdx ? "bg-emerald-500" : "bg-muted"
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold relative z-10 transition-all",
                            isDone ? "gradient-emerald text-white" : "bg-muted text-muted-foreground",
                            isCurrent && "ring-4 ring-primary/20 animate-pulse-glow"
                          )}
                        >
                          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <p className={cn(
                          "text-[10px] mt-1.5 hidden sm:block",
                          isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
                        )}>
                          {stage === "APPLIED" ? "Applied" :
                           stage === "REVIEW" ? "Review" :
                           stage === "INTERVIEW" ? "Interview" :
                           "Selected"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {app.feedback || "Your application was not moved forward. Keep applying — your next match is around the corner!"}
                </p>
              </div>
            )}

            {/* Certificate (if selected) */}
            {app.status === "SELECTED" && (
              <div className="mt-3 p-3 rounded-lg gradient-emerald text-white flex items-center gap-3">
                <Award className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">Certificate Ready!</p>
                  <p className="text-[10px] text-white/80">
                    Your completion certificate has been generated
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 h-7 text-xs"
                >
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
