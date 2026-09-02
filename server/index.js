require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { auth, requireRole, optionalAuth } = require("./middleware/auth");
const rateLimiter = require("./middleware/rateLimiter");
const sanitizer = require("./middleware/sanitizer");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(sanitizer());
app.use(rateLimiter({ windowMs: 60000, max: 100 }));

app.get("/", (req, res) => res.json({ message: "InternGenie API is running" }));
app.get("/api", (req, res) => res.json({ message: "Hello, world!" }));
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.use("/api/auth", rateLimiter({ windowMs: 60000, max: 10 }), require("./routes/auth"));
app.use("/api/internships", require("./routes/internships"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/admin", auth, requireRole("ADMIN"), require("./routes/admin"));
app.use("/api/applications", auth, require("./routes/applications"));
app.use("/api/notifications", auth, require("./routes/notifications"));
app.use("/api/profile", auth, require("./routes/profile"));
app.use("/api/public/profile", optionalAuth, require("./routes/publicProfile"));
app.use("/api/search", auth, require("./routes/search"));
app.use("/api/chat", optionalAuth, require("./routes/chat"));
app.use("/api/recommendations", auth, require("./routes/recommendations"));
app.use("/api/careers", auth, require("./routes/careers"));
app.use("/api/skill-gap", auth, require("./routes/skillGap"));
app.use("/api/certificates", auth, require("./routes/certificates"));
app.use("/api/resume", optionalAuth, require("./routes/resume"));
app.use("/api/ats", auth, require("./routes/ats"));
app.use("/api/cover-letter", auth, require("./routes/coverLetter"));
app.use("/api/interview-prep", auth, require("./routes/interviewPrep"));

app.use((req, res) => { res.status(404).json({ error: "Route not found" }); });
app.use(errorHandler);

const http = require("http");
const { setupWebSocket } = require("./ws");

const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  const server = http.createServer(app);
  setupWebSocket(server);
  server.listen(PORT, () => console.log(`InternGenie API running on port ${PORT}`));
});
