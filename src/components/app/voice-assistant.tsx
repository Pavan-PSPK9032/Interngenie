"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, HelpCircle, X } from "lucide-react";
import { useVoiceSearch } from "@/components/hooks/useVoiceSearch";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VOICE_COMMANDS: { patterns: RegExp; action: string; params?: Record<string, any> }[] = [
  { patterns: [/^search\s+internships?$/i, /^find\s+internships?$/i], action: "search", params: {} },
  { patterns: [/^search\s+(.+)/i, /^find\s+(.+)/i], action: "search-domain" },
  { patterns: [/^(show|open)\s+dashboard$/i], action: "dashboard" },
  { patterns: [/^(open|show)\s+profile$/i], action: "profile" },
  { patterns: [/^(show|open)\s+applications?$/i], action: "applications" },
  { patterns: [/^(open|show)\s+profile\s+setup/i, /^profile\s+wizard/i], action: "wizard" },
  { patterns: [/^help$/i, /^what\s+can\s+you\s+do/i], action: "help" },
];

function matchCommand(text: string): { action: string; params?: Record<string, any> } | null {
  const cleaned = text.trim().toLowerCase();
  for (const cmd of VOICE_COMMANDS) {
    for (const pattern of cmd.patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        if (cmd.action === "search-domain") {
          return { action: "search", params: { domain: match[1].trim() } };
        }
        return { action: cmd.action, params: cmd.params };
      }
    }
  }
  return null;
}

export function VoiceAssistant() {
  const { navigate } = useApp();
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported, error } = useVoiceSearch();
  const [showPanel, setShowPanel] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const executeCommand = useCallback(
    (text: string) => {
      const cmd = matchCommand(text);
      if (!cmd) {
        navigate("internships", { internshipId: undefined });
        return;
      }

      switch (cmd.action) {
        case "search":
          if (cmd.params?.domain) {
            navigate("internships");
          } else {
            navigate("internships");
          }
          break;
        case "dashboard":
          navigate("student-dashboard");
          break;
        case "profile":
          navigate("student-profile");
          break;
        case "applications":
          navigate("student-applications");
          break;
        case "wizard":
          navigate("profile-wizard");
          break;
        case "help":
          setShowPanel(true);
          break;
      }
      setLastCommand(text);
    },
    [navigate]
  );

  useEffect(() => {
    if (transcript && !isListening) {
      executeCommand(transcript);
    }
  }, [transcript, isListening, executeCommand]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">
      {/* Help Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="w-72 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Voice Commands</h3>
              <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="font-medium text-foreground">&quot;search internships&quot;</span> - Go to search</li>
              <li><span className="font-medium text-foreground">&quot;search [domain]&quot;</span> - Search a domain</li>
              <li><span className="font-medium text-foreground">&quot;show dashboard&quot;</span> - Open dashboard</li>
              <li><span className="font-medium text-foreground">&quot;open profile&quot;</span> - Open profile</li>
              <li><span className="font-medium text-foreground">&quot;show applications&quot;</span> - View applications</li>
              <li><span className="font-medium text-foreground">&quot;profile setup&quot;</span> - Open profile wizard</li>
              <li><span className="font-medium text-foreground">&quot;help&quot;</span> - Show this list</li>
            </ul>
            <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-2">
              Anything else is treated as a search query.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript bubble */}
      <AnimatePresence>
        {(isListening || transcript) && !showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="max-w-[260px] rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl px-4 py-3"
          >
            {isListening && interimTranscript && (
              <p className="text-sm text-muted-foreground">{interimTranscript}</p>
            )}
            {transcript && (
              <p className="text-sm font-medium">{transcript}</p>
            )}
            {isListening && !interimTranscript && !transcript && (
              <p className="text-sm text-muted-foreground animate-pulse">Listening...</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error bubble */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="max-w-[260px] rounded-2xl border border-destructive/40 bg-destructive/10 backdrop-blur-xl shadow-2xl px-4 py-3"
          >
            <p className="text-xs text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowPanel((p) => !p)}
          className="h-12 w-12 rounded-full border-border/40 bg-card/80 backdrop-blur-xl shadow-lg hover:bg-accent/50"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>

        <div className="relative">
          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/15"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
              />
            </>
          )}

          <Button
            size="icon"
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                setShowPanel(false);
                startListening();
              }
            }}
            className={cn(
              "relative h-14 w-14 rounded-full shadow-lg transition-all",
              isListening
                ? "gradient-emerald text-white shadow-glow animate-pulse-glow"
                : "bg-card/80 backdrop-blur-xl border border-border/40 hover:bg-accent/50"
            )}
          >
            {isListening ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
