"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Building2, Briefcase, Loader2, X, Sparkles, School, Award, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SearchFilter, SearchResult } from "@/lib/types";

export function GlobalSearch() {
  const { token, user, navigate, pushToast, setSearchQuery } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState<SearchFilter>("all");
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
        const params = new URLSearchParams({ q: query.trim() });
        if (activeType !== "all") params.set("type", activeType);
        const res = await fetch(`/api/search?${params.toString()}`, {
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
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeType, token, user]);

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

  const openCertificate = (userId?: string) => {
    setOpen(false);
    setQuery("");
    if (userId) {
      navigate("public-profile", { userId });
    } else {
      pushToast({ title: "Certificate", message: "Browse certificates from student profiles", type: "info" });
    }
  };

  const openSkill = (name: string) => {
    setOpen(false);
    setQuery(name);
    setActiveType("people");
    setOpen(true);
  };

  const openCollege = (name: string) => {
    setOpen(false);
    setQuery(name);
    setActiveType("people");
    setOpen(true);
  };

  const seeAllResults = () => {
    setOpen(false);
    setSearchQuery(query);
    navigate("search");
  };

  const showStudents = activeType === "all" || activeType === "people";
  const showInternships = activeType === "all" || activeType === "internships";
  const showCompanies = activeType === "all" || activeType === "companies";
  const showSkills = activeType === "all" || activeType === "skills";
  const showColleges = activeType === "all" || activeType === "colleges";
  const showCerts = activeType === "all" || activeType === "certificates";

  const totalCount =
    (showStudents ? results?.students.length || 0 : 0) +
    (showCompanies ? results?.companies.length || 0 : 0) +
    (showInternships ? results?.internships.length || 0 : 0) +
    (showSkills ? results?.skills.length || 0 : 0) +
    (showColleges ? results?.colleges.length || 0 : 0) +
    (showCerts ? results?.certificates.length || 0 : 0);

  const filters: Array<{ key: SearchFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "people", label: "People" },
    { key: "companies", label: "Companies" },
    { key: "internships", label: "Internships" },
    { key: "skills", label: "Skills" },
    { key: "colleges", label: "Colleges" },
    { key: "certificates", label: "Certificates" },
  ];

  return (
    <div ref={wrapRef} className="relative hidden md:block w-64 lg:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search people, skills, colleges..."
          className="w-full h-9 pl-9 pr-8 rounded-full bg-muted/50 border border-border/40 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/70 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); setOpen(false); }}
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
            className="absolute top-11 right-0 w-[420px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-hidden rounded-2xl glass-strong shadow-premium border border-white/10 z-50"
          >
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-white/[0.02]">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveType(f.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                    activeType === f.key
                      ? "bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 text-white border border-white/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[52vh] p-2">
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : totalCount === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try a name, skill, @username, college, or company</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* People */}
                  {showStudents && results?.students.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> People
                      </p>
                      <div className="space-y-1">
                        {results.students.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openStudent(s.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left group"
                          >
                            <Avatar className="w-9 h-9 shrink-0">
                              {s.avatarUrl ? <AvatarImage src={s.avatarUrl} /> : null}
                              <AvatarFallback className="text-white text-xs font-bold">
                                {s.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {s.name}
                                {s.username && <span className="text-muted-foreground font-normal text-xs ml-1">@{s.username}</span>}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.headline || [s.degree, s.branch].filter(Boolean).join(" · ") || "Student"}
                              </p>
                              {s.skills.length > 0 && (
                                <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                  {s.skills.slice(0, 4).join(" · ")}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-0.5">
                              {s.atsScore != null && (
                                <Badge variant="secondary" className={cn(
                                  "text-[9px]",
                                  s.atsScore >= 80 ? "text-emerald-400" : s.atsScore >= 50 ? "text-amber-400" : "text-muted-foreground"
                                )}>
                                  ATS {s.atsScore}%
                                </Badge>
                              )}
                              {s.followersCount > 0 && (
                                <span className="text-[10px] text-muted-foreground">{s.followersCount} followers</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {showSkills && results?.skills.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {results.skills.map((sk) => (
                          <button
                            key={sk.name}
                            onClick={() => openSkill(sk.name)}
                            className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            {sk.name} <span className="text-muted-foreground text-[10px]">{sk.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colleges */}
                  {showColleges && results?.colleges.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <School className="w-3 h-3" /> Colleges
                      </p>
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {results.colleges.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => openCollege(c.name)}
                            className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            {c.name} <span className="text-muted-foreground text-[10px]">{c.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internships */}
                  {showInternships && results?.internships.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Internships
                      </p>
                      <div className="space-y-1">
                        {results.internships.map((i) => (
                          <button
                            key={i.id}
                            onClick={() => openInternship(i.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4 text-primary" />
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

                  {/* Companies */}
                  {showCompanies && results?.companies.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Companies
                      </p>
                      <div className="space-y-1">
                        {results.companies.map((c) => (
                          <button
                            key={c.id}
                            onClick={openCompany}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center shrink-0">
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

                  {/* Certificates */}
                  {showCerts && results?.certificates.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" /> Certificates
                      </p>
                      <div className="space-y-1">
                        {results.certificates.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => openCertificate(c.userId)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.organization}</p>
                            </div>
                            {c.category && <Badge variant="secondary" className="text-[9px] shrink-0">{c.category}</Badge>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* See all */}
            <button
              onClick={seeAllResults}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-white/10 text-xs font-medium text-primary hover:bg-white/[0.04] transition-colors"
            >
              See all results <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
