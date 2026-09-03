"use client";
import { motion } from "framer-motion";
import { Home, Briefcase, LayoutDashboard, Sparkles, User, FileText, Bot } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { view, navigate, user, setChatbotOpen } = useApp();

  if (!user) {
    const items = [
      { icon: Home, label: "Home", view: "home" as const },
      { icon: Briefcase, label: "Internships", view: "internships" as const },
      { icon: Sparkles, label: "Sign In", view: "auth" as const },
    ];
    return (
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-none"
      >
        <div className="glass-card rounded-2xl border-white/10 shadow-premium px-2 py-2 pointer-events-auto">
          <div className="flex items-center justify-around">
            {items.map((item) => {
              const active = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => navigate(item.view)}
                  className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl min-w-[64px] min-h-[44px]"
                >
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 rounded-xl"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-5 h-5 relative z-10 transition-colors",
                      active ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] relative z-10 font-medium transition-colors",
                      active ? "text-white" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    );
  }

  // Logged-in user
  const role = user.role;
  const items =
    role === "STUDENT"
      ? [
          { icon: Home, label: "Home", view: "home" as const },
          { icon: Briefcase, label: "Search", view: "internships" as const },
          { icon: FileText, label: "Resume", view: "resume-builder" as const },
          { icon: LayoutDashboard, label: "Dashboard", view: "student-dashboard" as const },
          { icon: User, label: "Profile", view: "student-profile" as const },
        ]
      : role === "COMPANY"
      ? [
          { icon: Home, label: "Home", view: "home" as const },
          { icon: Briefcase, label: "Post", view: "company-post-internship" as const },
          { icon: LayoutDashboard, label: "Dashboard", view: "company-dashboard" as const },
          { icon: User, label: "Applicants", view: "company-applicants" as const },
        ]
      : [
          { icon: Home, label: "Home", view: "home" as const },
          { icon: LayoutDashboard, label: "Stats", view: "admin-dashboard" as const },
          { icon: Briefcase, label: "Companies", view: "admin-companies" as const },
          { icon: User, label: "Users", view: "admin-users" as const },
        ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-none"
    >
      <div className="glass-card rounded-2xl border-white/10 shadow-premium px-2 py-2 pointer-events-auto">
        <div className="flex items-center justify-around">
          {items.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px] min-h-[44px]"
              >
                {active && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-colors",
                    active ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] relative z-10 font-medium transition-colors",
                    active ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setChatbotOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px] min-h-[44px]"
            aria-label="Open AI Chatbot"
          >
            <div className="absolute inset-0 gradient-primary rounded-xl opacity-10" />
            <Bot className="w-5 h-5 relative z-10 text-cyan-300" />
            <span className="text-[10px] relative z-10 font-medium text-muted-foreground">AI</span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
