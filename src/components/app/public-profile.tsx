"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, MapPin, Award, Code, Mail, Phone, Linkedin, Github,
  Globe, Briefcase, FolderGit2, ChevronLeft, User as UserIcon,
  Shield, Sparkles, Languages, Trophy, Eye, Users, Search,
  BadgeCheck, Link2, Check, Share2, Layers, ScanLine,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/app/follow-button";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types";

type TabKey = "about" | "skills" | "projects" | "experience" | "certificates" | "achievements";

const TABS: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: "about", label: "About", icon: UserIcon },
  { key: "skills", label: "Skills", icon: Code },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "certificates", label: "Certificates", icon: Award },
  { key: "achievements", label: "Achievements", icon: Trophy },
];

const badgeIconMap: Record<string, any> = {
  award: Award,
  sparkles: Sparkles,
  code: Code,
  badge: Shield,
  briefcase: Briefcase,
  languages: Languages,
};

export function PublicProfileView() {
  const { selectedUserId, navigate, user, token, pushToast } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-profile", selectedUserId, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/public/profile/${selectedUserId}`, {
        headers: user ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Profile not found");
      return (await res.json()).profile as PublicProfile;
    },
    enabled: !!selectedUserId,
  });

  // Register a profile view (only when viewing someone else)
  useEffect(() => {
    if (user && user.id !== selectedUserId && selectedUserId) {
      fetch(`/api/profile/view/${selectedUserId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [selectedUserId, user?.id, token, user]);

  const copyLink = async () => {
    if (!data) return;
    const url = `${window.location.origin}/profile/${data.username || data.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      pushToast({ title: "Link copied", type: "success" });
    } catch {
      pushToast({ title: "Could not copy link", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full gradient-emerald mx-auto animate-pulse" />
        <p className="text-sm text-muted-foreground mt-4">Loading profile...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">Profile not available</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          This profile is either private, was removed, or the link is incorrect.
        </p>
        <Button onClick={() => navigate("home")} className="mt-6 gradient-emerald text-white">
          Back to Home
        </Button>
      </div>
    );
  }

  const p = data;

  const header = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl glass-card border-white/[0.08] shadow-premium"
    >
      {/* Cover banner */}
      <div className="relative h-36 sm:h-44 md:h-56 w-full overflow-hidden">
        {p.bannerUrl ? (
          <img
            src={p.bannerUrl}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: p.bannerPosition || "50% 50%" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-violet-600/35 to-cyan-500/50">
            <div className="absolute -top-16 -right-16 w-72 h-72 orb-indigo animate-float-slow" />
            <div className="absolute -bottom-24 left-1/4 w-80 h-80 orb-cyan animate-blob" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="px-5 sm:px-7 pb-5">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-14 sm:-mt-16 md:-mt-20">
          <div className="relative shrink-0">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 border-4 border-background shadow-glow gradient-primary">
              <AvatarImage src={p.avatarUrl || undefined} />
              <AvatarFallback className="text-white text-3xl font-bold">
                {p.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {p.badges && p.badges.length > 0 && (
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full glass-card border-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2 md:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
              {p.name}
              {p.username && (
                <span className="flex items-center gap-1 text-base font-normal text-muted-foreground">
                  <BadgeCheck className="w-4 h-4 text-cyan-400" /> @{p.username}
                </span>
              )}
            </h1>

            <p className="text-sm text-muted-foreground mt-1">{p.headline || "Student"}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {p.college && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> {p.college}
                </span>
              )}
              {p.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {p.location}
                </span>
              )}
              {p.degree && <span>{[p.degree, p.branch].filter(Boolean).join(" · ")}</span>}
              {p.graduationYear > 0 && <span>Class of {p.graduationYear}</span>}
            </div>

            {p.badges && p.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {p.badges.map((b) => {
                  const Icon = badgeIconMap[b.icon] || Award;
                  return (
                    <span key={b.name} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-muted-foreground">
                      <Icon className="w-3 h-3 text-amber-400" /> {b.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 md:pt-0">
            <FollowButton userId={p.id} initialFollowing={!!p.isFollowing} />
            <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 text-xs">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("internships")} className="gap-1.5 text-xs">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/10">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-primary" /> <b className="text-foreground">{p.followersCount}</b> followers
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5 text-primary" /> <b className="text-foreground">{p.profileViews}</b> profile views
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Search className="w-3.5 h-3.5 text-primary" /> <b className="text-foreground">{p.searchAppearances}</b> search appearances
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="w-3.5 h-3.5 text-primary" /> <b className="text-foreground">{p.completedInternships}</b> internships completed
          </span>
          {p.atsScore != null && (
            <span className="flex items-center gap-1.5 text-xs">
              <ScanLine className="w-3.5 h-3.5 text-primary" />
              ATS <b className={cn(p.atsScore >= 80 ? "text-emerald-400" : p.atsScore >= 50 ? "text-amber-400" : "text-red-400")}>{p.atsScore}</b>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  const tabBar = (
    <div className="sticky top-[84px] z-30 -mx-1 px-1 glass-card border-white/10 rounded-2xl">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "relative shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors",
              activeTab === t.key ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === t.key && (
              <motion.span
                layoutId="public-profile-tab-active"
                className="absolute inset-0 bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 border border-white/10 rounded-xl"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const count = {
    skills: p.skills.length,
    projects: p.projects?.length || 0,
    experience: p.experience?.length || 0,
    certificates: p.certificates?.length || 0,
    achievements: (p.achievements?.length || 0) + (p.interests?.length || 0) + (p.languages?.length || 0),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-5">
      {header}
      {tabBar}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "about" && (
                <Card className="glass-card border-white/[0.08]">
                  <CardContent className="p-5 space-y-5">
                    <div>
                      <h2 className="text-base font-bold flex items-center gap-2 mb-2">
                        <UserIcon className="w-5 h-5 text-primary" /> About
                      </h2>
                      {p.summary ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">This student hasn't added a summary yet.</p>
                      )}
                    </div>

                    {p.interests?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Interests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.interests.map((i) => <Badge key={i} variant="secondary" className="text-[11px]">{i}</Badge>)}
                        </div>
                      </div>
                    )}

                    {p.languages?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.languages.map((l) => <Badge key={l} variant="outline" className="text-[11px]">{l}</Badge>)}
                        </div>
                      </div>
                    )}

                    {p.completedInternshipDetails?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Completed Internships</p>
                        <div className="space-y-2">
                          {p.completedInternshipDetails.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm p-3 rounded-xl glass-card border-white/[0.08]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              {c.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "skills" && (
                <Card className="glass-card border-white/[0.08]">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Code className="w-5 h-5 text-primary" /> Skills
                      <Badge variant="secondary" className="text-[10px]">{count.skills}</Badge>
                    </h2>
                    {p.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {p.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No skills listed.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "projects" && (
                <Card className="glass-card border-white/[0.08]">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <FolderGit2 className="w-5 h-5 text-primary" /> Projects
                      <Badge variant="secondary" className="text-[10px]">{count.projects}</Badge>
                    </h2>
                    {p.projects && p.projects.length > 0 ? (
                      <div className="space-y-3">
                        {p.projects.map((proj: any, i: number) => (
                          <div key={i} className="p-4 rounded-xl glass-card border-white/[0.08]">
                            <p className="text-sm font-semibold">{proj.title || "Untitled"}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{proj.description}</p>
                            {proj.technologies?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {proj.technologies.map((t: string) => (
                                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No public projects.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "experience" && (
                <Card className="glass-card border-white/[0.08]">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" /> Experience
                      <Badge variant="secondary" className="text-[10px]">{count.experience}</Badge>
                    </h2>
                    {p.experience && p.experience.length > 0 ? (
                      <div className="space-y-3">
                        {p.experience.map((exp: any, i: number) => (
                          <div key={i} className="p-4 rounded-xl glass-card border-white/[0.08]">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{exp.role || "Role"}</p>
                              {exp.startDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ""}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary mt-0.5">{exp.company}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No public experience.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "certificates" && (
                <Card className="glass-card border-white/[0.08]">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" /> Certificates
                      <Badge variant="secondary" className="text-[10px]">{count.certificates}</Badge>
                    </h2>
                    {p.certificates && p.certificates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {p.certificates.map((c) => (
                          <div key={c.id} className="p-4 rounded-xl glass-card border-white/[0.08]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                                <Award className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{c.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{c.organization}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              {c.category && <Badge variant="secondary" className="text-[9px]">{c.category}</Badge>}
                              {c.issueDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(c.issueDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                </span>
                              )}
                            </div>
                            {c.verificationLink && (
                              <a
                                href={c.verificationLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-2"
                              >
                                <Shield className="w-3 h-3" /> Verify credential
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No public certificates.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "achievements" && (
                <Card className="glass-card border-white/[0.08]">
                  <CardContent className="p-5 space-y-4">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" /> Achievements & More
                      <Badge variant="secondary" className="text-[10px]">{count.achievements}</Badge>
                    </h2>
                    {p.achievements?.length > 0 && (
                      <div className="space-y-2">
                        {p.achievements.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-xl glass-card border-white/[0.08] text-sm">
                            <Trophy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                    {count.achievements === 0 && (
                      <p className="text-xs text-muted-foreground">No public achievements yet.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <Card className="glass-card border-white/[0.08]">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" /> Contact
              </h2>
              <div className="space-y-2 text-sm">
                {p.email && (
                  <a href={`mailto:${p.email}`} className="flex items-center gap-2.5 text-muted-foreground hover:text-primary">
                    <Mail className="w-4 h-4" /> {p.email}
                  </a>
                )}
                {p.phone && (
                  <p className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="w-4 h-4" /> {p.phone}
                  </p>
                )}
                {p.linkedin && (
                  <a href={p.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted-foreground hover:text-primary">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {p.github && (
                  <a href={p.github} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted-foreground hover:text-primary">
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {p.portfolio && (
                  <a href={p.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted-foreground hover:text-primary">
                    <Globe className="w-4 h-4" /> Portfolio
                  </a>
                )}
                {!p.email && !p.phone && !p.linkedin && !p.github && !p.portfolio && (
                  <p className="text-xs text-muted-foreground">No public contact details.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {p.atsScore != null && (
            <Card className="glass-card border-white/[0.08]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" className="stroke-white/10" />
                    <circle
                      cx="18" cy="18" r="15" fill="none" strokeWidth="3.5"
                      strokeLinecap="round"
                      className={cn(
                        "transition-all duration-1000",
                        p.atsScore >= 80 ? "stroke-emerald-500" : p.atsScore >= 50 ? "stroke-amber-500" : "stroke-red-500"
                      )}
                      strokeDasharray={`${(p.atsScore / 100) * 94.2} 94.2`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {p.atsScore}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">ATS Score</p>
                  <p className="text-xs text-muted-foreground">Resume grade: {p.atsGrade || "—"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="rounded-2xl glass-card border-white/[0.08] p-4 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Profile discovered on InternGenie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
