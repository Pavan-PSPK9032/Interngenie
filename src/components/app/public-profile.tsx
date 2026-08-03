"use client";
import { motion } from "framer-motion";
import {
  GraduationCap, MapPin, Award, Code, Mail, Phone, Linkedin, Github,
  Globe, Briefcase, FolderGit2, ChevronLeft, User as UserIcon,
  Shield, Sparkles, Languages, Trophy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types";

export function PublicProfileView() {
  const { selectedUserId, navigate } = useApp();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-profile", selectedUserId],
    queryFn: async () => {
      const res = await fetch(`/api/public/profile/${selectedUserId}`);
      if (!res.ok) throw new Error("Profile not found");
      return (await res.json()).profile as PublicProfile;
    },
    enabled: !!selectedUserId,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full gradient-emerald mx-auto animate-pulse" />
        <p className="text-sm text-muted-foreground mt-4">Loading profile...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
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

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <button
        onClick={() => navigate("internships")}
        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-strong border border-border/40"
      >
        <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <Avatar className="w-20 h-20 border-4 border-background gradient-emerald shadow-glow">
              <AvatarImage src={p.avatarUrl || undefined} />
              <AvatarFallback className="text-white text-xl font-bold">
                {p.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {p.name}
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> Student
                </Badge>
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {[p.degree, p.branch].filter(Boolean).join(" · ") || "Student"}
                </span>
                {p.college && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {p.college}
                  </span>
                )}
                {p.graduationYear > 0 && <span>Class of {p.graduationYear}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-2xl font-bold gradient-text">{p.profileCompleted}%</p>
                <p className="text-[10px] text-muted-foreground">Profile complete</p>
              </div>
            </div>
          </div>

          {p.summary && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{p.summary}</p>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Skills" value={p.skills.length} icon={<Code className="w-4 h-4" />} />
        <StatCard label="Projects" value={p.projects?.length || 0} icon={<FolderGit2 className="w-4 h-4" />} />
        <StatCard label="Internships" value={p.completedInternships || 0} icon={<Briefcase className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Skills */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" /> Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {p.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {p.skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills listed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          {p.projects && p.projects.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-primary" /> Projects
                </h2>
                <div className="space-y-3">
                  {p.projects.map((proj: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl border border-border/40 bg-card/30">
                      <p className="text-sm font-semibold">{proj.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{proj.description}</p>
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {proj.technologies.map((t: string) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-muted">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {p.experience && p.experience.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Experience
                </h2>
                <div className="space-y-3">
                  {p.experience.map((exp: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl border border-border/40 bg-card/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{exp.role || "Role"}</p>
                        {exp.startDate && (
                          <span className="text-[10px] text-muted-foreground">
                            {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{exp.company}</p>
                      <p className="text-xs mt-1.5 line-clamp-3">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificates */}
          {p.certificates && p.certificates.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Certificates
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {p.certificates.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl border border-border/40 bg-card/30">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.organization}</p>
                      {c.category && <Badge variant="secondary" className="text-[10px] mt-1.5">{c.category}</Badge>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">{c.issueDate}</span>
                        {c.verificationLink && (
                          <a
                            href={c.verificationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                          >
                            <Shield className="w-3 h-3" /> Verify
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements & interests */}
          {(p.achievements?.length > 0 || p.interests?.length > 0 || p.languages?.length > 0) && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" /> More About Me
                </h2>
                {p.achievements?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Trophy className="w-3 h-3" /> Achievements</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {p.achievements.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {p.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Interests</p>
                    {p.interests.map((i) => (
                      <Badge key={i} variant="outline" className="text-[11px]">{i}</Badge>
                    ))}
                  </div>
                )}
                {p.languages?.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Languages className="w-3 h-3" /> Languages</p>
                    {p.languages.map((l) => (
                      <Badge key={l} variant="outline" className="text-[11px]">{l}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contact / links */}
          <Card>
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

          {/* ATS score */}
          {p.atsScore != null && (
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" className="stroke-muted" />
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
                  <p className="text-xs text-muted-foreground">Resume grade: {p.atsGrade}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed internships */}
          {p.completedInternshipDetails?.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Completed Internships
                </h2>
                {p.completedInternshipDetails.map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {c.title}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="rounded-2xl border border-border/40 bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              This profile is publicly visible on InternGenie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="glass-strong">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
