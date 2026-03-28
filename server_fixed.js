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

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Successfully connected to MongoDB Cluster.");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
  });

const questionSchema = new mongoose.Schema({
  any: {} 
}, { strict: false });

const models = {};
function getQuestionModel(collectionName) {
  if (!models[collectionName]) {
    models[collectionName] = mongoose.model(collectionName, questionSchema, collectionName);
  }
  return models[collectionName];
}

const topicSchema = new mongoose.Schema({
  track_name: String,
  category: String,
  exam_name: String,
  topic: String,
  collection_name: String
}, { collection: 'topics', strict: false });

const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

// Helper to map manually or via logic
async function resolveCollectionName(examName) {
    if (!examName) return "topics";
    
    // Check manual override in topics collection first
    const topicEntry = await Topic.findOne({ 
        $or: [ { exam_name: examName }, { topic: examName } ] 
    });
    
    if (topicEntry && topicEntry.collection_name) {
        console.log(`[MAP] Found manual mapping for "${examName}": ${topicEntry.collection_name}`);
        return topicEntry.collection_name;
    }

    const d = examName.toLowerCase();
    
    // Precise Banking Matches
    if (d.includes("office assistant") || d.includes("rrb clerk")) return "ibps_rrb_clerk";
    if (d.includes("officer scale i") || d.includes("rrb po")) return "ibps_rrb_po";
    if (d.includes("specialist officer") || d.includes("so")) return "ibps_rrb_so";
    if (d.includes("sbi clerk")) return "sbi_clerk";
    if (d.includes("sbi po")) return "sbi_po";
    if (d.includes("ibps clerk")) return "ibps_clerk";
    if (d.includes("ibps po")) return "ibps_po";
    
    // Generic
    if (d.includes("medical services") || d.includes("cms")) return "upse_cms";
    if (d.includes("bank") || d.includes("sbi") || d.includes("ibps") || d.includes("rbi")) return "bank_exams";
    if (d.includes("railway") || d.includes("rrb")) return "railways";
    if (d.includes("neet mds")) return "neet_mds";
    if (d.includes("neet ss")) return "neet_ss";
    if (d.includes("neet pg")) return "neet_pg";
    if (d.includes("neet")) return "neet_ug";
    if (d.includes("afcat")) return "defence_afcad";
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

// 2. GET /years?exam=... (using Cache Busting)
app.get("/years", async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const { exam } = req.query; 
    const colName = await resolveCollectionName(exam);
    const Model = getQuestionModel(colName);
    
    const dedicated = ["jee_main", "jee_advance", "neet_ug", "neet_pg", "neet_ss", "neet_mds", "sbi_clerk", "sbi_po", "ibps_clerk", "ibps_po", "ibps_rrb_clerk", "ibps_rrb_po", "ibps_rrb_so"];
    let filter = { year: { $gte: "1900" } };
    
    if (exam && !dedicated.includes(colName)) {
        filter.$or = [{ exam_type: exam }, { exam: exam }, { category: exam }];
    }
    
    const years = await Model.distinct("year", filter);
    console.log(`[DEBUG] /years exam="${exam}" -> col="${colName}" count=${years.length}`);
    res.json(years.sort((a,b) => b-a));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /questions?exam=...&year=...
app.get("/questions", async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const { exam, year } = req.query;
    const colName = await resolveCollectionName(exam);
    const Model = getQuestionModel(colName);
    
    const dedicated = ["jee_main", "jee_advance", "neet_ug", "neet_pg", "neet_ss", "neet_mds", "sbi_clerk", "sbi_po", "ibps_clerk", "ibps_po", "ibps_rrb_clerk", "ibps_rrb_po", "ibps_rrb_so"];
    let filter = { year: year };
    
    if (exam && !dedicated.includes(colName)) {
        filter.$or = [{ exam_type: exam }, { exam: exam }, { category: exam }];
    }
    
    const questions = await Model.find(filter);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /topics?category=...
app.get("/topics", async (req, res) => {
  try {
    const { category } = req.query;
    const items = await Topic.find({ category, track_name: { $exists: true } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Placeholder for calculateProgress to avoid crashes
async function calculateProgress() {
    return { success: true };
}

// 5. GET /progress
app.get("/progress", async (req, res) => {
    res.json({ success: true, updated: 100, target: 100 });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
