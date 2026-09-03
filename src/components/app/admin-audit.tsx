"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ScrollText, Inbox, Loader2, ShieldCheck, Trash2, Briefcase, User as UserIcon, RefreshCw,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  user?: { name?: string; email?: string; role?: string } | undefined;
}

const actionStyle = (action: string) => {
  const a = (action || "").toLowerCase();
  if (a.includes("delete")) return "bg-red-500/10 text-red-700 dark:text-red-400";
  return "bg-primary/10 text-primary";
};

export function AdminAudit() {
  const { token } = useApp();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setPage(data.page || 1);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, actionFilter]);

  const actions = [...new Set(logs.filter((l) => l.action).map((l) => l.action))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            A record of administrative actions across the platform
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => load(page)} className="h-9 gap-1">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">{total} entries</Badge>
          <button
            onClick={() => setActionFilter("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              actionFilter === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-white/[0.06]"
            )}
          >
            All
          </button>
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                actionFilter === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-white/[0.06]"
              )}
            >
              {a.replace(/_/g, " ")}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 shimmer rounded-2xl" />)}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No audit entries yet</p>
            <p className="text-sm text-muted-foreground">Actions performed by admins will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((l: AuditEntry, idx: number) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            >
              <Card className="hover:shadow-premium transition-all">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {l.action.toLowerCase().includes("delete") ? (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    ) : l.resource === "Internship" ? (
                      <Briefcase className="w-4 h-4 text-primary" />
                    ) : l.resource === "Company" ? (
                      <UserIcon className="w-4 h-4 text-primary" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("text-[10px]", actionStyle(l.action))}>
                        {l.action.replace(/_/g, " ")}
                      </Badge>
                      {l.resource && <Badge variant="outline" className="text-[10px]">{l.resource}</Badge>}
                      {l.resourceId && (
                        <span className="text-[11px] text-muted-foreground font-mono">#{l.resourceId.slice(0, 12)}</span>
                      )}
                    </div>
                    <p className="text-sm mt-1.5">
                      <span className="font-medium">{l.user?.name || l.userId || "System"}</span>
                      {l.user?.email && <span className="text-muted-foreground"> · {l.user.email}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(l.createdAt).toLocaleString("en-IN")}
                      {l.ip ? ` · IP ${l.ip}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => load(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
