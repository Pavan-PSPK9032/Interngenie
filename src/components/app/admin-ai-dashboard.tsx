"use client";
import { motion } from "framer-motion";
import {
  Brain, BarChart3, TrendingUp, Users, FileText, Award,
  AlertTriangle, Target, Sparkles, ArrowRight, Loader2,
  Activity, Zap,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = ["#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#84cc16", "#f43f5e", "#3b82f6"];

export function AdminAIDashboard() {
  const { user, token, navigate } = useApp();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ai-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "ADMIN",
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-4">
        <div className="h-32 shimmer rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 shimmer rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-72 shimmer rounded-2xl" />
          <div className="h-72 shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  const d = data || {};
  const avgScore = d.avgATSScore || 0;
  const resumeStats = d.resumeStats || { generated: 0, uploaded: 0, improved: 0 };
  const recAccuracy = d.recommendationAccuracy || { total: 0, interviews: 0, selected: 0, accuracy: 0 };
  const successRate = d.internshipSuccessRate || { total: 0, filled: 0, rate: 0 };

  const kpis = [
    { label: "Avg ATS Score", value: `${avgScore}%`, icon: Target, color: "from-emerald-500 to-teal-600" },
    { label: "Total Resumes", value: (resumeStats.generated + resumeStats.uploaded).toLocaleString("en-IN"), icon: FileText, color: "from-cyan-500 to-blue-600" },
    { label: "Recommendation Accuracy", value: `${recAccuracy.accuracy}%`, icon: TrendingUp, color: "from-violet-500 to-purple-600" },
    { label: "Success Rate", value: `${successRate.rate}%`, icon: Award, color: "from-amber-500 to-orange-600" },
  ];

  const pieData = [
    { name: "Generated", value: resumeStats.generated, color: "#10b981" },
    { name: "Uploaded", value: resumeStats.uploaded, color: "#06b6d4" },
    { name: "Improved", value: resumeStats.improved, color: "#8b5cf6" },
  ];

  const funnelData = [
    { stage: "Applications", count: recAccuracy.total, color: "#3b82f6" },
    { stage: "Interviews", count: recAccuracy.interviews, color: "#f59e0b" },
    { stage: "Selected", count: recAccuracy.selected, color: "#10b981" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-emerald p-6 md:p-8 shadow-glow"
      >
        <div className="absolute inset-0 gradient-mixed opacity-30 animate-gradient-shift" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-white" />
            <p className="text-white/80 text-sm">AI Analytics</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">AI Dashboard</h1>
          <p className="text-white/90 mt-2">Platform-wide AI engine performance and ATS insights</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={() => navigate("admin-dashboard")}
              size="sm"
              variant="outline"
              className="bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white/20 rounded-full gap-1.5"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Overview
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-premium transition-shadow">
              <CardContent className="p-4">
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2.5", kpi.color)}>
                  <kpi.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Score Distribution + Resume Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              ATS Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={d.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="range" stroke="rgba(120,120,120,0.6)" fontSize={11} />
                <YAxis stroke="rgba(120,120,120,0.6)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(d.scoreDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Resume Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData.filter((p) => p.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {pieData
                    .filter((p) => p.value > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(v) => <span className="text-xs">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Top Skills + Weak Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Top 20 Skills in Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={d.topSkills || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" horizontal={false} />
                <XAxis type="number" stroke="rgba(120,120,120,0.6)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(120,120,120,0.6)"
                  fontSize={10}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(d.topSkills || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Weak Skills (Most Missing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto pr-2">
              {(d.weakSkills || []).map((s: any, i: number) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs gap-1",
                      i < 3 ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" :
                      i < 7 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" :
                      "bg-muted"
                    )}
                  >
                    {s.name}
                    <span className="text-[10px] opacity-60">({s.frequency})</span>
                  </Badge>
                </motion.div>
              ))}
              {(!d.weakSkills || d.weakSkills.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4 w-full">No missing skill data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Missing Keywords + Recommendation Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Most Missing Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
              {(d.missingKeywords || []).map((kw: any, i: number) => (
                <motion.div
                  key={kw.keyword}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-3 py-1.5 rounded-full bg-muted/80 border border-border/40 text-xs font-medium"
                >
                  {kw.keyword}
                  <span className="ml-1 text-muted-foreground text-[10px]">x{kw.count}</span>
                </motion.div>
              ))}
              {(!d.missingKeywords || d.missingKeywords.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4 w-full">No keyword data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recommendation Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelData.map((stage, i) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="font-bold">{stage.count.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: recAccuracy.total > 0 ? `${(stage.count / recAccuracy.total) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
              </motion.div>
            ))}
            {recAccuracy.total === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recommendation data yet</p>
            )}

            <div className="pt-4 border-t border-border/40">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{recAccuracy.total}</p>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{recAccuracy.accuracy}%</p>
                  <p className="text-xs text-muted-foreground">Interview Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Internship Success Rate Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Internship Success Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-2xl bg-muted/50">
              <p className="text-3xl font-bold">{successRate.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Active Internships</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-emerald-500/5">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{successRate.filled}</p>
              <p className="text-sm text-muted-foreground mt-1">Filled Positions</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-primary/5">
              <p className="text-3xl font-bold text-primary">{successRate.rate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Fill Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
