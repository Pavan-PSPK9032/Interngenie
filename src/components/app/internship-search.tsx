"use client";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  Search, Filter, X, MapPin, Briefcase, Calendar, IndianRupee,
  Heart, ArrowRight, SlidersHorizontal,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const DOMAINS = [
  "Data Science", "Web Development", "Artificial Intelligence", "Backend Development",
  "DevOps", "Design", "Marketing", "Data Analytics", "Mobile Development",
  "Product Management", "Cybersecurity",
];

const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const LOCATIONS = [
  "Bengaluru", "Hyderabad", "Chennai", "Mumbai", "Pune",
  "Noida", "Gurugram", "Delhi", "Remote",
];

export function InternshipSearch() {
  const { navigate, savedInternships, toggleSaved, pushToast, user, token } = useApp();
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<string>("");
  const [workMode, setWorkMode] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [minStipend, setMinStipend] = useState(0);
  const [maxDuration, setMaxDuration] = useState(24);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Build query string
  const queryStr = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (domain) params.set("domain", domain);
    if (workMode) params.set("workMode", workMode);
    if (location) params.set("location", location);
    if (minStipend > 0) params.set("minStipend", String(minStipend));
    if (maxDuration < 24) params.set("maxDuration", String(maxDuration));
    params.set("sort", sort);
    return params.toString();
  }, [search, domain, workMode, location, minStipend, maxDuration, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ["internships", queryStr],
    queryFn: async () => {
      const res = await fetch(`/api/internships?${queryStr}`);
      if (!res.ok) return { internships: [] };
      return res.json();
    },
  });

  // Fetch match scores for the logged-in student
  const { data: recData } = useQuery({
    queryKey: ["recommendations-for-search", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "STUDENT",
  });

  const matchMap: Record<string, any> = {};
  if (recData?.recommendations) {
    for (const r of recData.recommendations) {
      matchMap[r.internshipId] = r;
    }
  }

  const internships = data?.internships || [];
  const sortedInternships = useMemo(() => {
    if (sort === "match" && user?.role === "STUDENT") {
      return [...internships].sort((a, b) => {
        const ma = matchMap[a.id]?.score || 0;
        const mb = matchMap[b.id]?.score || 0;
        return mb - ma;
      });
    }
    return internships;
  }, [internships, sort, matchMap, user]);

  const clearFilters = () => {
    setSearch("");
    setDomain("");
    setWorkMode("");
    setLocation("");
    setMinStipend(0);
    setMaxDuration(24);
  };

  const hasActiveFilters = domain || workMode || location || minStipend > 0 || maxDuration < 24;

  const apply = async (internshipId: string) => {
    if (!user) {
      navigate("auth");
      return;
    }
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ internshipId }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ title: "Applied!", message: `Match score: ${data.match.score}%`, type: "success" });
      } else {
        pushToast({ title: "Could not apply", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    }
  };

  const filterContent = (
    <div className="space-y-5">
      {/* Domain */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Domain</Label>
        <Select value={domain || "__all__"} onValueChange={(v) => setDomain(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All domains</SelectItem>
            {DOMAINS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Work mode */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Work Mode</Label>
        <div className="grid grid-cols-3 gap-2">
          {WORK_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setWorkMode(workMode === m.value ? "" : m.value)}
              className={cn(
                "px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                workMode === m.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Location</Label>
        <Select value={location || "__all__"} onValueChange={(v) => setLocation(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All locations</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stipend */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Min Stipend: ₹{minStipend.toLocaleString("en-IN")}/mo
        </Label>
        <Slider
          value={[minStipend]}
          onValueChange={(v) => setMinStipend(v[0])}
          max={50000}
          step={2000}
          className="mt-2"
        />
      </div>

      {/* Duration */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Max Duration: {maxDuration} weeks
        </Label>
        <Slider
          value={[maxDuration]}
          onValueChange={(v) => setMaxDuration(v[0])}
          max={24}
          min={4}
          step={2}
          className="mt-2"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full gap-1.5">
          <X className="w-4 h-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Find your <span className="gradient-text">internship</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse {internships.length} active internships from {DOMAINS.length}+ domains
          {user?.role === "STUDENT" && " — sorted by your AI match score"}
        </p>
      </div>

      {/* Search + Sort bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, skill, or company..."
            className="pl-9 h-11 rounded-xl"
          />
        </div>

        {/* Mobile filter button */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden h-11 w-11 rounded-xl shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36 md:w-44 h-11 rounded-xl shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            {user?.role === "STUDENT" && <SelectItem value="match">Highest Match</SelectItem>}
            <SelectItem value="stipend">Highest Stipend</SelectItem>
            <SelectItem value="duration">Shortest Duration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Desktop sidebar filters */}
        <aside className="hidden md:block">
          <Card className="sticky top-20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Filters</h3>
              </div>
              {filterContent}
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : sortedInternships.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No internships found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search query
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedInternships.map((i: any, idx: number) => {
                const match = matchMap[i.id];
                const saved = savedInternships.includes(i.id);
                return (
                  <motion.div
                    key={i.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                  >
                    <Card className="group hover:shadow-premium transition-all hover:-translate-y-0.5 overflow-hidden cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Logo */}
                          <div className="w-12 h-12 rounded-xl gradient-emerald flex items-center justify-center shrink-0 shadow-glow">
                            <span className="text-white font-bold text-lg">
                              {i.company?.name?.charAt(0) || "I"}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <button
                                  onClick={() => navigate("internship-detail", { internshipId: i.id })}
                                  className="font-semibold text-base hover:text-primary text-left truncate block"
                                >
                                  {i.title}
                                </button>
                                <p className="text-sm text-muted-foreground truncate">
                                  {i.company?.name} · ⭐ {i.company?.rating}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {match && (
                                  <div className={cn(
                                    "px-2 py-1 rounded-lg text-xs font-bold",
                                    match.score >= 80 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                                    match.score >= 60 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {match.score}% match
                                  </div>
                                )}
                                <button
                                  onClick={() => toggleSaved(i.id)}
                                  className="p-1.5 rounded-lg hover:bg-accent/50"
                                >
                                  <Heart className={cn("w-4 h-4", saved && "fill-primary text-primary")} />
                                </button>
                              </div>
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {i.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {i.workMode}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {i.duration} weeks
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <IndianRupee className="w-3 h-3" />
                                {i.stipend.toLocaleString("en-IN")}/mo
                              </span>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {i.skills.slice(0, 5).map((s: string) => {
                                const isMatching = match?.matchingSkills?.includes(s);
                                const isMissing = match?.missingSkills?.includes(s);
                                return (
                                  <span
                                    key={s}
                                    className={cn(
                                      "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                                      isMatching && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                                      isMissing && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                      !isMatching && !isMissing && "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {s}
                                  </span>
                                );
                              })}
                              {i.skills.length > 5 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                                  +{i.skills.length - 5} more
                                </span>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-border/40">
                              <Badge variant="secondary" className="text-[10px]">{i.domain}</Badge>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate("internship-detail", { internshipId: i.id })}
                                  className="h-8 gap-1"
                                >
                                  View details
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => apply(i.id)}
                                  className="gradient-emerald text-white h-8 gap-1"
                                >
                                  Apply
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
