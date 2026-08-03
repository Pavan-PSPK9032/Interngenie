"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Bell, Sun, Moon, Menu, X,
  LayoutDashboard, Briefcase, User as UserIcon, LogOut,
  ChevronDown, Building2, Heart, Bookmark,
  FileText, ClipboardCheck, Calendar, BarChart3,
  Brain, Bot, PanelLeft, ShieldCheck, Undo2, Redo2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useSidebar } from "@/lib/sidebar-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/app/global-search";

export function Navbar() {
  const { user, view, navigate, theme, toggleTheme, logout, notifications, savedInternships, setChatbotOpen, historyUndo, historyRedo, undo, redo, historyTick, lastHistoryAction } = useApp();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  // Global undo/redo keyboard shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z).
  // Inside text fields the browser handles native undo so form editing is preserved.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const navLinks: { label: string; view: any; icon: any }[] = [];

  if (!user) {
    navLinks.push({ label: "Home", view: "home", icon: Sparkles });
    navLinks.push({ label: "Internships", view: "internships", icon: Briefcase });
  } else if (user.role === "STUDENT") {
    navLinks.push({ label: "Dashboard", view: "student-dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Internships", view: "internships", icon: Briefcase });
    navLinks.push({ label: "Resume Builder", view: "resume-builder", icon: FileText });
    navLinks.push({ label: "ATS Score", view: "ats-checker", icon: ClipboardCheck });
    navLinks.push({ label: "Certificates", view: "student-profile", icon: ShieldCheck });
    navLinks.push({ label: "Profile", view: "student-profile", icon: UserIcon });
  } else if (user.role === "COMPANY") {
    navLinks.push({ label: "Dashboard", view: "company-dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Post Internship", view: "company-post-internship", icon: Briefcase });
    navLinks.push({ label: "Applicants", view: "company-applicants", icon: UserIcon });
    navLinks.push({ label: "Schedule", view: "company-schedule", icon: Calendar });
  } else {
    navLinks.push({ label: "Dashboard", view: "admin-dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Companies", view: "admin-companies", icon: Building2 });
    navLinks.push({ label: "Reports", view: "admin-reports", icon: BarChart3 });
    navLinks.push({ label: "AI Analytics", view: "admin-ai-dashboard", icon: Brain });
  }

  const handleNav = (v: any) => {
    navigate(v);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full px-3 sm:px-4 pt-3">
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-2xl shadow-premium border-white/10 mx-auto max-w-[1500px]"
        >
          <div className="flex h-14 items-center justify-between gap-2 px-2.5 sm:px-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleNav("home")}
                className="flex items-center gap-2.5 group shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 gradient-primary rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                  <div className="relative gradient-primary rounded-xl p-2 shadow-glow">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex flex-col leading-none hidden sm:flex">
                  <span className="font-bold text-lg gradient-text tracking-tight">InternGenie</span>
                  <span className="text-[10px] text-muted-foreground">PM Internship Scheme</span>
                </div>
              </button>

              {/* Sidebar toggle (desktop) */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex rounded-xl ml-1"
                  onClick={toggle}
                  aria-label="Toggle sidebar"
                >
                  <PanelLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
                </Button>
              )}
            </div>

            {/* Desktop nav */}
            <nav className="hidden xl:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.view)}
                  className={cn(
                    "relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                    view === link.view ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </span>
                  {view === link.view && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 rounded-lg border border-white/[0.08]"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              {user && <GlobalSearch />}

              {/* Undo / Redo */}
              {user && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={undo}
                        disabled={historyUndo.length === 0}
                        aria-label="Undo (Ctrl+Z)"
                      >
                        <motion.span
                          key={lastHistoryAction === "undo" ? `undo-${historyTick}` : "undo-static"}
                          initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
                          animate={{ rotate: 0, scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                        >
                          <Undo2 className="w-[18px] h-[18px]" />
                        </motion.span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={redo}
                        disabled={historyRedo.length === 0}
                        aria-label="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                      >
                        <motion.span
                          key={lastHistoryAction === "redo" ? `redo-${historyTick}` : "redo-static"}
                          initial={{ rotate: 20, scale: 0.6, opacity: 0 }}
                          animate={{ rotate: 0, scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                        >
                          <Redo2 className="w-[18px] h-[18px]" />
                        </motion.span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Ctrl+Y / Ctrl+Shift+Z)</TooltipContent>
                  </Tooltip>
                </>
              )}

              {/* Chatbot */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatbotOpen(true)}
                  className="rounded-xl relative"
                  aria-label="Open AI Chatbot"
                >
                  <Bot className="w-[18px] h-[18px]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
                </Button>
              )}

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-xl"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {theme === "light" ? (
                    <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <Moon className="w-[18px] h-[18px]" />
                    </motion.div>
                  ) : (
                    <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Sun className="w-[18px] h-[18px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              {/* Saved (student) */}
              {user?.role === "STUDENT" && savedInternships.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNav("internships")}
                  className="rounded-xl relative hidden sm:flex"
                  aria-label="Saved internships"
                >
                  <Heart className="w-[18px] h-[18px] fill-primary text-primary" />
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] gradient-primary text-white shadow-glow">
                    {savedInternships.length}
                  </Badge>
                </Button>
              )}

              {/* Notifications */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl relative">
                      <Bell className="w-[18px] h-[18px]" />
                      {unread > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 glass-card border-white/10">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      Notifications
                      {unread > 0 && <Badge variant="secondary" className="text-[10px]">{unread} new</Badge>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="flex flex-col items-start py-2 cursor-pointer"
                        >
                          <div className="flex w-full items-start gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1.5 shrink-0",
                              n.read ? "bg-muted" :
                              n.type === "SUCCESS" ? "bg-emerald-500" :
                              n.type === "INTERVIEW" ? "bg-amber-500" :
                              n.type === "WARNING" ? "bg-red-500" : "bg-primary"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-xl gap-2 px-1.5 hover:bg-white/[0.06]">
                      <div className="relative">
                        <Avatar className="w-8 h-8 gradient-primary shadow-glow">
                          <AvatarFallback className="text-white text-xs font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                      </div>
                      <span className="hidden sm:block text-sm font-medium max-w-[90px] truncate">
                        {user.name.split(" ")[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 glass-card border-white/10">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {user.role}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === "STUDENT" && (
                      <>
                        <DropdownMenuItem onClick={() => handleNav("student-profile")}>
                          <UserIcon className="w-4 h-4 mr-2" /> My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNav("student-applications")}>
                          <Bookmark className="w-4 h-4 mr-2" /> Applications
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === "COMPANY" && (
                      <DropdownMenuItem onClick={() => handleNav("company-applicants")}>
                        <UserIcon className="w-4 h-4 mr-2" /> View Applicants
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setChatbotOpen(true)}>
                      <Bot className="w-4 h-4 mr-2" /> AI Assistant
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNav(user.role === "ADMIN" ? "admin-companies" : "home")}>
                      <Building2 className="w-4 h-4 mr-2" /> Manage Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => handleNav("auth")}
                  className="gradient-primary text-white shadow-glow rounded-xl px-5 text-sm"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden rounded-xl"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="xl:hidden overflow-hidden mx-auto max-w-[1500px] mt-2"
            >
              <motion.div className="glass-card rounded-2xl border-white/10 shadow-premium p-2">
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => handleNav(link.view)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        view === link.view
                          ? "bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-white"
                          : "text-foreground hover:bg-white/[0.06]"
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                      {view === link.view && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                  {user && (
                    <button
                      onClick={() => { setChatbotOpen(true); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-white/[0.06]"
                    >
                      <Bot className="w-5 h-5 text-cyan-400" />
                      AI Chatbot
                    </button>
                  )}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
