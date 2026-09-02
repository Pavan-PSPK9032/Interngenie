"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Sparkles, Search, ArrowRight, Users, Building2, Briefcase,
  CheckCircle2, TrendingUp, Star, ChevronDown, Zap,
  Brain, Target, Award, FileSearch, Compass, FileText,
  User as UserIcon, Upload,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { TESTIMONIALS, FAQS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { navigate } = useApp();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col">
      {/* ───────────── HERO ───────────── */}
      <section ref={heroRef} className="relative overflow-hidden gradient-hero pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Decorative blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl"
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">
              AI-powered · Personalized · Student-focused
            </span>
            <Badge className="gradient-emerald text-white text-[10px]">NEW</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            Find the <span className="gradient-text">internship</span>
            <br />
            that fits you.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            InternGenie uses AI to understand your skills, interests, and career
            goals, then helps you discover internships that match your profile —
            with explainable match scores so you always know <em className="text-foreground/80 not-italic font-medium">why</em>.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl glass-strong shadow-premium border border-border/40">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate("internships");
                  }}
                  placeholder="Search by role, skill, or company..."
                  className="border-0 bg-transparent focus-visible:ring-0 text-base h-10"
                />
              </div>
              <Button
                onClick={() => navigate("internships")}
                className="gradient-emerald text-white shadow-glow rounded-xl h-12 px-6 gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>

            {/* Quick categories */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Popular:</span>
              {["Data Science", "Full Stack", "AI/ML", "UI/UX", "DevOps"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate("internships")}
                  className="text-xs px-3 py-1 rounded-full bg-muted/70 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              onClick={() => navigate("internships")}
              className="gradient-emerald text-white shadow-glow rounded-full h-12 px-7 gap-2"
            >
              Find My Internship
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => navigate("ats-checker")}
              variant="outline"
              className="rounded-full h-12 px-7 gap-2 glass"
            >
              <FileSearch className="w-4 h-4" />
              Analyze My Resume
            </Button>
          </motion.div>
        </motion.div>

        {/* AI illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 mx-auto max-w-5xl px-4"
        >
          <div className="relative">
            {/* Floating cards around a central AI brain */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: Brain, label: "AI Matching", color: "from-emerald-500 to-teal-600", delay: 0 },
                { icon: Target, label: "Skill Gap Analysis", color: "from-amber-500 to-orange-600", delay: 0.5 },
                { icon: Award, label: "Verified Certificates", color: "from-pink-500 to-rose-600", delay: 1 },
                { icon: Sparkles, label: "Resume Builder", color: "from-cyan-500 to-blue-600", delay: 1.5 },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: card.delay,
                    ease: "easeInOut",
                  }}
                  className="glass-strong rounded-2xl p-4 md:p-5 shadow-premium border border-border/40 hover:shadow-glow transition-shadow"
                >
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", card.color)}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Powered by sentence-transformer embeddings
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Center pulse */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 hidden md:block">
              <div className="w-32 h-32 rounded-full gradient-emerald blur-2xl opacity-30 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-16 flex justify-center"
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </section>

      {/* ───────────── PLATFORM STATS ───────────── */}
      <section className="py-16 md:py-20 border-y border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <LiveStats />
        </div>
      </section>

      {/* ───────────── FEATURED COMPANIES ───────────── */}
      <FeaturedCompanies />

      {/* ───────────── POPULAR INTERNSHIPS ───────────── */}
      <PopularInternships />

      {/* ───────────── AI FEATURES SHOWCASE ───────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="gradient-emerald text-white mb-4">
              <Zap className="w-3 h-3 mr-1" />
              AI Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              The most intelligent internship platform in India
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built on a hybrid recommendation engine with sentence embeddings,
              cosine similarity, and explainable AI — so every match is transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Resume Parser",
                desc: "AI extracts skills, education, projects, and experience automatically using NER + keyword extraction.",
                icon: Sparkles,
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                title: "Hybrid Recommendations",
                desc: "Content-based + collaborative filtering with cosine similarity on sentence embeddings of skills.",
                icon: Brain,
                gradient: "from-amber-500 to-orange-600",
              },
              {
                title: "Explainable Match Scores",
                desc: "Every match percentage comes with human-readable reasons — skills, location, domain, stipend.",
                icon: Target,
                gradient: "from-pink-500 to-rose-600",
              },
              {
                title: "Skill Gap Analysis",
                desc: "Discover missing skills across your target internships, with course recommendations to close gaps.",
                icon: TrendingUp,
                gradient: "from-cyan-500 to-blue-600",
              },
              {
                title: "Career Prediction",
                desc: "ML model predicts best-fit career paths based on your skills and interests with learning roadmaps.",
                icon: Award,
                gradient: "from-violet-500 to-purple-600",
              },
              {
                title: "AI Career Assistant",
                desc: "24/7 chatbot powered by GLM for resume tips, interview prep, and internship guidance in plain English.",
                icon: Sparkles,
                gradient: "from-emerald-500 to-amber-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="group h-full hover:shadow-premium transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                      feature.gradient
                    )}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="py-16 md:py-24 bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1 text-primary" />
              Why Students Use InternGenie
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built around your career journey
            </h2>
            <p className="mt-4 text-muted-foreground">
              From understanding your profile to helping you apply and grow — everything
              InternGenie does is centered on your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => {
              const Icon =
                t.icon === "target" ? Target :
                t.icon === "file-text" ? FileText :
                t.icon === "trending-up" ? TrendingUp :
                t.icon === "compass" ? Compass :
                CheckCircle2;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6 flex flex-col h-full items-start">
                      <div className="w-11 h-11 rounded-xl gradient-emerald flex items-center justify-center mb-4 shadow-glow">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-semibold text-lg">{t.title}</p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {t.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about InternGenie.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/40 rounded-xl px-5 bg-card/30 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-sm md:text-base font-medium hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="py-16 md:py-24 border-y border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1 text-primary" />
              How InternGenie Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From your profile to the right internship
            </h2>
            <p className="mt-4 text-muted-foreground">
              A simple, guided journey powered by AI at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", icon: UserIcon, title: "Create Profile", desc: "Set up your student profile with your college, degree, and interests." },
              { step: "02", icon: Upload, title: "Upload Resume", desc: "AI extracts your skills, education, projects, and experience automatically." },
              { step: "03", icon: Brain, title: "AI Matching", desc: "Get explainable match scores pairing your profile to internships." },
              { step: "04", icon: Target, title: "Skill Gaps & Apply", desc: "Understand what you're missing, then apply and track your application." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full group hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl gradient-emerald flex items-center justify-center shadow-glow">
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-3xl font-bold text-foreground/10">{s.step}</span>
                    </div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-emerald p-8 md:p-16 text-center shadow-glow">
            <div className="absolute inset-0 gradient-mixed opacity-30 animate-gradient-shift" />
            <div className="relative">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Find the internship that fits you.
              </h2>
              <p className="mt-4 text-white/90 text-lg max-w-2xl mx-auto">
                Create a free profile, upload your resume, and let AI match you to
                internships, understand your skill gaps, and guide your career.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => navigate("auth")}
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-white/90 rounded-full h-12 px-8 shadow-lg gap-2"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => navigate("internships")}
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white/20 rounded-full h-12 px-8"
                >
                  Browse Internships
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Live Stats ─────────────────────────────────────────────────────
function LiveStats() {
  const { data } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) return null;
      return res.json();
    },
    retry: 0,
  });

  const totals = data?.totals || {};
  const hasRealData = (totals.totalInternships ?? 0) > 0;

  const labels = [
    { Icon: Briefcase, value: totals.totalInternships ?? 0, title: "Open Internships", sub: "Live on the platform" },
    { Icon: FileText, value: totals.totalResumes ?? 0, title: "Resumes Analyzed", sub: "By our AI" },
    { Icon: Users, value: totals.totalStudents ?? 0, title: "Registered Students", sub: "Building careers" },
    { Icon: Building2, value: totals.totalCompanies ?? 0, title: "Companies", sub: "Posting opportunities" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
      {labels.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-emerald mb-3 shadow-glow">
            <l.Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl md:text-4xl font-bold gradient-text">
            {hasRealData ? l.value.toLocaleString("en-IN") : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{l.title}</p>
          <p className="text-xs text-muted-foreground/70">{l.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Featured Companies ─────────────────────────────────────────────
function FeaturedCompanies() {
  const { data } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies");
      return res.json();
    },
  });

  const companies = data?.companies?.slice(0, 8) || [];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            <Building2 className="w-3 h-3 mr-1" />
            Featured Companies
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Internships at companies across India
          </h2>
          <p className="mt-4 text-muted-foreground">
            Explore open internship roles posted by companies on the platform,
            from large enterprises to fast-growing startups.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {companies.map((c: any, i: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group hover:shadow-premium transition-all hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 rounded-2xl gradient-emerald mx-auto mb-3 flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-xl">
                      {c.name.charAt(0)}
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.industry}</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{c.rating}</span>
                    <span className="text-muted-foreground">· {c.internshipCount} roles</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Popular Internships ────────────────────────────────────────────
function PopularInternships() {
  const { navigate } = useApp();
  const { data } = useQuery({
    queryKey: ["popular-internships"],
    queryFn: async () => {
      const res = await fetch("/api/internships?sort=stipend");
      if (!res.ok) return { internships: [] };
      return res.json();
    },
  });

  const internships = data?.internships?.slice(0, 6) || [];

  return (
    <section className="py-16 md:py-24 bg-card/30 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Badge className="gradient-emerald text-white mb-3">
              <TrendingUp className="w-3 h-3 mr-1" />
              Popular Now
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Trending internships
            </h2>
            <p className="mt-2 text-muted-foreground">
              High-stipend, high-demand roles from top companies.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("internships")}
            className="hidden md:flex gap-2"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {internships.map((i: any, idx: number) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
            >
              <Card
                className="group h-full hover:shadow-premium transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate("internship-detail", { internshipId: i.id })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl gradient-emerald flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-base">
                        {i.company?.name?.charAt(0) || "I"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">
                        {i.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {i.company?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="secondary" className="text-[10px]">{i.domain}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{i.workMode}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{i.duration}w</Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{i.location}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{i.stipend.toLocaleString("en-IN")}/mo
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex flex-wrap gap-1">
                      {i.skills?.slice(0, 3).map((s: string) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {i.skills?.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          +{i.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button onClick={() => navigate("internships")} variant="outline" className="rounded-full">
            View all internships
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
