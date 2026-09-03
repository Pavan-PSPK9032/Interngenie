"use client";
import { motion } from "framer-motion";
import {
  Building2, CheckCircle2, XCircle, Star, ExternalLink,
  Loader2, Shield, Award,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AdminCompanies() {
  const { user, token, pushToast } = useApp();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const res = await fetch("/api/admin/companies?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const updateCompany = async (id: string, approved: boolean, verified?: boolean) => {
    try {
      const res = await fetch("/api/companies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, approved, verified }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["companies"] });
        pushToast({
          title: approved ? "Company approved" : "Company rejected",
          type: approved ? "success" : "warning",
        });
      }
    } catch {}
  };

  const companies = data?.companies || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Manage Companies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approve, verify, and monitor companies on the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Companies", value: companies.length, color: "from-emerald-500 to-teal-600" },
          { label: "Verified", value: companies.filter((c: any) => c.verified).length, color: "from-cyan-500 to-blue-600" },
          { label: "Approved", value: companies.filter((c: any) => c.approved).length, color: "from-amber-500 to-orange-600" },
          { label: "Avg Rating", value: (companies.reduce((acc: number, c: any) => acc + c.rating, 0) / companies.length || 0).toFixed(1), color: "from-pink-500 to-rose-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", s.color)}>
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Companies grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 shimmer rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((c: any, idx: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
            >
              <Card className="hover:shadow-premium transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl gradient-emerald flex items-center justify-center shrink-0 shadow-glow">
                      <span className="text-white font-bold text-xl">{c.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.industry} · {c.location}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-semibold">{c.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {c.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="secondary" className="text-[10px]">{c.size}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{c.internshipCount} internships</Badge>
                        {c.verified ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] gap-0.5">
                            <Award className="w-2.5 h-2.5" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Unverified</Badge>
                        )}
                        {c.status === "SUSPENDED" ? (
                          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 text-[10px]">Suspended</Badge>
                        ) : c.status === "PENDING" || !c.approved ? (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">Pending</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Approved
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40">
                        {c.website && (
                          <Button variant="ghost" size="sm" className="text-xs h-8 gap-1" asChild>
                            <a href={c.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                              Visit
                            </a>
                          </Button>
                        )}
                        <div className="ml-auto flex gap-1.5">
                          {!c.approved ? (
                            <Button
                              size="sm"
                              onClick={() => updateCompany(c.id, true)}
                              className="gradient-emerald text-white h-8 text-xs gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCompany(c.id, false)}
                              className="h-8 text-xs gap-1 border-red-500/40 text-red-600 dark:text-red-400"
                            >
                              <XCircle className="w-3 h-3" />
                              Revoke
                            </Button>
                          )}
                          {!c.verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCompany(c.id, c.approved, true)}
                              className="h-8 text-xs gap-1"
                            >
                              <Shield className="w-3 h-3" />
                              Verify
                            </Button>
                          )}
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
