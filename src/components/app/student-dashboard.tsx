"use client";
import { motion } from "framer-motion";
import {
  Sparkles, Briefcase, Heart, Bell, TrendingUp,
  Target, ArrowRight, Clock,
  Calendar, Zap, FileText, ClipboardCheck,
  MessageSquare, Bot, Video, ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ProfileCompleteness } from "@/components/app/profile-completeness";

export function StudentDashboard() {
  const { user, navigate, pushToast, setChatbotOpen } = useApp();

  // Fetch recommendations
  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/recommendations", {
        headers: { Authorization: `Bearer ${useApp.getState().token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch applications
  const { data: appData } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${useApp.getState().token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${useApp.getState().token}` },
      });
      return res.json();
    },
    enabled: !!user,
  });

  // Sync notifications to store
  useEffect(() => {
    if (notifData?.notifications) {
      useApp.getState().setNotifications(notifData.notifications);
    }
  }, [notifData]);

  const recommendations = recData?.recommendations || [];
  const applications = appData?.applications || [];
  const notifications = notifData?.notifications || [];
  const unread = notifications.filter((n: any) => !n.read).length;
  const interviews = applications.filter((a: any) => a.status === "INTERVIEW");
  const savedCount = useApp.getState().savedInternships.length;

  const chartData = [
    { name: "Applied", value: applications.filter((a: any) => a.status === "APPLIED").length, color: "#6366f1" },
    { name: "Review", value: applications.filter((a: any) => a.status === "REVIEW").length, color: "#f59e0b" },
    { name: "Interview", value: applications.filter((a: any) => a.status === "INTERVIEW").length, color: "#06b6d4" },
    { name: "Selected", value: applications.filter((a: any) => a.status === "SELECTED").length, color: "#22c55e" },
    { name: "Rejected", value: applications.filter((a: any) => a.status === "REJECTED").length, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const quickActions = [
    { label: "Resume Builder", desc: "Create & polish your resume", icon: FileText, view: "resume-builder", gradient: "from-indigo-500 to-violet-600" },
    { label: "ATS Checker", desc: user?.atsScore ? `Current score ${user.atsScore}%` : "Optimize for ATS robots", icon: ClipboardCheck, view: "ats-checker", gradient: "from-cyan-500 to-blue-600" },
    { label: "Interview Prep", desc: "Mock questions & feedback", icon: MessageSquare, view: "interview-prep", gradient: "from-violet-500 to-purple-600" },
    { label: "AI Chatbot", desc: "Career guidance, 24/7", icon: Bot, view: "chatbot", gradient: "from-emerald-500 to-teal-600" },
  ] as const;

  const runAction = (a: (typeof quickActions)[number]) => {
    if (a.view === "chatbot") setChatbotOpen(true);
    else navigate(a.view);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-emerald p-6 md:p-8 shadow-glow"
      >
        <div className="absolute inset-0 gradient-mixed opacity-30 animate-gradient-shift" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-white/80 text-sm">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              Namaste, {user?.name?.split(" ")[0]}! 🙏
            </h1>
            <p className="text-white/90 mt-2 max-w-lg">
              You have <strong className="text-white">{recommendations.length} new matches</strong> based on your skills.
              {applications.length > 0 && (
                <> You're tracking <strong className="text-white">{applications.length} applications</strong>.</>
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={() => navigate("internships")}
                size="sm"
                className="bg-white text-emerald-700 hover:bg-white/90 rounded-full gap-1.5"
              >
                <Briefcase className="w-4 h-4" />
                Browse internships
              </Button>
              <Button
                onClick={() => navigate("student-profile")}
                size="sm"
                variant="outline"
                className="bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white/20 rounded-full gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Update profile
              </Button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            {user?.atsScore !== undefined && (
              <div className="text-center">
                <div className="text-4xl font-bold text-white flex items-end gap-0.5">
                  {user.atsScore}<span className="text-lg text-white/70">%</span>
                </div>
                <p className="text-white/80 text-xs mt-0.5">ATS Score</p>
              </div>
            )}
            <div className="text-center">
              <div className="text-5xl font-bold text-white">{user?.profileCompleted}%</div>
              <p className="text-white/80 text-xs mt-1">Profile Complete</p>
              <Progress value={user?.profileCompleted || 0} className="mt-2 h-1.5 w-32 bg-white/20" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Recommendations",
            value: recommendations.length,
            icon: Sparkles,
            color: "from-indigo-500 to-cyan-500",
            glow: "group-hover:shadow-[0_8px_30px_-6px_rgba(99,102,241,0.5)]",
          },
          {
            label: "Applications",
            value: applications.length,
            icon: Briefcase,
            color: "from-amber-500 to-orange-500",
            glow: "group-hover:shadow-[0_8px_30px_-6px_rgba(245,158,11,0.5)]",
          },
          {
            label: "Saved",
            value: savedCount,
            icon: Heart,
            color: "from-pink-500 to-rose-500",
            glow: "group-hover:shadow-[0_8px_30px_-6px_rgba(236,72,153,0.5)]",
          },
          {
            label: "Interviews",
            value: interviews.length,
            icon: Video,
            color: "from-cyan-500 to-blue-600",
            glow: "group-hover:shadow-[0_8px_30px_-6px_rgba(6,182,212,0.5)]",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group hover:shadow-premium transition-all hover:-translate-y-0.5 dark:bg-white/[0.04] dark:border-white/[0.08]">
              <CardContent className="p-4">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-glow", stat.color, stat.glow)}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-amber-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => runAction(a)}
              className="group text-left glass-card rounded-2xl border-white/[0.08] p-4 hover:border-white/[0.16] hover:-translate-y-0.5 transition-all duration-300 shadow-premium"
            >
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-glow", a.gradient)}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs text-primary mt-2 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                Open <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Application activity chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      Application Activity
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Live breakdown of your {applications.length} applications
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("student-applications")} className="gap-1 text-xs">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
                {applications.length === 0 ? (
                  <div className="py-6 text-center">
                    <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Start applying to see your activity breakdown
                    </p>
                    <Button onClick={() => navigate("internships")} size="sm" className="mt-3 gap-1.5">
                      <Briefcase className="w-4 h-4" /> Browse internships
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-44 h-44 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={58}
                            outerRadius={80}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {chartData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "rgba(17,24,39,0.9)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 12,
                              color: "#fff",
                              fontSize: 12,
                            }}
                            itemStyle={{ color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold">{applications.length}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {chartData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-sm flex-1">{d.name}</span>
                          <span className="text-sm font-semibold">{d.value}</span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {Math.round((d.value / applications.length) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Recommendations
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Explainable match scores based on your skills & preferences
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("internships")} className="gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {recLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl shimmer" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No matches yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Update your profile and skills to get AI recommendations
                </p>
                <Button onClick={() => navigate("student-profile")} className="mt-4 gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Update profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec: any, i: number) => (
                <RecommendationCard key={rec.internshipId} rec={rec} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Recent applications + notifications */}
        <div className="space-y-4">
          {/* Upcoming interviews */}
          <Card className={cn(interviews.length > 0 && "border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.06] to-transparent")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                Upcoming Interviews
                {interviews.length > 0 && (
                  <Badge className="bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 text-[10px]">{interviews.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {interviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No interviews scheduled yet. Apply to get shortlisted!
                </p>
              ) : (
                interviews.slice(0, 3).map((app: any) => (
                  <button
                    key={app.id}
                    onClick={() => navigate("student-applications")}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-cyan-400/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                        <span className="text-white text-xs font-semibold">
                          {app.internship?.company?.name?.charAt(0) || "I"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{app.internship?.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {app.internship?.company?.name}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                        Scheduled
                      </span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent applications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No applications yet
                </p>
              ) : (
                applications.slice(0, 4).map((app: any) => (
                  <button
                    key={app.id}
                    onClick={() => navigate("student-applications")}
                    className="w-full text-left p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg gradient-emerald flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {app.internship?.company?.name?.charAt(0) || "I"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {app.internship?.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {app.internship?.company?.name}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </button>
                ))
              )}
              {applications.length > 0 && (
                <Button
                  onClick={() => navigate("student-applications")}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs gap-1"
                >
                  View all applications <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Profile completeness */}
          <ProfileCompleteness />

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
                {unread > 0 && (
                  <Badge className="gradient-emerald text-white text-[10px]">{unread} new</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications
                </p>
              ) : (
                notifications.slice(0, 6).map((n: any) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs",
                      n.read ? "bg-muted/30 border-border/40" :
                      n.type === "SUCCESS" ? "bg-emerald-500/5 border-emerald-500/20" :
                      n.type === "INTERVIEW" ? "bg-amber-500/5 border-amber-500/20" :
                      n.type === "WARNING" ? "bg-red-500/5 border-red-500/20" :
                      "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                        n.type === "SUCCESS" ? "bg-emerald-500" :
                        n.type === "INTERVIEW" ? "bg-amber-500" :
                        n.type === "WARNING" ? "bg-red-500" : "bg-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs">{n.title}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {new Date(n.createdAt).toLocaleString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation card with explainable AI ──────────────────────
function RecommendationCard({ rec, index }: { rec: any; index: number }) {
  const { navigate, savedInternships, toggleSaved, pushToast } = useApp();
  const [internship, setInternship] = useState<any>(null);

  // Fetch internship details
  useEffect(() => {
    fetch(`/api/internships/${rec.internshipId}`)
      .then((r) => r.json())
      .then((d) => setInternship(d.internship))
      .catch(() => {});
  }, [rec.internshipId]);

  if (!internship) {
    return <div className="h-32 rounded-2xl shimmer" />;
  }

  const saved = savedInternships.includes(internship.id);
  const scoreColor =
    rec.score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
    rec.score >= 60 ? "text-amber-600 dark:text-amber-400" :
    "text-muted-foreground";

  const apply = async () => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useApp.getState().token}`,
        },
        body: JSON.stringify({ internshipId: internship.id }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({
          title: "Application submitted!",
          message: `Match score: ${data.match.score}%`,
          type: "success",
        });
      } else {
        pushToast({ title: "Could not apply", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-premium transition-all hover:-translate-y-0.5 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Match score ring */}
            <div className="relative shrink-0">
              <div
                className="match-ring w-16 h-16 rounded-full flex items-center justify-center"
                style={{ ["--score" as any]: rec.score }}
              >
                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                  <span className={cn("text-base font-bold", scoreColor)}>
                    {rec.score}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => navigate("internship-detail", { internshipId: internship.id })}
                    className="font-semibold text-base hover:text-primary text-left truncate block"
                  >
                    {internship.title}
                  </button>
                  <p className="text-sm text-muted-foreground truncate">
                    {internship.company?.name} · {internship.location}
                  </p>
                </div>
                <button
                  onClick={() => toggleSaved(internship.id)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-accent/50"
                >
                  <Heart className={cn("w-4 h-4", saved && "fill-primary text-primary")} />
                </button>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {rec.matchingSkills.slice(0, 4).map((s: string) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ {s}
                  </span>
                ))}
                {rec.missingSkills.slice(0, 2).map((s: string) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                    + {s}
                  </span>
                ))}
              </div>

              {/* Explainable reasons */}
              <div className="mt-2.5 space-y-1">
                {rec.reasons.slice(0, 2).map((r: string, i: number) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <Zap className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    {r}
                  </p>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {internship.duration}w
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{internship.stipend.toLocaleString("en-IN")}/mo
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{internship.workMode}</Badge>
                </div>
                <Button onClick={apply} size="sm" className="gradient-emerald text-white rounded-full h-8 gap-1.5">
                  One-Click Apply
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    APPLIED: { label: "Applied", class: "bg-muted text-muted-foreground" },
    REVIEW: { label: "Under Review", class: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
    INTERVIEW: { label: "Interview", class: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    SELECTED: { label: "Selected", class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    REJECTED: { label: "Rejected", class: "bg-red-500/10 text-red-700 dark:text-red-400" },
  };
  const s = map[status] || map.APPLIED;
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0", s.class)}>
      {s.label}
    </span>
  );
}
