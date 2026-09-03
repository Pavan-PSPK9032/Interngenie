"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase, Inbox, Loader2, Calendar, User as UserIcon, CheckCircle2,
  XCircle, Clock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  APPLIED: "bg-muted text-muted-foreground",
  REVIEW: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  INTERVIEW: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  SELECTED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-500/10 text-red-700 dark:text-red-400",
};

interface AdminApplication {
  id: string;
  status: string;
  matchScore: number;
  createdAt: string;
  interviewScheduledAt?: string;
  feedback?: string;
  student?: { name?: string; email?: string; college?: string; branch?: string; cgpa?: number } | undefined;
  internship?: {
    title?: string;
    domain?: string;
    location?: string;
    workMode?: string;
    stipend?: number;
    company?: { name?: string } | undefined;
  } | undefined;
}

export function AdminApplications() {
  const { token, pushToast } = useApp();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load applications");
      return res.json();
    },
    enabled: !!token,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, feedback: status === "REJECTED" ? feedback || undefined : undefined }),
      });
      if (!res.ok) throw new Error("Failed to update application");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      setSelected(null);
      setFeedback("");
      pushToast({ title: "Application updated", type: "success" });
    },
    onError: () => pushToast({ title: "Update failed", type: "error" }),
  });

  const applications: AdminApplication[] = (data?.applications || []).filter((a: AdminApplication) => {
    const matchesStatus = filter === "ALL" ? true : a.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (a.student?.name || "").toLowerCase().includes(q) ||
      (a.student?.email || "").toLowerCase().includes(q) ||
      (a.internship?.title || "").toLowerCase().includes(q) ||
      (a.internship?.company?.name || "").toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const counts = (data?.applications || []).reduce(
    (acc: Record<string, number>, a: AdminApplication) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    { ALL: (data?.applications || []).length }
  );

  const runStatus = (id: string, status: string) => {
    setBusyId(id);
    updateStatus.mutate({ id, status }, { onSettled: () => setBusyId(null) });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Application Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and update the status of every application across all internships
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "All", key: "ALL" },
          { label: "Applied", key: "APPLIED" },
          { label: "Review", key: "REVIEW" },
          { label: "Interview", key: "INTERVIEW" },
          { label: "Selected", key: "SELECTED" },
          { label: "Rejected", key: "REJECTED" },
        ].map((s) => (
          <Card key={s.key}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{counts[s.key] || 0}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student, email, internship, or company..."
            className="md:max-w-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {["ALL", "APPLIED", "REVIEW", "INTERVIEW", "SELECTED", "REJECTED"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                onClick={() => setFilter(s)}
                className="h-9"
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No applications found</p>
            <p className="text-sm text-muted-foreground max-w-sm">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((a: AdminApplication, idx: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            >
              <Card className="hover:shadow-premium transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl gradient-emerald flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">{a.student?.name || "Unknown student"}</p>
                        <Badge className={cn("text-[10px]", STATUS_BADGE[a.status] || "")}>{a.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.internship?.title || "Internship"} · {a.internship?.company?.name || "Unknown company"} · {a.internship?.location || "—"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Match {a.matchScore}%</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Applied {new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                        {a.interviewScheduledAt && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(a.interviewScheduledAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                        {a.feedback && <span className="text-red-600 dark:text-red-400">Reason: {a.feedback}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.status !== "SELECTED" && a.status !== "REJECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => runStatus(a.id, "SELECTED")}
                          disabled={busyId === a.id}
                        >
                          {busyId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Select
                        </Button>
                      )}
                      {a.status !== "REJECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-red-500/40 text-red-600 dark:text-red-400"
                          onClick={() => { setSelected(a); setFeedback(a.feedback || ""); }}
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </Button>
                      )}
                      <Dialog open={selected?.id === a.id} onOpenChange={(o) => { if (!o) setSelected(null); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 text-xs">View</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{a.internship?.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Student</p>
                                <p className="font-medium">{a.student?.name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{a.student?.email}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Company</p>
                                <p className="font-medium">{a.internship?.company?.name || "—"}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Match</p>
                                <p className="font-medium">{a.matchScore}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Applied</p>
                                <p className="font-medium">{new Date(a.createdAt).toLocaleDateString("en-IN")}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="font-medium">{a.status}</p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                              <p className="text-xs">{a.feedback || "No feedback provided."}</p>
                            </div>
                          </div>
                          {(a.status === "REJECTED" || a.status === "APPLIED" || a.status === "REVIEW") && (
                            <DialogFooter className="mt-4">
                              <Input
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Feedback / rejection reason (optional)"
                                className="mr-auto"
                              />
                              <Button
                                variant="destructive"
                                onClick={() => runStatus(a.id, "REJECTED")}
                                disabled={busyId === a.id}
                              >
                                {busyId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Reject
                              </Button>
                            </DialogFooter>
                          )}
                        </DialogContent>
                      </Dialog>
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
