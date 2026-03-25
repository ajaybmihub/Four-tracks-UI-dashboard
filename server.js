require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron');

let cachedProgressData = null;
let isCalculatingProgress = false;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── MONGOOSE SETUP ──
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing. Set it in your environment variables or .env file.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Successfully connected to MongoDB Cluster.");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📂 Collections available: ${collections.map(c => c.name).join(", ")}`);
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    // Log helpful advice if connection fails
    if (err.message.includes("whitelist")) {
      console.log("💡 Tip: Make sure your deployment IP is in the MongoDB Atlas whitelist.");
    }
  });

const questionSchema = new mongoose.Schema({
  department: String,
  exam_type: String,
  subject: String,
  topic: String,
  subtopic: String,
  difficulty: String,
  question: String,
  option: {
    A: String,
    B: String,
    C: String,
    D: String,
    E: String
  },
  answer: String,
  explanation: String,
  level: String,
  eligibility: String,
  year: String,
  pdf_name: String
});

// Cache for dynamic models
const models = {};
function getQuestionModel(collectionName) {
  if (!models[collectionName]) {
    models[collectionName] = mongoose.model(collectionName, questionSchema, collectionName);
  }
  return models[collectionName];
}

// ── TOPIC MODEL ──
const topicSchema = new mongoose.Schema({
  track_name: String,
  category: String,
  exam_name: String,
  conducting_body: String,
  level: String,
  eligibility: String,
  frequency: String,
  question_count: String,
  year_range: String
}, { collection: 'topics' });

const Topic = mongoose.model('Topic', topicSchema);

// ── API ROUTES ──

// Helper to map department/category to collection name
function mapToCollection(dept) {
    if (!dept) return "topics"; 
    const d = dept.toLowerCase();
    
    // Exact/Specific matches first
    if (d.includes("upsc")) return "upsc";
    if (d.includes("railway")) return "railways";
    if (d.includes("bank") || d.includes("sbi") || d.includes("ibps") || d.includes("rbi") || d.includes("pnb") || d.includes("canara") || d.includes("hdfc") || d.includes("bob") || d.includes("axis") || d.includes("icici") || d.includes("idbi") || d.includes("indian bank") || d.includes("central bank") || d.includes("union bank") || d.includes("corporation bank") || d.includes("dena bank") || d.includes("vijaya bank") || d.includes("syndicate bank") || d.includes("oriental bank") || d.includes("idfc") || d.includes("yes bank") || d.includes("kotak")) return "bank_exams";
    if (d.includes("neet pg")) return "neet_pg";
    if (d.includes("neet")) return "neet_ug";
    if (d.includes("afcat") || d.includes("defence_afcad") || d.includes("afcad")) return "defence_afcad";
    
    // JEE sub-variants
    if (d.includes("jee advance")) return "jee_advance";
    if (d.includes("jee main") || d.includes("jee")) return "jee_main";

    return "topics"; 
}

// 1. GET /exams
app.get("/exams", async (req, res) => {
  try {
    const exams = await Topic.distinct("category");
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /years?exam=UPSC
app.get("/years", async (req, res) => {
  try {
    const { exam } = req.query; 
    const collectionName = mapToCollection(exam);
    const Model = getQuestionModel(collectionName);
    
    // If the collection contains multiple types, we should filter by the requested exam
    // Exception: dedicated collections for single exams
    const dedicated = ["jee_main", "jee_advance", "neet_ug", "neet_pg"];
    let filter = { year: { $gte: "1900" } };
    
    if (exam && !dedicated.includes(collectionName)) {
        filter.$or = [
            { exam_type: exam },
            { exam: exam },
            { category: exam }
        ];
        
        // Loosen regex for bank exams if literal match fails
        if (collectionName === "bank_exams") {
           filter.$or.push({ exam_type: { $regex: exam.split(' ')[0], $options: 'i' } });
        }
    }

    const years = await Model.distinct("year", filter);
    res.json(years.sort((a,b) => b.localeCompare(a)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /papers?exam=UPSC&year=2024
app.get("/papers", async (req, res) => {
  try {
    const { exam, year } = req.query;
    const Model = getQuestionModel(mapToCollection(exam));
    
    const papers = await Model.aggregate([
      { $match: { 
          $and: [
            { $or: [{ year: String(year) }, { year: Number(year) }] },
            { $or: [
                { exam_type: exam },
                { exam: exam },
                { category: exam },
                { exam_type: { $regex: exam.split(' ')[0], $options: 'i' } } 
            ]}
          ]
      }},
      {
        $group: {
          _id: { $ifNull: ["$exam_type", "$exam"] }, 
          pdf_name: { $first: "$pdf_name" },
          paper: { $first: { $ifNull: ["$exam_type", "$exam"] } }
        }
      }
    ]);
    
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /questions?paper_id=...&exam=UPSC
app.get("/questions", async (req, res) => {
  try {
    const { paper_id, exam, year } = req.query;
    const Model = getQuestionModel(mapToCollection(exam));
    
    let query = { $or: [{ exam_type: paper_id }, { exam: paper_id }] };
    if (year) {
      query = {
        $and: [
          { $or: [{ exam_type: paper_id }, { exam: paper_id }] },
          { $or: [{ year: String(year) }, { year: Number(year) }] }
        ]
      };
    }
    
    const questions = await Model.find(query);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /topics?track=...
app.get("/topics", async (req, res) => {
  try {
    const { track } = req.query;
    const filter = track ? { track_name: track } : {};
    const topics = await Topic.find(filter);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 6. GET /api/progress
async function calculateProgress() {
  if (isCalculatingProgress) return;
  isCalculatingProgress = true;
  try {
    const collections = {
        'upsc': 'Govt Exams Track',
        'railways': 'Govt Exams Track',
        'bank_exams': 'Banking Track',
        'jee_main': 'JEE / NEET Track',
        'jee_advance': 'JEE / NEET Track',
        'neet_ug': 'JEE / NEET Track',
        'neet_pg': 'JEE / NEET Track',
        'defence_afcad': 'Govt Exams Track'
    };

    let metric = {
        totalUpdatedYears: 0,
        targetYears: 5985, // 399 exams * 15
        tracks: {
            "Govt Exams Track": { updated: 0, target: 0 },
            "Banking Track": { updated: 0, target: 0 },
            "JEE / NEET Track": { updated: 0, target: 0 },
            "Tech Track": { updated: 0, target: 0 }
        },
        exams: {}
    };

    for (const [col, trackTitle] of Object.entries(collections)) {
      const Model = getQuestionModel(col);
      
      const singleExamOverrides = {
        'jee_main': 'JEE Main',
        'jee_advance': 'JEE Advanced',
        'neet_ug': 'NEET UG',
        'neet_pg': 'NEET PG'
      };

      if (singleExamOverrides[col]) {
          const years = (await Model.distinct("year")).filter(y => y && String(y).trim() !== "");
          const count = years.length;
          metric.exams[singleExamOverrides[col]] = count;
          metric.tracks[trackTitle].updated += count;
          metric.totalUpdatedYears += count;
      } else {
          const aggr = await Model.aggregate([
              { $group: { _id: { exam_name: { $ifNull: ["$exam_type", "$exam"] }, year: "$year" } } },
              { $group: { _id: "$_id.exam_name", updated_years: { $sum: 1 } } }
          ]);
          
          if (col === 'bank_exams') console.log("Bank individual counts:", aggr);
          
          aggr.forEach(item => {
              if (item._id) {
                  metric.exams[item._id] = item.updated_years;
                  metric.tracks[trackTitle].updated += item.updated_years;
                  metric.totalUpdatedYears += item.updated_years;
              }
          });
          
          // Fallback mapping for display names
          if (col === 'bank_exams') {
              metric.exams["SBI PO"] = metric.exams["SBI"] || 0;
              metric.exams["SBI Clerk"] = metric.exams["SBI"] || 0;
              metric.exams["IBPS PO"] = metric.exams["IBPS"] || 0;
              metric.exams["IBPS Clerk"] = metric.exams["IBPS"] || 0;
              metric.exams["IBPS RRB Officer Scale I (PO)"] = metric.exams["IBPS"] || 0;
              metric.exams["IBPS RRB Office Assistant (Clerk)"] = metric.exams["IBPS"] || 0;
              metric.exams["IBPS Specialist Officer (SO)"] = metric.exams["IBPS"] || 0;
          }
      }
    }

    const allTopics = await Topic.find({});
    let trackCounts = { "Govt Exams Track": 0, "Banking Track": 0, "JEE / NEET Track": 0, "Tech Track": 24 };
    allTopics.forEach(t => {
      if (t.track_name && trackCounts.hasOwnProperty(t.track_name) && t.track_name !== "Tech Track") {
          trackCounts[t.track_name]++;
      }
    });

    for (const track in trackCounts) {
      if (track === "Tech Track") continue;
      metric.tracks[track].target = trackCounts[track] * 15;
    }

    cachedProgressData = metric;
  } catch (err) {
    console.error("Error calculating progress in cron task:", err.message);
  } finally {
    isCalculatingProgress = false;
  }
}

// Ensure the db connection is ready before calculating.
// We'll calculate progress periodically locally just in case.
cron.schedule('*/10 * * * * *', calculateProgress);

// In case the connection takes a moment, set a timeout to trigger initially.
setTimeout(calculateProgress, 5000);

app.get("/api/progress", async (req, res) => {
  try {
    if (cachedProgressData) {
      return res.json(cachedProgressData);
    }
    
    // Fallback if not ready yet
    await calculateProgress();
    res.json(cachedProgressData || { error: "Still calculating..." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── EXTERNAL CRON & RENDER KEEP-ALIVE ROUTES ──

// Job 1: Keep Alive (Ping every 5 mins to stop Render from sleeping)
app.get("/api/keep-alive", (req, res) => {
  res.status(200).json({ status: "Alive!", time: new Date() });
});

// Job 2: Actual Logic (Ping via cron-job.org)
app.get("/api/cron-job", async (req, res) => {
  const secret = req.query.key;

  // Verify the secret key to prevent unauthorized execution
  // Set CRON_SECRET in your Render environment variables (e.g. CRON_SECRET=MY_SECRET)
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    console.log("External Cron triggered at:", new Date());

    // Execute the database progress aggregation
    await calculateProgress();

    res.status(200).json({
      success: true,
      message: "Cron job executed successfully 🚀",
      time: new Date()
    });

  } catch (error) {
    console.error("Cron error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
