"use client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Briefcase, FileText, ClipboardCheck,
  Bookmark, MessageSquare, User as UserIcon, Building2, Calendar,
  BarChart3, Brain, PanelLeftClose, PanelLeft, ScrollText,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useSidebar } from "@/lib/sidebar-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const { user, view, navigate } = useApp();
  const { collapsed, toggle } = useSidebar();

  if (!user) return null;

  const groups: { label: string; items: { label: string; view: string; icon: any }[] }[] = [];

  const studentItems = [
    { label: "Dashboard", view: "student-dashboard", icon: LayoutDashboard },
    { label: "Internships", view: "internships", icon: Briefcase },
    { label: "Resume Builder", view: "resume-builder", icon: FileText },
    { label: "ATS Score", view: "ats-checker", icon: ClipboardCheck },
    { label: "Applications", view: "student-applications", icon: Bookmark },
    { label: "Interview Prep", view: "interview-prep", icon: MessageSquare },
    { label: "Profile", view: "student-profile", icon: UserIcon },
  ];
  const companyItems = [
    { label: "Dashboard", view: "company-dashboard", icon: LayoutDashboard },
    { label: "Post Internship", view: "company-post-internship", icon: Briefcase },
    { label: "Applicants", view: "company-applicants", icon: UserIcon },
    { label: "Schedule", view: "company-schedule", icon: Calendar },
    { label: "Company Profile", view: "company-profile", icon: Building2 },
  ];
  const adminItems = [
    { label: "Dashboard", view: "admin-dashboard", icon: LayoutDashboard },
    { label: "Companies", view: "admin-companies", icon: Building2 },
    { label: "Internships", view: "admin-internships", icon: Briefcase },
    { label: "Applications", view: "admin-applications", icon: Briefcase },
    { label: "Users", view: "admin-users", icon: UserIcon },
    { label: "Audit Log", view: "admin-audit", icon: ScrollText },
    { label: "Reports", view: "admin-reports", icon: BarChart3 },
    { label: "AI Analytics", view: "admin-ai-dashboard", icon: Brain },
  ];

  groups.push({
    label: user.role === "STUDENT" ? "Student" : user.role === "COMPANY" ? "Company" : "Admin",
    items: user.role === "STUDENT" ? studentItems : user.role === "COMPANY" ? companyItems : adminItems,
  });

  return (
    <aside
      className={cn(
        "sticky top-[84px] z-30 hidden lg:flex h-[calc(100vh-100px)] flex-col shrink-0 transition-[width] duration-300 ease-out",
        collapsed ? "w-[68px]" : "w-[232px]"
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card rounded-2xl shadow-premium flex flex-1 flex-col overflow-hidden p-3"
      >
        <div className="flex items-center justify-between px-1 pb-2">
          {!collapsed && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Menu</span>}
          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = view === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => navigate(item.view as any)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full",
                      active
                        ? "bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-white"
                        : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-cyan-400"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0 transition-colors",
                        active ? "text-indigo-300" : "text-muted-foreground"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={cn("mt-auto pt-3 border-t border-white/[0.06] flex items-center gap-3 px-2 py-2", collapsed && "justify-center")}>
          <Avatar className="w-8 h-8">
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.name.split(" ")[0]}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
            </div>
          )}
        </div>
      </motion.div>
    </aside>
  );
}
