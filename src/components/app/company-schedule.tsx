"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Calendar, Clock, Send, Star, Users, ArrowRight,
  Loader2, CheckCircle2, MapPin,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CompanySchedule() {
  const { user, token, pushToast } = useApp();
  const queryClient = useQueryClient();

  const { data: appData, isLoading } = useQuery({
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

  const applications = (appData?.applications || []).filter(
    (a: any) => a.status === "INTERVIEW"
  );

  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>({});
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const scheduleInterview = async (appId: string) => {
    const dateTime = scheduleInputs[appId];
    if (!dateTime) {
      pushToast({ title: "Please select a date and time", type: "warning" });
      return;
    }
    setSchedulingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interviewScheduledAt: new Date(dateTime).toISOString() }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["company-applications"] });
        pushToast({ title: "Interview scheduled successfully", type: "success" });
        setScheduleInputs((prev) => {
          const next = { ...prev };
          delete next[appId];
          return next;
        });
      }
    } catch {
      pushToast({ title: "Failed to schedule interview", type: "warning" });
    }
    setSchedulingId(null);
  };

  const scheduledInterviews = applications
    .filter((a: any) => a.interviewScheduledAt)
    .sort((a: any, b: any) => new Date(a.interviewScheduledAt).getTime() - new Date(b.interviewScheduledAt).getTime());

  const pendingInterviews = applications.filter((a: any) => !a.interviewScheduledAt);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-emerald p-6 md:p-8 shadow-glow"
      >
        <div className="absolute inset-0 gradient-mixed opacity-30 animate-gradient-shift" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-white" />
              <p className="text-white/80 text-sm">Interview Management</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Interview Schedule
            </h1>
            <p className="text-white/90 mt-2">
              Schedule and manage candidate interviews
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 border border-white/20 text-center">
              <p className="text-2xl font-bold text-white">{applications.length}</p>
              <p className="text-xs text-white/80">Total Interviews</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 border border-white/20 text-center">
              <p className="text-2xl font-bold text-white">{scheduledInterviews.length}</p>
              <p className="text-xs text-white/80">Scheduled</p>
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 shimmer rounded-2xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No interview-stage applicants</p>
            <p className="text-sm text-muted-foreground mt-1">
              Move candidates to the Interview stage from the Applicants page to schedule interviews
            </p>
            <Button
              onClick={() => useApp.getState().navigate("company-applicants")}
              className="mt-4 gradient-emerald text-white gap-1.5"
            >
              <Users className="w-4 h-4" />
              View Applicants
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Interviews Calendar-like view */}
          {scheduledInterviews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Interviews
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledInterviews.map((app: any, i: number) => {
                  const interviewDate = new Date(app.interviewScheduledAt);
                  const isToday = interviewDate.toDateString() === new Date().toDateString();
                  const isTomorrow = interviewDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className={cn(
                        "hover:shadow-premium transition-all",
                        isToday && "border-emerald-500/40 shadow-emerald-500/10"
                      )}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10 gradient-emerald shrink-0">
                              <AvatarFallback className="text-white text-xs font-bold">
                                {app.student?.name?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{app.student?.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {app.internship?.title}
                              </p>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Scheduled
                            </Badge>
                          </div>
                          <div className="bg-accent/50 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {interviewDate.toLocaleDateString("en-IN", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>
                                {interviewDate.toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                          {isToday && (
                            <Badge className="mt-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">
                              Today
                            </Badge>
                          )}
                          {isTomorrow && (
                            <Badge className="mt-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">
                              Tomorrow
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Pending Scheduling */}
          {pendingInterviews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                Pending Scheduling ({pendingInterviews.length})
              </h2>
              <div className="space-y-3">
                {pendingInterviews.map((app: any, i: number) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
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
                                <p className="font-semibold">{app.student?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {app.internship?.title}
                                </p>
                              </div>
                              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] shrink-0">
                                Awaiting Schedule
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="datetime-local"
                                  value={scheduleInputs[app.id] || ""}
                                  onChange={(e) =>
                                    setScheduleInputs((prev) => ({
                                      ...prev,
                                      [app.id]: e.target.value,
                                    }))
                                  }
                                  className="w-[220px] h-9 text-xs"
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => scheduleInterview(app.id)}
                                disabled={!scheduleInputs[app.id] || schedulingId === app.id}
                                className="gradient-emerald text-white h-9 gap-1.5 text-xs"
                              >
                                {schedulingId === app.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                Schedule Interview
                              </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Match: {app.matchScore}%
                              </span>
                              {app.student?.college && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {app.student.college}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
