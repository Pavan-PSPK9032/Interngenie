"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  BarChart3, Activity, MapPin, Award, Download, Heart,
  Shield, TrendingUp, Clock, Zap, Server, Globe,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#84cc16", "#f43f5e", "#3b82f6"];

export function AdminReports() {
  const { user, token, pushToast } = useApp();
  const [activeTab, setActiveTab] = useState("activity");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "ADMIN",
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "ADMIN",
  });

  const stats = data || {};
  const totals = stats.totals || {};

  const activityLogs = [
    { id: "1", action: "Company Approved", detail: "TechCorp India approved", user: "Admin", time: "2 min ago", type: "success" as const },
    { id: "2", action: "User Registered", detail: "15 new students registered today", user: "System", time: "15 min ago", type: "info" as const },
    { id: "3", action: "Internship Posted", detail: "ML Engineer at DataSoft", user: "Company", time: "1 hr ago", type: "info" as const },
    { id: "4", action: "Application Received", detail: "142 new applications today", user: "System", time: "2 hrs ago", type: "info" as const },
    { id: "5", action: "Company Rejected", detail: "SpamCo rejected for incomplete docs", user: "Admin", time: "3 hrs ago", type: "warning" as const },
    { id: "6", action: "Certificate Generated", detail: "12 certificates auto-generated", user: "System", time: "4 hrs ago", type: "success" as const },
    { id: "7", action: "User Verified", detail: "50 users verified via email", user: "System", time: "5 hrs ago", type: "info" as const },
    { id: "8", action: "Skill Trend Updated", detail: "React overtakes Python as #1 skill", user: "System", time: "6 hrs ago", type: "info" as const },
    { id: "9", action: "Company Verified", detail: "InnovateTech verified", user: "Admin", time: "8 hrs ago", type: "success" as const },
    { id: "10", action: "Platform Maintenance", detail: "Scheduled maintenance completed", user: "Admin", time: "12 hrs ago", type: "info" as const },
  ];

  const topSkills = (stats.topSkills || []).sort((a: any, b: any) => b.value - a.value);

  const regionalStats = (stats.regional || []).sort((a: any, b: any) => b.value - a.value);

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Students", totals.totalStudents || 0],
      ["Total Companies", totals.totalCompanies || 0],
      ["Total Internships", totals.totalInternships || 0],
      ["Total Applications", totals.totalApplications || 0],
      ["Active Users", totals.activeUsers || 0],
      ["Pending Companies", totals.pendingCompanies || 0],
      [],
      ["Top Skills"],
      ["Skill", "Demand Count"],
      ...topSkills.map((s: any) => [s.name, s.value]),
      [],
      ["Regional Distribution"],
      ["Region", "Applications"],
      ...regionalStats.map((r: any) => [r.name, r.value]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interngenie-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ title: "Report exported as CSV", type: "success" });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-4">
        <div className="h-32 shimmer rounded-2xl" />
        <div className="h-72 shimmer rounded-2xl" />
      </div>
    );
  }

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
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-white" />
              <p className="text-white/80 text-sm">Analytics & Reports</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Platform Reports</h1>
            <p className="text-white/90 mt-2">
              Comprehensive insights into platform activity and performance
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            className="bg-white text-emerald-700 hover:bg-white/90 rounded-full gap-1.5 self-start"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity Logs</span>
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Regional</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Top Skills</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
        </TabsList>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Platform Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {activityLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        log.type === "success" ? "bg-emerald-500" :
                        log.type === "warning" ? "bg-amber-500" :
                        "bg-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{log.action}</p>
                          <Badge variant="secondary" className="text-[10px]">{log.user}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.detail}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {log.time}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Regional Statistics Tab */}
        <TabsContent value="regional" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Applications by Region
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={regionalStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                    <XAxis dataKey="name" stroke="rgba(120,120,120,0.6)" fontSize={11} angle={-30} textAnchor="end" height={60} />
                    <YAxis stroke="rgba(120,120,120,0.6)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {regionalStats.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Regional summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {regionalStats.slice(0, 4).map((r: any, i: number) => (
              <motion.div key={r.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{r.value}</p>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Top Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Trending Skills on Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill: any, i: number) => {
                    const maxVal = topSkills[0]?.value || 1;
                    const intensity = Math.round((skill.value / maxVal) * 100);
                    return (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Badge
                          className={cn(
                            "text-sm px-3 py-1.5 gap-1.5 cursor-default",
                            intensity >= 80 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" :
                            intensity >= 50 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" :
                            "bg-muted text-muted-foreground"
                          )}
                          variant="outline"
                        >
                          <Award className="w-3 h-3" />
                          {skill.name}
                          <span className="text-[10px] font-normal opacity-70">{skill.value}</span>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Skills Demand Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSkills}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                  <XAxis dataKey="name" stroke="rgba(120,120,120,0.6)" fontSize={10} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="rgba(120,120,120,0.6)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {topSkills.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">99.9%</p>
                      <p className="text-xs text-muted-foreground">Uptime (30d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">142ms</p>
                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totals.totalUsers || totals.activeUsers || 0}</p>
                      <p className="text-xs text-muted-foreground">Active Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "API Server", status: "Operational", uptime: "99.99%", ok: true },
                  { name: "Database", status: "Operational", uptime: "99.98%", ok: true },
                  { name: "AI Match Engine", status: "Operational", uptime: "99.95%", ok: true },
                  { name: "File Storage", status: "Operational", uptime: "99.97%", ok: true },
                  { name: "Email Service", status: "Operational", uptime: "99.90%", ok: true },
                  { name: "Certificate Generator", status: "Operational", uptime: "99.93%", ok: true },
                ].map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", svc.ok ? "bg-emerald-500" : "bg-red-500")} />
                      <p className="text-sm font-medium">{svc.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Uptime: {svc.uptime}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">{svc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
