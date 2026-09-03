// Global app state — view router, auth, theme, saved internships, chatbot panel
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, ViewKey, User, Notification, ResumeData } from "./types";

export type ResumeTemplate = "classic" | "modern" | "minimal";

export interface ResumeSnapshot {
  resumeData: ResumeData | null;
  resumeTemplate: ResumeTemplate;
  resumeColor: string;
}

export type HistoryEntry =
  | { domain: "user"; before: User; after: User }
  | { domain: "resume"; before: ResumeSnapshot; after: ResumeSnapshot };

const HISTORY_LIMIT = 100;
const HISTORY_COALESCE_MS = 800;

interface AppState {
  // Routing (single-page app view switcher)
  view: ViewKey;
  selectedInternshipId: string | null;
  selectedApplicantInternshipId: string | null;
  selectedUserId: string | null;
  navigate: (view: ViewKey, opts?: { internshipId?: string; userId?: string }) => void;

  // Auth
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Saved internships
  savedInternships: string[];
  toggleSaved: (id: string) => void;

  // Notifications
  notifications: Notification[];
  notificationsLoaded: boolean;
  setNotifications: (n: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Chatbot
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;

  // Toast (optional fallback)
  toasts: { id: string; title: string; message?: string; type: "info" | "success" | "error" }[];
  pushToast: (t: { title: string; message?: string; type?: "info" | "success" | "error" }) => void;
  dismissToast: (id: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Resume Builder
  resumeData: ResumeData | null;
  setResumeData: (data: ResumeData) => void;
  resumeTemplate: "classic" | "modern" | "minimal";
  setResumeTemplate: (t: "classic" | "modern" | "minimal") => void;
  resumeColor: string;
  setResumeColor: (c: string) => void;

  // Undo / Redo — snapshot history over user + resume state
  historyUndo: HistoryEntry[];
  historyRedo: HistoryEntry[];
  historyTick: number;
  lastHistoryAction: "undo" | "redo" | null;
  lastHistoryDomain: "user" | "resume" | null;
  _lastHistoryAt: number;
  undo: () => void;
  redo: () => void;
  recordHistory: (entry: HistoryEntry, force?: boolean) => void;
  recordResumeEdit: (before: ResumeSnapshot, after: ResumeSnapshot) => void;
  clearHistory: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      view: "home",
      selectedInternshipId: null,
      selectedApplicantInternshipId: null,
      selectedUserId: null,
      navigate: (view, opts) =>
        set({
          view,
          selectedInternshipId: opts?.internshipId ?? get().selectedInternshipId,
          selectedApplicantInternshipId: opts?.internshipId ?? get().selectedApplicantInternshipId,
          selectedUserId: opts?.userId ?? get().selectedUserId,
        }),

      user: null,
      token: null,
      login: (user, token) => {
        set({ user, token });
        get().clearHistory();
        // Auto-navigate based on role
        const roleDefault: Record<Role, ViewKey> = {
          STUDENT: "student-dashboard",
          COMPANY: "company-dashboard",
          ADMIN: "admin-dashboard",
        };
        set({ view: roleDefault[user.role] });
      },
      logout: () => {
        set({ user: null, token: null, view: "home", notifications: [], notificationsLoaded: false });
        get().clearHistory();
      },
      updateUser: (patch) => {
        const s = get();
        if (!s.user) return;
        const after = { ...s.user, ...patch };
        if (JSON.stringify(s.user) === JSON.stringify(after)) return;
        set({ user: after });
        get().recordHistory({ domain: "user", before: s.user, after }, true);
      },

      theme: "light",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),

      savedInternships: [],
      toggleSaved: (id) =>
        set((s) => ({
          savedInternships: s.savedInternships.includes(id)
            ? s.savedInternships.filter((x) => x !== id)
            : [...s.savedInternships, id],
        })),

      notifications: [],
      notificationsLoaded: false,
      setNotifications: (notifications) => set({ notifications, notificationsLoaded: true }),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      chatbotOpen: false,
      setChatbotOpen: (chatbotOpen) => set({ chatbotOpen }),

      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      toasts: [],
      pushToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({
          toasts: [
            ...s.toasts,
            { id, type: t.type || "info", title: t.title, message: t.message },
          ],
        }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        }, 4000);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

      resumeData: null,
      setResumeData: (resumeData) => {
        const s = get();
        if (JSON.stringify(s.resumeData) === JSON.stringify(resumeData)) return;
        set({ resumeData });
        get().recordHistory(
          {
            domain: "resume",
            before: { resumeData: s.resumeData, resumeTemplate: s.resumeTemplate, resumeColor: s.resumeColor },
            after: { resumeData, resumeTemplate: s.resumeTemplate, resumeColor: s.resumeColor },
          },
          true
        );
      },
      resumeTemplate: "modern",
      setResumeTemplate: (resumeTemplate) => {
        const s = get();
        if (s.resumeTemplate === resumeTemplate) return;
        set({ resumeTemplate });
        get().recordHistory(
          {
            domain: "resume",
            before: { resumeData: s.resumeData, resumeTemplate: s.resumeTemplate, resumeColor: s.resumeColor },
            after: { resumeData: s.resumeData, resumeTemplate, resumeColor: s.resumeColor },
          },
          true
        );
      },
      resumeColor: "#059669",
      setResumeColor: (resumeColor) => {
        const s = get();
        if (s.resumeColor === resumeColor) return;
        set({ resumeColor });
        get().recordHistory(
          {
            domain: "resume",
            before: { resumeData: s.resumeData, resumeTemplate: s.resumeTemplate, resumeColor: s.resumeColor },
            after: { resumeData: s.resumeData, resumeTemplate: s.resumeTemplate, resumeColor },
          },
          true
        );
      },

      historyUndo: [],
      historyRedo: [],
      historyTick: 0,
      lastHistoryAction: null,
      lastHistoryDomain: null,
      _lastHistoryAt: 0,

      recordHistory: (entry, force = false) => {
        const s = get();
        const now = Date.now();
        const top = s.historyUndo[s.historyUndo.length - 1];
        let merged: HistoryEntry | null = null;
        if (top) {
          if (top.domain === "user" && entry.domain === "user") {
            merged = { domain: "user", before: top.before, after: entry.after };
          } else if (top.domain === "resume" && entry.domain === "resume") {
            merged = { domain: "resume", before: top.before, after: entry.after };
          }
        }
        const canCoalesce = !force && merged !== null && now - s._lastHistoryAt < HISTORY_COALESCE_MS;
        if (canCoalesce && merged) {
          set({
            historyUndo: [...s.historyUndo.slice(0, -1), merged],
            _lastHistoryAt: now,
          });
        } else {
          set({
            historyUndo: [...s.historyUndo, entry].slice(-HISTORY_LIMIT),
            historyRedo: [],
            _lastHistoryAt: now,
          });
        }
      },

      recordResumeEdit: (before, after) => {
        if (JSON.stringify(before) === JSON.stringify(after)) return;
        get().recordHistory({ domain: "resume", before, after }, false);
      },

      undo: () => {
        const s = get();
        const entry = s.historyUndo[s.historyUndo.length - 1];
        if (!entry) return;
        const base = {
          historyUndo: s.historyUndo.slice(0, -1),
          historyRedo: [...s.historyRedo, entry].slice(-HISTORY_LIMIT),
          historyTick: s.historyTick + 1,
          lastHistoryAction: "undo" as const,
          lastHistoryDomain: entry.domain,
          _lastHistoryAt: 0,
        };
        if (entry.domain === "user") {
          set({ ...base, user: entry.before });
        } else {
          set({
            ...base,
            resumeData: entry.before.resumeData,
            resumeTemplate: entry.before.resumeTemplate,
            resumeColor: entry.before.resumeColor,
          });
        }
      },

      redo: () => {
        const s = get();
        const entry = s.historyRedo[s.historyRedo.length - 1];
        if (!entry) return;
        const base = {
          historyRedo: s.historyRedo.slice(0, -1),
          historyUndo: [...s.historyUndo, entry].slice(-HISTORY_LIMIT),
          historyTick: s.historyTick + 1,
          lastHistoryAction: "redo" as const,
          lastHistoryDomain: entry.domain,
          _lastHistoryAt: 0,
        };
        if (entry.domain === "user") {
          set({ ...base, user: entry.after });
        } else {
          set({
            ...base,
            resumeData: entry.after.resumeData,
            resumeTemplate: entry.after.resumeTemplate,
            resumeColor: entry.after.resumeColor,
          });
        }
      },

      clearHistory: () =>
        set({ historyUndo: [], historyRedo: [], historyTick: 0, lastHistoryAction: null, lastHistoryDomain: null, _lastHistoryAt: 0 }),
    }),
    {
      name: "pm-internship-app",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        theme: s.theme,
        savedInternships: s.savedInternships,
        resumeData: s.resumeData,
        resumeTemplate: s.resumeTemplate,
        resumeColor: s.resumeColor,
      }),
    }
  )
);
