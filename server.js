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
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

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
  year_range: String,
  sub_topic: [String]
}, { collection: 'topics' });

const Topic = mongoose.model('Topic', topicSchema);

// ── API ROUTES ──

// Helper to map department/category to collection name
function mapToCollection(dept) {
    if (!dept) return "topics"; 
    const d = dept.toLowerCase();
    
    // Exact/Specific matches for UPSC sub-exams
    if (d.includes("medical services") || d.includes("cms")) return "upse_cms";
    if (d.includes("upsc") || d.includes("civil services") || d.includes("cse") || d.includes("forest service") || d.includes("ifos") || d.includes("defence service") || d.includes("cds") || d.includes("defence academy") || d.includes("nda") || d.includes("economic service") || d.includes("epfo") || d.includes("central armed police forces") || d.includes("capf") || d.includes("geo-scientist")) return "upsc";
    if (d.includes("engineering services") || d.includes("ese") || d.includes("ies")) return "engineering_services_examination_(ESE/IES)";
    
    // 1. Precise Banking Matches (HIGHEST PRIORITY)
    if (d.includes("office assistant") || d.includes("rrb clerk") || d.includes("rrb po") || d.includes("officer scale i")) {
        if (d.includes("clerk") || d.includes("assistant")) return "ibps_rrb_clerk";
        if (d.includes("po") || d.includes("scale i")) return "ibps_rrb_po";
    }
    if (d.includes("specialist officer") || d.includes("so")) return "ibps_rrb_so";
    if (d.includes("sbi clerk") || d === "sbi clerk") return "sbi_clerk";
    if (d.includes("sbi po") || d === "sbi po") return "sbi_po";
    if (d.includes("ibps clerk") || d === "ibps clerk") return "ibps_clerk";
    if (d.includes("ibps po") || d === "ibps po") return "ibps_po";
    if (d.includes("bank") || d.includes("sbi") || d.includes("ibps") || d.includes("rbi") || d.includes("rbi po") || d.includes("rbi assistant")) return "bank_exams";
    
    // 2. Railways / RRB
    if (d.includes("railway") || d.includes("rrb") || d.includes("ntpc") || d.includes("group d") || d.includes("alp") || d.includes("rpf")) return "railways";
    
    // 3. Medical
    if (d.includes("medical services") || d.includes("cms")) return "upse_cms";
    if (d.includes("neet mds")) return "neet_mds";
    if (d.includes("neet ss")) return "neet_ss";
    if (d.includes("neet pg")) return "neet_pg";
    if (d.includes("neet")) return "neet_ug";
    
    // Defence
    if (d.includes("afcat") || d.includes("defence_afcad") || d.includes("afcad")) return "defence_afcad";
    
    // JEE sub-variants
    if (d.includes("jee advance")) return "jee_advance";
    if (d.includes("jee main") || d.includes("jee")) return "jee_main";

    // 4. Tech Track (DSA)
    const techTopics = ["arrays", "strings", "hashing", "linked lists", "stack", "queue", "binary search", "trees", "graphs", "recursion", "backtracking", "dynamic programming", "greedy", "heap", "priority queue", "ai / machine learning", "web development", "software engineering", "programming languages", "operating systems", "cloud & devops", "system design", "databases", "dsa"];
    if (techTopics.some(t => d.includes(t)) || d.includes("data structure") || d.includes("algorithms")) {
        return "coding_problems";
    }

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
    console.log(`[DEBUG] /years: exam="${exam}", collectionName="${collectionName}"`);
    const Model = getQuestionModel(collectionName);
    
    const dedicated = [
        "jee_main", "jee_advance", "neet_ug", "neet_pg", "neet_ss", "neet_mds",
        "sbi_clerk", "sbi_po", "ibps_clerk", "ibps_po", "ibps_rrb_clerk", "ibps_rrb_po", "ibps_rrb_so", "engineering_services_examination_(ESE/IES)",
        "coding_problems"
    ];
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

    if (collectionName === "coding_problems") {
        return res.json(["Topic Based"]);
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
    const colName = mapToCollection(exam);
    const Model = getQuestionModel(colName);
    
    if (colName === "coding_problems") {
        return res.json([{ _id: exam, pdf_name: null, paper: exam + " - Topic Based" }]);
    }

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
        const colName = mapToCollection(exam);
        const Model = getQuestionModel(colName);
        
        // Special case for Tech Track (uses sub_topic filtering)
        if (colName === "coding_problems") {
            const topicMeta = await Topic.findOne({ 
                $or: [{ exam_name: exam }, { topic: exam }, { category: exam }],
                track_name: "Tech Track" 
            });
            
            const searchTags = topicMeta ? [topicMeta.exam_name, ...(topicMeta.sub_topic || [])] : [exam];
            
            const questions = await Model.find({ 
                $or: [
                    { topics: { $in: searchTags } }, 
                    { topic: { $in: searchTags } },
                    { role: { $in: searchTags } },
                    { topics_normalized: { $in: searchTags } }
                ]
            }).limit(50);
            return res.json(questions);
        }

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
        'defence_afcad': 'Govt Exams Track',
        'engineering_services_examination_(ESE/IES)': 'Govt Exams Track',
        'ibps_clerk': 'Banking Track',
        'ibps_po': 'Banking Track',
        'ibps_rrb_clerk': 'Banking Track',
        'ibps_rrb_po': 'Banking Track',
        'ibps_rrb_so': 'Banking Track',
        'jee_advance': 'JEE / NEET Track',
        'jee_main': 'JEE / NEET Track',
        'neet_mds': 'JEE / NEET Track',
        'neet_pg': 'JEE / NEET Track',
        'neet_ss': 'JEE / NEET Track',
        'neet_ug': 'JEE / NEET Track',
        'railways': 'Govt Exams Track',
        'sbi_clerk': 'Banking Track',
        'sbi_po': 'Banking Track',
        'upse_cms': 'Govt Exams Track',
        'coding_problems': 'Tech Track'
    };

    let metric = {
        totalUpdatedYears: 0,
        targetYears: 5985, // 399 exams * 15
        totalQuestions: 0,
        tracks: {
            "Govt Exams Track": { updated: 0, target: 0, questions: 0 },
            "Banking Track": { updated: 0, target: 0, questions: 0 },
            "JEE / NEET Track": { updated: 0, target: 0, questions: 0 },
            "Tech Track": { updated: 0, target: 0, questions: 0 }
        },
        exams: {}
    };

    for (const [col, trackTitle] of Object.entries(collections)) {
      const Model = getQuestionModel(col);
      
      // LIVE QUESTION COUNT
      const totalQInCol = await Model.countDocuments();
      console.log(`[DEBUG] DB COUNT for collection "${col}": ${totalQInCol}`);
      metric.tracks[trackTitle].questions = (metric.tracks[trackTitle].questions || 0) + totalQInCol;
      metric.totalQuestions += totalQInCol;
      
      const singleExamOverrides = {
        'jee_main': 'JEE Main',
        'jee_advance': 'JEE Advanced',
        'neet_ug': 'NEET UG',
        'neet_pg': 'NEET PG',
        'neet_ss': 'NEET SS',
        'neet_mds': 'NEET MDS',
        'upse_cms': 'Combined Medical Services (CMS)',
        'ibps_rrb_po': 'IBPS RRB Officer Scale I (PO)',
        'ibps_rrb_clerk': 'IBPS RRB Office Assistant (Clerk)',
        'sbi_clerk': 'SBI Clerk',
        'sbi_po': 'SBI PO',
        'ibps_clerk': 'IBPS Clerk',
        'ibps_po': 'IBPS PO',
        'engineering_services_examination_(ESE/IES)': 'Engineering Services Examination (ESE/IES)'
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
          
          aggr.forEach(item => {
              if (item._id) {
                  metric.exams[item._id] = item.updated_years;
                  metric.tracks[trackTitle].updated += item.updated_years;
                  metric.totalUpdatedYears += item.updated_years;
              }
          });
          if (col === 'coding_problems') {
              const techTopics = await Topic.find({ track_name: 'Tech Track' });
              for (const t of techTopics) {
                  if (t.exam_name) {
                      // BUILD SEARCH ARRAY: Exam Name + all its Sub-topics
                      const searchTags = [t.exam_name, ...(t.sub_topic || [])];
                      
                      const c = await Model.countDocuments({ 
                          $or: [
                              { topics: { $in: searchTags } }, 
                              { topic: { $in: searchTags } },
                              { role: { $in: searchTags } },
                              { topics_normalized: { $in: searchTags } }
                          ] 
                      });
                      metric.exams[t.exam_name] = c; 
                  }
              }
          }
          
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
      if (track === "Tech Track") {
          metric.tracks[track].target = 5000;
          metric.tracks[track].updated = metric.tracks[track].questions; 
      } else {
          metric.tracks[track].target = trackCounts[track] * 15;
      }
    }

    metric.totalQuestions = Math.round(metric.totalQuestions);
    console.log("[DEBUG] Final Computed Metric:", JSON.stringify(metric, null, 2));
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

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  try {
    await calculateProgress();
    console.log("Initial progress calculated successfully.");
  } catch (err) {
    console.error("Initial progress calculation failed:", err);
  }
});
