"use client";
import { motion } from "framer-motion";
import {
  Users, Building2, Briefcase, FileText, TrendingUp,
  Star, CheckCircle2, Clock, PieChart as PieIcon, BarChart3,
  Activity, MapPin, Award, Loader2, Shield,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#84cc16", "#f43f5e", "#3b82f6"];

export function AdminDashboard() {
  const { user, token, pushToast } = useApp();
  const queryClient = useQueryClient();

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

  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies");
      return res.json();
    },
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

  const stats = data || {};
  const totals = stats.totals || {};

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
            <Shield className="w-5 h-5 text-white" />
            <p className="text-white/80 text-sm">Admin Console</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Platform Overview
          </h1>
          <p className="text-white/90 mt-2">
            Real-time insights into the PM Internship Scheme ecosystem
          </p>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[
          { label: "Students", value: totals.totalStudents, icon: Users, color: "from-emerald-500 to-teal-600" },
          { label: "Companies", value: totals.totalCompanies, icon: Building2, color: "from-amber-500 to-orange-600" },
          { label: "Internships", value: totals.totalInternships, icon: Briefcase, color: "from-pink-500 to-rose-600" },
          { label: "Applications", value: totals.totalApplications, icon: FileText, color: "from-cyan-500 to-blue-600" },
          { label: "Active Users", value: totals.activeUsers, icon: Activity, color: "from-violet-500 to-purple-600" },
          { label: "Pending Cos", value: totals.pendingCompanies, icon: Clock, color: "from-red-500 to-rose-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-premium transition-shadow">
              <CardContent className="p-4">
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2.5", stat.color)}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value?.toLocaleString("en-IN") || 0}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications over time (Area chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Applications Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.applicationsOverTime || []}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="name" stroke="rgba(120,120,120,0.6)" fontSize={11} />
                <YAxis stroke="rgba(120,120,120,0.6)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorApps)"
                  name="Applications"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Applications by status (Pie chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Applications by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.appsByStatus || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {(stats.appsByStatus || []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Internships by domain */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Internships by Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.internshipsByDomain || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" horizontal={false} />
                <XAxis type="number" stroke="rgba(120,120,120,0.6)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(120,120,120,0.6)"
                  fontSize={10}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {(stats.internshipsByDomain || []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Top In-Demand Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.topSkills || []}>
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
                  {(stats.topSkills || []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top companies + regional distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Top Companies by Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats.companyStats || []).map((c: any, i: number) => (
              <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg gradient-emerald flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.internships} internships · ⭐ {c.rating}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{c.applications}</p>
                  <p className="text-[10px] text-muted-foreground">apps</p>
                </div>
              </div>
            ))}
            {(!stats.companyStats || stats.companyStats.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.regional || []}>
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
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent users / companies management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Recent Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="text-left font-medium py-2 px-2">User</th>
                  <th className="text-left font-medium py-2 px-2 hidden md:table-cell">Role</th>
                  <th className="text-left font-medium py-2 px-2 hidden md:table-cell">College / Company</th>
                  <th className="text-left font-medium py-2 px-2">Status</th>
                  <th className="text-left font-medium py-2 px-2 hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(usersData?.users || []).slice(0, 8).map((u: any) => (
                  <tr key={u.id} className="border-b border-border/40 text-sm hover:bg-accent/30">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 gradient-emerald">
                          <AvatarFallback className="text-white text-xs">
                            {u.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 hidden md:table-cell">
                      <Badge variant="secondary" className="text-[10px]">{u.role}</Badge>
                    </td>
                    <td className="py-3 px-2 hidden md:table-cell text-xs text-muted-foreground">
                      {u.college || "—"}
                    </td>
                    <td className="py-3 px-2">
                      {u.isApproved ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
