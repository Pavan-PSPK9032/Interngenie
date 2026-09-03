"use client";
import { motion } from "framer-motion";
import {
  Building2, Briefcase, Users, TrendingUp, Plus, ArrowRight,
  Eye, Star, IndianRupee, Calendar, Loader2, Award, Clock,
  BarChart3, Sparkles, FileText,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function CompanyDashboard() {
  const { user, token, navigate } = useApp();

  // Fetch company's internships via applications
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

  // Fetch company's own internships (including pending approvals)
  const { data: intData } = useQuery({
    queryKey: ["my-internships"],
    queryFn: async () => {
      const res = await fetch("/api/internships/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const myInternships = intData?.internships || [];
  const applications = appData?.applications || [];

  // Stats
  const totalApps = applications.length;
  const shortlisted = applications.filter((a: any) => a.status === "INTERVIEW" || a.status === "SELECTED").length;
  const selected = applications.filter((a: any) => a.status === "SELECTED").length;
  const avgMatch = totalApps > 0
    ? Math.round(applications.reduce((acc: number, a: any) => acc + a.matchScore, 0) / totalApps)
    : 0;

  // Top applicants by match score
  const topApplicants = [...applications].sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 5);

  // Group applications by internship
  const appsByInternship = myInternships.map((i: any) => ({
    internship: i,
    applicants: applications.filter((a: any) => a.internshipId === i.id),
  })).filter((x: any) => x.applicants.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-emerald p-6 md:p-8 shadow-glow"
      >
        <div className="absolute inset-0 gradient-mixed opacity-30 animate-gradient-shift" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-white/80 text-sm">Welcome back</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              {user?.name}
            </h1>
            <p className="text-white/90 mt-2">
              You have <strong className="text-white">{myInternships.length} active internships</strong> and{" "}
              <strong className="text-white">{totalApps} applications</strong> to review.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={() => navigate("company-post-internship")}
                size="sm"
                className="bg-white text-emerald-700 hover:bg-white/90 rounded-full gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Post New Internship
              </Button>
              <Button
                onClick={() => navigate("company-applicants")}
                size="sm"
                variant="outline"
                className="bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white/20 rounded-full gap-1.5"
              >
                <Users className="w-4 h-4" />
                View Applicants
              </Button>
              <Button
                onClick={() => navigate("company-schedule")}
                size="sm"
                variant="outline"
                className="bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white/20 rounded-full gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                Schedule Interviews
              </Button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            <Building2 className="w-10 h-10 text-white mb-2" />
            <p className="text-white font-semibold text-sm">Hiring Rate</p>
            <p className="text-3xl font-bold text-white">
              {totalApps > 0 ? Math.round((selected / totalApps) * 100) : 0}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: "Active Internships", value: myInternships.length, icon: Briefcase, color: "from-emerald-500 to-teal-600" },
          { label: "Total Applications", value: totalApps, icon: Users, color: "from-amber-500 to-orange-600" },
          { label: "Shortlisted", value: shortlisted, icon: Star, color: "from-pink-500 to-rose-600" },
          { label: "Avg ATS Score", value: `${avgMatch}%`, icon: BarChart3, color: "from-violet-500 to-purple-600" },
          { label: "Interviews", value: applications.filter((a: any) => a.status === "INTERVIEW").length, icon: Calendar, color: "from-cyan-500 to-blue-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", stat.color)}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Post Internship", view: "company-post-internship" as const, icon: Plus, color: "from-emerald-500 to-teal-600" },
          { label: "View Applicants", view: "company-applicants" as const, icon: Users, color: "from-amber-500 to-orange-600" },
          { label: "Schedule Interviews", view: "company-schedule" as const, icon: Calendar, color: "from-cyan-500 to-blue-600" },
          { label: "Interview Schedule", view: "company-schedule" as const, icon: Clock, color: "from-violet-500 to-purple-600" },
        ].map((link, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(link.view)}
            className="group"
          >
            <Card className="hover:shadow-premium transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", link.color)}>
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{link.label}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {(() => {
                const recentApps = [...applications]
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5);
                if (recentApps.length === 0) {
                  return <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>;
                }
                return recentApps.map((app: any, i: number) => (
                  <div key={app.id} className="flex gap-3 py-2.5 relative">
                    {i < recentApps.length - 1 && (
                      <div className="absolute left-[7px] top-8 w-px h-[calc(100%-12px)] bg-border/40" />
                    )}
                    <div className="w-[15px] h-[15px] rounded-full bg-primary/20 border-2 border-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {app.student?.name || "Student"} applied for {app.internship?.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" \u00b7 "}
                        <Badge className={cn(
                          "text-[9px] px-1 py-0",
                          app.status === "SELECTED" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          app.status === "INTERVIEW" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                          app.status === "REVIEW" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          app.status === "REJECTED" && "bg-red-500/10 text-red-700 dark:text-red-400",
                          app.status === "APPLIED" && "bg-muted text-muted-foreground"
                        )}>
                          {app.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </div>

        {/* My internships */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Internships</h2>
            <Button onClick={() => navigate("company-post-internship")} size="sm" className="gradient-emerald text-white gap-1.5">
              <Plus className="w-4 h-4" />
              Post New
            </Button>
          </div>

          {myInternships.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No internships posted yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Post your first internship to start receiving applications
                </p>
                <Button
                  onClick={() => navigate("company-post-internship")}
                  className="mt-4 gradient-emerald text-white gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Post Internship
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myInternships.map((i: any, idx: number) => {
                const apps = applications.filter((a: any) => a.internshipId === i.id);
                return (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-premium transition-all cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => navigate("company-applicants", { internshipId: i.id })}
                              className="font-semibold text-base hover:text-primary text-left truncate block"
                            >
                              {i.title}
                            </button>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {i.duration}w
                              </span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                {i.stipend.toLocaleString("en-IN")}/mo
                              </span>
                              <Badge variant="secondary" className="text-[10px]">{i.domain}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{i.workMode}</Badge>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-bold text-primary">{apps.length}</p>
                            <p className="text-xs text-muted-foreground">applicants</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {apps.length > 0 && (
                              <>
                                <div className="flex -space-x-1.5">
                                  {apps.slice(0, 3).map((a: any) => (
                                    <div
                                      key={a.id}
                                      className="w-7 h-7 rounded-full gradient-emerald border-2 border-card flex items-center justify-center text-white text-[10px] font-semibold"
                                    >
                                      {a.student?.name?.charAt(0) || "S"}
                                    </div>
                                  ))}
                                  {apps.length > 3 && (
                                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-semibold">
                                      +{apps.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Top match: {Math.max(...apps.map((a: any) => a.matchScore))}%
                                </span>
                              </>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate("company-applicants", { internshipId: i.id })}
                            className="gap-1 text-xs"
                          >
                            View applicants
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Top applicants + analytics */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Top Applicants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topApplicants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No applicants yet
                </p>
              ) : (
                topApplicants.map((app: any, i: number) => (
                  <button
                    key={app.id}
                    onClick={() => navigate("company-applicants")}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full gradient-emerald flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {app.student?.name?.charAt(0) || "S"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{app.student?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {app.internship?.title}
                      </p>
                    </div>
                    <Badge className={cn(
                      "text-[10px] shrink-0",
                      app.matchScore >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                      app.matchScore >= 60 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {app.matchScore}%
                    </Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Popular skills (from applicants) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Popular Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const freq: Record<string, number> = {};
                applications.forEach((a: any) => {
                  a.matchingSkills?.forEach((s: string) => {
                    freq[s] = (freq[s] || 0) + 1;
                  });
                });
                return Object.entries(freq)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([skill, count]) => {
                    const max = Math.max(...Object.values(freq));
                    return (
                      <div key={skill}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{skill}</span>
                          <span className="text-muted-foreground">{count} applicants</span>
                        </div>
                        <Progress value={(count / max) * 100} className="h-1.5" />
                      </div>
                    );
                  });
              })()}
              {applications.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No data yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
