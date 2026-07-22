"use client";
import { motion } from "framer-motion";
import { Home, Briefcase, LayoutDashboard, Sparkles, User } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { view, navigate, user } = useApp();

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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      >
        <div className="glass-strong border-t border-border/40 px-2 py-2">
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
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-5 h-5 relative z-10",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] relative z-10 font-medium",
                      active ? "text-primary" : "text-muted-foreground"
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
          { icon: User, label: "Users", view: "admin-internships" as const },
        ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
    >
      <div className="glass-strong border-t border-border/40 px-2 py-2">
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
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 relative z-10",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] relative z-10 font-medium",
                    active ? "text-primary" : "text-muted-foreground"
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
