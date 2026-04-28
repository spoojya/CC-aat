const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*"
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

const logAnalysisSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true
    },
    totalLines: {
      type: Number,
      required: true
    },
    counts: {
      error: { type: Number, default: 0 },
      warning: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
      uncategorized: { type: Number, default: 0 }
    },
    percentages: {
      error: { type: Number, default: 0 },
      warning: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
      uncategorized: { type: Number, default: 0 }
    },
    sampleLines: {
      error: { type: [String], default: [] },
      warning: { type: [String], default: [] },
      info: { type: [String], default: [] }
    }
  },
  {
    timestamps: true
  }
);

const LogAnalysis = mongoose.model("LogAnalysis", logAnalysisSchema);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isAllowed = [".log", ".txt"].includes(path.extname(file.originalname).toLowerCase());
    if (!isAllowed) {
      return cb(new Error("Only .log and .txt files are allowed"));
    }
    cb(null, true);
  }
});

function calculatePercentages(counts, totalLines) {
  if (!totalLines) {
    return {
      error: 0,
      warning: 0,
      info: 0,
      uncategorized: 0
    };
  }

  return {
    error: Number(((counts.error / totalLines) * 100).toFixed(2)),
    warning: Number(((counts.warning / totalLines) * 100).toFixed(2)),
    info: Number(((counts.info / totalLines) * 100).toFixed(2)),
    uncategorized: Number(((counts.uncategorized / totalLines) * 100).toFixed(2))
  };
}

function analyzeLogContent(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const counts = {
    error: 0,
    warning: 0,
    info: 0,
    uncategorized: 0
  };

  const sampleLines = {
    error: [],
    warning: [],
    info: []
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes("error")) {
      counts.error += 1;
      if (sampleLines.error.length < 3) sampleLines.error.push(line);
      continue;
    }

    if (lowerLine.includes("warn")) {
      counts.warning += 1;
      if (sampleLines.warning.length < 3) sampleLines.warning.push(line);
      continue;
    }

    if (lowerLine.includes("info")) {
      counts.info += 1;
      if (sampleLines.info.length < 3) sampleLines.info.push(line);
      continue;
    }

    counts.uncategorized += 1;
  }

  return {
    totalLines: lines.length,
    counts,
    percentages: calculatePercentages(counts, lines.length),
    sampleLines
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Cloud Log Analyzer backend is running" });
});

app.post("/api/logs/upload", upload.single("logFile"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a log file" });
    }

    const content = fs.readFileSync(req.file.path, "utf-8");
    const analysis = analyzeLogContent(content);

    const savedRecord = await LogAnalysis.create({
      fileName: req.file.originalname,
      ...analysis
    });

    res.status(201).json(savedRecord);
  } catch (error) {
    next(error);
  }
});

app.get("/api/logs", async (_req, res, next) => {
  try {
    const logs = await LogAnalysis.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

app.get("/api/logs/:id", async (req, res, next) => {
  try {
    const log = await LogAnalysis.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Analysis record not found" });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const statusCode = error.name === "CastError" ? 400 : 500;
  res.status(statusCode).json({
    message: error.message || "Something went wrong"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
