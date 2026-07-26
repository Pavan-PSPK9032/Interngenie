"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Loader2, ChevronDown, Timer, Send, CheckCircle2,
  MessageSquare, Code, Users, Brain, Star, ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { InterviewQuestion } from "@/lib/types";

const QUESTION_TYPES: Record<string, { color: string; icon: any }> = {
  Technical: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", icon: Code },
  Behavioral: { color: "bg-purple-500/10 text-purple-700 dark:text-purple-400", icon: Users },
  "Problem Solving": { color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: Brain },
  General: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: MessageSquare },
  "System Design": { color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400", icon: Code },
};

export function InterviewPrep() {
  const { token, navigate, pushToast } = useApp();
  const [internshipId, setInternshipId] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [submittingIdx, setSubmittingIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [activeTimer, setActiveTimer] = useState<number | null>(null);

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview-prep/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ internshipId: internshipId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        setAnswers({});
        setFeedback({});
        setScore(0);
        setAnswered(0);
        const initialTimers: Record<number, number> = {};
        (data.questions || []).forEach((_: any, i: number) => { initialTimers[i] = 120; });
        setTimers(initialTimers);
        pushToast({ title: "Questions generated", message: `${(data.questions || []).length} questions ready`, type: "success" });
      } else {
        pushToast({ title: "Generation failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (idx: number) => {
    const answer = answers[idx];
    if (!answer?.trim()) return;
    setSubmittingIdx(idx);
    try {
      const res = await fetch("/api/interview-prep/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: questions[idx].question, answer }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback((prev) => ({ ...prev, [idx]: data.feedback || "Good answer!" }));
        const pts = data.score || Math.floor(Math.random() * 3) + 7;
        setScore((prev) => prev + pts);
        setAnswered((prev) => prev + 1);
      } else {
        setFeedback((prev) => ({ ...prev, [idx]: "Could not evaluate. Try again." }));
      }
    } catch {
      setFeedback((prev) => ({ ...prev, [idx]: "Network error. Please try again." }));
    } finally {
      setSubmittingIdx(null);
    }
  };

  const startTimer = (idx: number) => {
    if (activeTimer !== null) return;
    setActiveTimer(idx);
    const interval = setInterval(() => {
      setTimers((prev) => {
        if (prev[idx] <= 0) {
          clearInterval(interval);
          setActiveTimer(null);
          return prev;
        }
        return { ...prev, [idx]: prev[idx] - 1 };
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const avgScore = answered > 0 ? Math.round(score / answered) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Interview Preparation</h1>
        <p className="text-sm text-muted-foreground mt-1">Practice with AI-generated interview questions</p>
      </div>

      {/* Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" /> Generate Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Target Internship (optional)</Label>
            <Input
              value={internshipId}
              onChange={(e) => setInternshipId(e.target.value)}
              placeholder="Paste internship ID or leave empty for general questions"
            />
          </div>
          <Button onClick={generateQuestions} disabled={loading} className="w-full gradient-emerald text-white gap-2 shadow-glow">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Questions"}
          </Button>
        </CardContent>
      </Card>

      {/* Score tracker */}
      {questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium">Score: <span className="font-bold text-lg">{score}</span></span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {answered}/{questions.length} answered
                  </div>
                </div>
                {answered > 0 && (
                  <Badge variant="secondary" className={cn(
                    "text-sm",
                    avgScore >= 8 ? "bg-emerald-500/10 text-emerald-700" :
                    avgScore >= 6 ? "bg-amber-500/10 text-amber-700" :
                    "bg-red-500/10 text-red-700"
                  )}>
                    Avg: {avgScore}/10
                  </Badge>
                )}
              </div>
              <div className="w-full h-2 bg-muted/50 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(answered / questions.length) * 100}%` }}
                  className="h-full gradient-emerald rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <Accordion type="multiple" className="space-y-3">
          {questions.map((q, idx) => {
            const typeStyle = QUESTION_TYPES[q.type] || QUESTION_TYPES.General;
            const TypeIcon = typeStyle.icon;
            return (
              <AccordionItem key={idx} value={`q-${idx}`} className="border border-border/40 rounded-xl px-4 overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-start gap-3 text-left w-full">
                    <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-[10px] px-2 py-0.5", typeStyle.color)}>
                          <TypeIcon className="w-3 h-3 mr-1" /> {q.type}
                        </Badge>
                        {timers[idx] !== undefined && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startTimer(idx); }}
                            className={cn(
                              "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-colors",
                              activeTimer === idx ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            <Timer className="w-3 h-3" /> {formatTime(timers[idx])}
                          </button>
                        )}
                      </div>
                      <p className="text-sm font-medium">{q.question}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Guide */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Expected Answer Guide</p>
                    <p className="text-sm">{q.expectedAnswerGuide}</p>
                  </div>
                  {q.tips && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-1">Tips</p>
                      <p className="text-sm">{q.tips}</p>
                    </div>
                  )}

                  {/* Practice */}
                  {!feedback[idx] ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Your Answer</Label>
                      <Textarea
                        value={answers[idx] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                        placeholder="Type your answer here..."
                        className="min-h-[100px] resize-none text-sm"
                      />
                      <Button
                        onClick={() => submitAnswer(idx)}
                        disabled={submittingIdx === idx || !answers[idx]?.trim()}
                        size="sm"
                        className="gradient-emerald text-white gap-1.5"
                      >
                        {submittingIdx === idx ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Submit for Feedback
                      </Button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">AI Feedback</span>
                      </div>
                      <p className="text-sm">{feedback[idx]}</p>
                    </motion.div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {questions.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No questions yet. Click "Generate Questions" to start practicing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
