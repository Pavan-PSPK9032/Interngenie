"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Building2, Briefcase, Sparkles, School, Award,
  Loader2, ArrowRight, TrendingUp, Clock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FollowButton } from "@/components/app/follow-button";
import { cn } from "@/lib/utils";
import type { SearchFilter, SearchResult, SearchSort } from "@/lib/types";

export function SearchResults() {
  const { token, user, navigate, searchQuery, setSearchQuery, pushToast } = useApp();
  const [query, setQuery] = useState(searchQuery);
  const [debounced, setDebounced] = useState(searchQuery);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [sort, setSort] = useState<SearchSort>("relevance");

  useEffect(() => {
    setQuery(searchQuery);
    setDebounced(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ q: debounced.trim(), sort });
    if (filter !== "all") params.set("type", filter);
    fetch(`/api/search?${params.toString()}`, {
      headers: user ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debounced, filter, sort, token, user]);

  const openStudent = (id: string) => navigate("public-profile", { userId: id });
  const openInternship = (id: string) => navigate("internship-detail", { internshipId: id });
  const openCompany = () => {
    pushToast({ title: "Company profiles", message: "Browse companies from the internships page", type: "info" });
    navigate("internships");
  };

  const show = (f: SearchFilter) => filter === "all" || filter === f;

  const filters: Array<{ key: SearchFilter; label: string; icon: any }> = [
    { key: "all", label: "All", icon: Search },
    { key: "people", label: "People", icon: Users },
    { key: "companies", label: "Companies", icon: Building2 },
    { key: "internships", label: "Internships", icon: Briefcase },
    { key: "skills", label: "Skills", icon: Sparkles },
    { key: "colleges", label: "Colleges", icon: School },
    { key: "certificates", label: "Certificates", icon: Award },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name, @username, skill, college, company..."
          className="w-full h-[52px] py-3.5 pl-12 pr-4 rounded-2xl glass-card border-white/10 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/70"
        />
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all",
                filter === f.key
                  ? "bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 text-white border border-white/10"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSort("relevance")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all",
              sort === "relevance" ? "bg-white/[0.06] text-foreground border border-white/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Most Relevant
          </button>
          <button
            onClick={() => setSort("newest")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all",
              sort === "newest" ? "bg-white/[0.06] text-foreground border border-white/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-3.5 h-3.5" /> Newest
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 shimmer rounded-2xl" />
          ))}
        </div>
      ) : !debounced.trim() ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Start typing to search across InternGenie</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Students, skills, colleges, companies, internships, and certificates</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* People */}
          {show("people") && results?.students && results.students.length > 0 && (
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" /> People
                <Badge variant="secondary" className="text-[10px]">{results.students.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.students.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl glass-card border-white/[0.08] p-5 space-y-3 transition-shadow hover:shadow-[0_12px_40px_-10px_rgba(99,102,241,0.35)]"
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={() => openStudent(s.id)} className="shrink-0 group">
                        <Avatar className="w-12 h-12 transition-transform group-hover:scale-105">
                          {s.avatarUrl ? <AvatarImage src={s.avatarUrl} /> : null}
                          <AvatarFallback className="text-white text-base font-bold">
                            {s.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => openStudent(s.id)}
                          className="text-sm font-bold truncate block hover:text-primary transition-colors text-left"
                        >
                          {s.name}
                          {s.username && <span className="text-muted-foreground font-normal text-xs ml-1">@{s.username}</span>}
                        </button>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.headline || [s.degree, s.branch].filter(Boolean).join(" · ") || "Student"}
                        </p>
                        {s.college && <p className="text-[11px] text-muted-foreground/70 truncate">{s.college}</p>}
                      </div>
                    </div>

                    {s.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.skills.slice(0, 4).map((sk) => (
                          <Badge key={sk} variant="secondary" className="text-[9px]">{sk}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Profile completion</span>
                        <span className="font-semibold">{s.profileCompleted}%</span>
                      </div>
                      <Progress value={s.profileCompleted} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {s.atsScore != null && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-md font-semibold",
                            s.atsScore >= 80 ? "bg-emerald-500/10 text-emerald-500" : s.atsScore >= 50 ? "bg-amber-500/10 text-amber-500" : "bg-white/[0.05]"
                          )}>
                            ATS {s.atsScore}%
                          </span>
                        )}
                        {s.followersCount > 0 && <span>{s.followersCount} followers</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <FollowButton userId={s.id} size="sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStudent(s.id)}
                        className="gap-1.5 text-xs flex-1"
                      >
                        View Profile <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {show("skills") && results?.skills && results.skills.length > 0 && (
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" /> Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.skills.map((sk) => (
                  <button
                    key={sk.name}
                    onClick={() => { setQuery(sk.name); setFilter("people"); }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {sk.name} <span className="text-muted-foreground text-[10px]">· {sk.count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Colleges */}
          {show("colleges") && results?.colleges && results.colleges.length > 0 && (
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <School className="w-4 h-4 text-primary" /> Colleges
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.colleges.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setQuery(c.name); setFilter("people"); }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {c.name} <span className="text-muted-foreground text-[10px]">· {c.count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Internships */}
          {show("internships") && results?.internships && results.internships.length > 0 && (
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-primary" /> Internships
                <Badge variant="secondary" className="text-[10px]">{results.internships.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.internships.map((i) => (
                  <motion.button
                    key={i.id}
                    onClick={() => openInternship(i.id)}
                    whileHover={{ y: -3 }}
                    className="text-left rounded-2xl glass-card border-white/[0.08] p-5 space-y-2 transition-shadow hover:shadow-[0_12px_40px_-10px_rgba(34,211,238,0.3)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{i.title}</p>
                      {i.stipend > 0 && <Badge className="gradient-primary text-white text-[10px] shrink-0">₹{i.stipend}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{i.company} · {i.location} · {i.workMode}</p>
                    {i.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {i.skills.slice(0, 4).map((sk) => (
                          <Badge key={sk} variant="outline" className="text-[9px]">{sk}</Badge>
                        ))}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* Companies */}
          {show("companies") && results?.companies && results.companies.length > 0 && (
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-primary" /> Companies
                <Badge variant="secondary" className="text-[10px]">{results.companies.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.companies.map((c) => (
                  <motion.button
                    key={c.id}
                    onClick={openCompany}
                    whileHover={{ y: -3 }}
                    className="text-left rounded-2xl glass-card border-white/[0.08] p-5 space-y-2 transition-shadow hover:shadow-[0_12px_40px_-10px_rgba(99,102,241,0.3)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-glow">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.industry || "Company"}</p>
                      </div>
                    </div>
                    {c.location && <p className="text-[11px] text-muted-foreground/70">{c.location}</p>}
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* Certificates */}
          {show("certificates") && results?.certificates && results.certificates.length > 0 && (
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" /> Certificates
                <Badge variant="secondary" className="text-[10px]">{results.certificates.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.certificates.map((c) => (
                  <motion.button
                    key={c.id}
                    onClick={() => c.userId && openStudent(c.userId)}
                    whileHover={{ y: -3 }}
                    className="text-left rounded-2xl glass-card border-white/[0.08] p-5 space-y-2 transition-shadow hover:shadow-[0_12px_40px_-10px_rgba(34,211,238,0.3)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.organization}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {c.category && <Badge variant="secondary" className="text-[9px]">{c.category}</Badge>}
                      {c.issueDate && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.issueDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {results &&
            (results.students?.length || 0) +
              (results.companies?.length || 0) +
              (results.internships?.length || 0) +
              (results.skills?.length || 0) +
              (results.colleges?.length || 0) +
              (results.certificates?.length || 0) === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">No results for "{debounced}"</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Try a different keyword or filter</p>
              </div>
            )}
        </div>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass-card border-white/10 text-xs text-muted-foreground"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
