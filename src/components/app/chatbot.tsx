"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I write a good resume?",
  "Which internships match my skills?",
  "Tips for technical interviews",
  "Best courses for Data Science",
];

export function Chatbot() {
  const { chatbotOpen, setChatbotOpen, user } = useApp();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm InternGenie, your AI career assistant. I can help you find internships, prepare your resume, ace interviews, and plan your career. What would you like help with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user ? { Authorization: `Bearer ${useApp.getState().token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply || "Sorry, I didn't get that." },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setChatbotOpen(!chatbotOpen)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full gradient-emerald shadow-glow flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {chatbotOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!chatbotOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse-glow border-2 border-background" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {chatbotOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-44 md:bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col rounded-2xl glass-strong shadow-premium border border-border/40 overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-emerald px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">InternGenie AI</p>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  Online · Ready to help
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatbotOpen(false)}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[400px]"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user"
                        ? "bg-muted"
                        : "gradient-emerald"
                    )}
                  >
                    {msg.role === "user" ? (
                      <UserIcon className="w-4 h-4 text-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full gradient-emerald flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions (only on first interaction) */}
              {messages.length === 1 && !loading && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-3 bg-card/30">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="min-h-[40px] max-h-[100px] resize-none text-sm rounded-xl"
                  rows={1}
                />
                <Button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="gradient-emerald text-white rounded-xl h-10 w-10 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
