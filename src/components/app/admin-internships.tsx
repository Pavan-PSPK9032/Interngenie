"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, CheckCircle2, XCircle, Loader2, Search,
  Clock, Calendar, ShieldCheck, Trash2, Inbox, IndianRupee,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AdminInternship {
  id: string;
  title: string;
  companyId: string;
  company?: { id: string; name: string; status?: string; approved?: boolean; verified?: boolean };
  description: string;
  domain: string;
  location: string;
  workMode: string;
  duration: number;
  stipend: number;
  openings: number;
  skills: string[];
  deadline?: string;
  isActive: boolean;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export function AdminInternships() {
  const { token, pushToast } = useApp();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<AdminInternship | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-internships", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ includePending: "1", limit: "100" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/internships?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const internships: AdminInternship[] = (data?.internships || []).filter((i: AdminInternship) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      (i.company?.name || "").toLowerCase().includes(q) ||
      i.domain.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  });

  const updateStatus = async (id: string, status: string) => {
    const body: Record<string, string> = { status };
    if (status === "REJECTED" && rejectReason) body.rejectionReason = rejectReason;
    try {
      const res = await fetch(`/api/admin/internships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-internships"] });
        pushToast({ title: `Internship ${status.toLowerCase()}`, type: "success" });
        setSelected(null);
        setRejectReason("");
      } else {
        pushToast({ title: "Action failed", type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/internships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-internships"] });
        pushToast({ title: isActive ? "Internship deactivated" : "Internship activated", type: "success" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  const deleteInternship = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/internships/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-internships"] });
        pushToast({ title: "Internship deleted", type: "success" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      REJECTED: "bg-red-500/10 text-red-700 dark:text-red-400",
      EXPIRED: "bg-muted text-muted-foreground",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  const counts = {
    all: data?.total || internships.length,
    pending: (data?.internships || []).filter((i: AdminInternship) => i.status === "PENDING").length,
    approved: (data?.internships || []).filter((i: AdminInternship) => i.status === "APPROVED").length,
    rejected: (data?.internships || []).filter((i: AdminInternship) => i.status === "REJECTED").length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Internship Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve, reject, and moderate all internship postings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, color: "from-emerald-500 to-teal-600" },
          { label: "Pending", value: counts.pending, color: "from-amber-500 to-orange-600" },
          { label: "Approved", value: counts.approved, color: "from-cyan-500 to-blue-600" },
          { label: "Rejected", value: counts.rejected, color: "from-red-500 to-rose-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", s.color)}>
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, company, domain, or location..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["ALL", "PENDING", "APPROVED", "REJECTED", "EXPIRED"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
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
      ) : internships.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No internships found</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {statusFilter === "PENDING"
                ? "No internships are awaiting approval right now."
                : "Try adjusting your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {internships.map((i: AdminInternship, idx: number) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            >
              <Card className="hover:shadow-premium transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl gradient-emerald flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate">{i.title}</p>
                        <Badge className={cn("text-[10px]", statusBadge(i.status))}>{i.status}</Badge>
                        {!i.isActive && (
                          <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {i.company?.name || "Unknown company"} · {i.domain} · {i.location} · {i.workMode}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{i.duration} wks</span>
                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{i.stipend.toLocaleString("en-IN")}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{i.deadline ? new Date(i.deadline).toLocaleDateString() : "No deadline"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {i.skills.slice(0, 6).map((s, si) => (
                          <Badge key={si} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                        {i.skills.length > 6 && <Badge variant="secondary" className="text-[10px]">+{i.skills.length - 6}</Badge>}
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40 flex-wrap">
                        {i.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="gradient-emerald text-white h-8 text-xs gap-1"
                              onClick={() => updateStatus(i.id, "APPROVED")}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </Button>
                            <Dialog open={rejectId === i.id} onOpenChange={(o) => { if (!o) { setRejectId(null); setRejectReason(""); } }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-red-500/40 text-red-600 dark:text-red-400">
                                  <XCircle className="w-3 h-3" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject "{i.title}"</DialogTitle>
                                </DialogHeader>
                                <Input
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Reason for rejection (optional)"
                                  className="mt-2"
                                />
                                <DialogFooter className="mt-4">
                                  <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
                                  <Button variant="destructive" onClick={() => { updateStatus(i.id, "REJECTED"); }}>
                                    Reject Internship
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        {i.status === "APPROVED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1"
                              onClick={() => toggleActive(i.id, i.isActive)}
                            >
                              {i.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-red-500/40 text-red-600 dark:text-red-400"
                              onClick={() => updateStatus(i.id, "EXPIRED")}
                            >
                              <Clock className="w-3 h-3" />
                              Mark Expired
                            </Button>
                          </>
                        )}
                        {i.status === "REJECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => updateStatus(i.id, "APPROVED")}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Re-approve
                          </Button>
                        )}
                        {i.rejectionReason && (
                          <span className="text-xs text-red-600 dark:text-red-400 ml-1">
                            Reason: {i.rejectionReason}
                          </span>
                        )}
                        <div className="ml-auto flex gap-1.5">
                          <Dialog open={selected?.id === i.id} onOpenChange={(o) => { if (!o) setSelected(null); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1">
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{selected?.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                <div className="flex flex-wrap gap-2">
                                  <Badge className={cn("text-[10px]", selected && statusBadge(selected.status))}>
                                    {selected?.status}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[10px]">{selected?.company?.name}</Badge>
                                  <Badge variant="secondary" className="text-[10px]">{selected?.domain}</Badge>
                                  <Badge variant="secondary" className="text-[10px]">{selected?.location}</Badge>
                                  <Badge variant="secondary" className="text-[10px]">{selected?.workMode}</Badge>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                                  <p className="text-sm">{selected?.description}</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="font-medium">{selected?.duration} wks</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Stipend</p>
                                    <p className="font-medium">₹{selected?.stipend.toLocaleString("en-IN")}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Openings</p>
                                    <p className="font-medium">{selected?.openings}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Deadline</p>
                                    <p className="font-medium">{selected?.deadline ? new Date(selected.deadline).toLocaleDateString() : "—"}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selected?.skills.map((s, si) => (
                                      <Badge key={si} variant="secondary" className="text-[10px]">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                                {selected?.rejectionReason && (
                                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                                    <strong>Rejection reason:</strong> {selected.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-red-600 dark:text-red-400">
                                <Trash2 className="w-3 h-3" />
                                {deletingId === i.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete internship?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes "{i.title}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteInternship(i.id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
