const Internship = require("../models/Internship");
const Application = require("../models/Application");
const { interviewPrep } = require("../utils/aiEngine");

const sessionStore = new Map();

exports.generateQuestions = async (req, res, next) => {
  try {
    const { internshipId } = req.body;
    if (!internshipId) return res.status(400).json({ error: "internshipId is required" });

    const internship = await Internship.findById(internshipId).lean();
    if (!internship) return res.status(404).json({ error: "Internship not found" });

    const application = await Application.findOne({ studentId: req.user.id, internshipId }).lean();
    if (!application) return res.status(403).json({ error: "You must have applied to this internship to access interview prep" });

    const studentProfile = {
      name: req.user.name,
      skills: req.user.skills || [],
      interests: req.user.interests || [],
      cgpa: req.user.cgpa,
      college: req.user.college,
      degree: req.user.degree,
      branch: req.user.branch,
    };

    const result = interviewPrep(
      {
        domain: internship.domain,
        title: internship.title,
        companyName: internship.companyName || "the company",
        skills: internship.skills || [],
        duration: internship.duration,
      },
      studentProfile
    );

    const sessionId = `session_${req.user.id}_${Date.now()}`;
    sessionStore.set(sessionId, {
      userId: req.user.id,
      internshipId,
      questions: result.questions.map((q, i) => ({ ...q, id: `${sessionId}_q${i}` })),
      answers: [],
      createdAt: new Date().toISOString(),
    });

    return res.json({
      sessionId,
      questions: result.questions.map((q, i) => ({
        id: `${sessionId}_q${i}`,
        question: q.question,
        type: q.type,
        tips: q.tips,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.evaluateAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId, answer } = req.body;
    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ error: "sessionId, questionId, and answer are required" });
    }

    const session = sessionStore.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });

    const answerLower = answer.toLowerCase();
    const guideLower = question.expectedAnswerGuide.toLowerCase();
    const guideWords = guideLower.split(/\s+/).filter((w) => w.length > 3);
    const matchedGuideWords = guideWords.filter((w) => answerLower.includes(w));
    const guideCoverage = guideWords.length > 0 ? matchedGuideWords.length / guideWords.length : 0;

    const wordCount = answer.split(/\s+/).length;
    const lengthScore = Math.min(1, wordCount / 100);

    const hasStructure = /\b(first|second|additionally|furthermore|in conclusion|to summarize|for example|specifically)\b/i.test(answer);
    const structureScore = hasStructure ? 0.2 : 0;

    const rawScore = (guideCoverage * 0.5 + lengthScore * 0.3 + structureScore) * 100;
    const score = Math.round(Math.min(95, Math.max(10, rawScore)));

    let rating;
    if (score >= 80) rating = "Excellent";
    else if (score >= 60) rating = "Good";
    else if (score >= 40) rating = "Needs Improvement";
    else rating = "Weak";

    const feedback = [];
    if (wordCount < 30) feedback.push("Your answer is too brief. Aim for a more detailed response with specific examples.");
    if (!hasStructure) feedback.push("Try structuring your answer with clear points (First, Additionally, In conclusion).");
    if (guideCoverage < 0.3) feedback.push("Consider covering more of the key points: " + question.expectedAnswerGuide.slice(0, 150));
    if (score >= 80) feedback.push("Strong answer. Consider adding a specific metric or outcome to make it even more compelling.");
    if (question.type === "behavioral" && !(/\b(situation|task|action|result|example|time)\b/i.test(answer))) {
      feedback.push("For behavioral questions, use the STAR method: describe the Situation, Task, Action, and Result.");
    }

    session.answers.push({ questionId, answer, score, evaluatedAt: new Date().toISOString() });

    return res.json({
      score,
      rating,
      feedback,
      expectedKeyPoints: question.expectedAnswerGuide.split(".").filter((s) => s.trim().length > 10).slice(0, 3),
    });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const userSessions = [];
    for (const [sessionId, session] of sessionStore.entries()) {
      if (session.userId === req.user.id) {
        userSessions.push({
          sessionId,
          internshipId: session.internshipId,
          questionCount: session.questions.length,
          answeredCount: session.answers.length,
          averageScore: session.answers.length > 0
            ? Math.round(session.answers.reduce((sum, a) => sum + a.score, 0) / session.answers.length)
            : 0,
          createdAt: session.createdAt,
        });
      }
    }

    userSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ sessions: userSessions.slice(0, 20) });
  } catch (err) {
    next(err);
  }
};
