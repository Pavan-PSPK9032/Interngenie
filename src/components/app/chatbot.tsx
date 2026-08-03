"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User as UserIcon, Mic, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVoiceSearch } from "@/components/hooks/useVoiceSearch";

interface Msg {
  role: "user" | "assistant";
  content: string;
  extra?: ChatExtra | null;
}

interface ChatExtra {
  type: "interview_questions" | "certificate_recommendations";
  questions?: string[];
  recommendations?: Array<{
    skill: string;
    name: string;
    platform: string;
    duration: string;
    level: string;
    reason: string;
  }>;
}

const OFF_TOPIC_REPLY =
  "I'm designed to assist only with internship-related topics and features available on this platform.";

const OFF_TOPIC_PATTERNS = [
  /weather|temperature today|who won|cricket|ipl|football|joke|funny movie|politics|election|bitcoin price|stock market|recipe|horoscope|lottery|what is the time|translate|poem/i,
];

const SUGGESTIONS = [
  "How do I write a good resume?",
  "Which internships match my skills?",
  "Generate 5 technical interview questions",
  "Recommend certifications for missing skills",
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
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported } = useVoiceSearch("en-IN");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInput((prev) => (prev ? prev + " " : "") + transcript);
    }
  }, [transcript, isListening]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ""));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const trimmed = text.trim();

    // Client-side off-topic fast-path
    if (OFF_TOPIC_PATTERNS.some((p) => p.test(trimmed))) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: OFF_TOPIC_REPLY },
      ]);
      setInput("");
      return;
    }

    const newMessages = [...messages, { role: "user" as const, content: trimmed }];
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
        { role: "assistant", content: data.reply || "Sorry, I didn't get that.", extra: data.extra || null },
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

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setInput("");
      startListening();
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
                <div key={i} className={cn("flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2.5 max-w-[85%]",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        msg.role === "user" ? "bg-muted" : "gradient-emerald"
                      )}
                    >
                      {msg.role === "user" ? (
                        <UserIcon className="w-4 h-4 text-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => (speaking ? stopSpeaking() : speak(msg.content))}
                          className="self-start text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 px-1"
                        >
                          {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          {speaking ? "Stop" : "Listen"}
                        </button>
                      )}
                    </div>
                  </motion.div>

                  {/* Extra payload cards */}
                  {msg.extra?.type === "interview_questions" && msg.extra.questions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full sm:max-w-[90%] rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-2"
                    >
                      <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Practice Questions
                      </p>
                      {msg.extra.questions.map((q, qi) => (
                        <div key={qi} className="flex items-start gap-2 text-xs text-foreground">
                          <Badge variant="outline" className="text-[10px] mt-0.5 shrink-0">{qi + 1}</Badge>
                          <p>{q}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {msg.extra?.type === "certificate_recommendations" && msg.extra.recommendations && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full sm:max-w-[90%] rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2"
                    >
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Recommended Certifications
                      </p>
                      {msg.extra.recommendations.map((r, ri) => (
                        <div key={ri} className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">{r.skill}</Badge>
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground">{r.platform} · {r.duration} · {r.level}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
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
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions (only on first interaction) */}
              {messages.length === 1 && !loading && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
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
              {isListening && (
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs text-muted-foreground truncate">
                    {interimTranscript || "Listening..."}
                  </p>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMic}
                  disabled={!isSupported}
                  className={cn(
                    "rounded-xl h-10 w-10 shrink-0",
                    isListening ? "bg-red-500/10 text-red-500" : "text-muted-foreground hover:text-primary"
                  )}
                  title={isSupported ? "Speak your question" : "Voice input not supported"}
                >
                  <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
                </Button>
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
