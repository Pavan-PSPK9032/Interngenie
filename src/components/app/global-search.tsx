"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Building2, Briefcase, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types";

export function GlobalSearch() {
  const { token, user, navigate, pushToast } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState<"all" | "students" | "companies" | "internships">("all");
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          headers: user ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok) setResults(data);
        else setResults(null);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, token, user]);

  const openStudent = (id: string) => {
    setOpen(false);
    setQuery("");
    navigate("public-profile", { userId: id });
  };

  const openInternship = (id: string) => {
    setOpen(false);
    setQuery("");
    navigate("internship-detail", { internshipId: id });
  };

  const openCompany = () => {
    setOpen(false);
    setQuery("");
    pushToast({ title: "Company profiles", message: "Browse companies from the internships page", type: "info" });
    navigate("internships");
  };

  const filteredStudents = () => (activeType === "all" || activeType === "students" ? results?.students || [] : []);
  const filteredCompanies = () => (activeType === "all" || activeType === "companies" ? results?.companies || [] : []);
  const filteredInternships = () => (activeType === "all" || activeType === "internships" ? results?.internships || [] : []);

  const totalCount =
    (filteredStudents().length + filteredCompanies().length + filteredInternships().length);

  return (
    <div ref={wrapRef} className="relative hidden md:block w-64 lg:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search students, companies, internships..."
          className="w-full h-9 pl-9 pr-8 rounded-full bg-muted/50 border border-border/40 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/70 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-11 right-0 w-80 lg:w-96 max-h-[70vh] overflow-hidden rounded-2xl glass-strong shadow-premium border border-border/40 z-50"
          >
            {/* Type filter tabs */}
            <div className="flex gap-1 p-2 border-b border-border/40 bg-card/40">
              {(["all", "students", "companies", "internships"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors",
                    activeType === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[55vh] p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : totalCount === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try a different keyword</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents().length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> Students
                      </p>
                      <div className="space-y-1">
                        {filteredStudents().map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openStudent(s.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full gradient-emerald flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.college || "Student"} {s.branch && `· ${s.branch}`}
                              </p>
                            </div>
                            {s.skills.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] shrink-0">{s.skills[0]}</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredInternships().length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Internships
                      </p>
                      <div className="space-y-1">
                        {filteredInternships().map((i) => (
                          <button
                            key={i.id}
                            onClick={() => openInternship(i.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{i.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{i.company} · {i.location}</p>
                            </div>
                            {i.stipend > 0 && (
                              <Badge variant="outline" className="text-[10px] shrink-0">₹{i.stipend}</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCompanies().length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Companies
                      </p>
                      <div className="space-y-1">
                        {filteredCompanies().map((c) => (
                          <button
                            key={c.id}
                            onClick={openCompany}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {c.industry || "Company"} {c.location && `· ${c.location}`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
