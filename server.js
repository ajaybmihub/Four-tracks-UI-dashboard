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
  not_conducted: String,
  sub_topic: [String]
}, { collection: 'topics', strict: false });

const Topic = mongoose.model('Topic', topicSchema);

// ── API ROUTES ──

// Helper to map department/category to collection name
function mapToCollection(dept) {
    if (!dept) return "topics"; 
    const d = dept.toLowerCase();
    
    // Exact/Specific matches for UPSC sub-exams
    if (d.includes("medical services") || d.includes("combined medical services") || d.includes("cms")) return "upsc_cms";
    if (d.includes("civil services examination") || d.includes("upsc cse") || d === "cse") return "upsc_cse";
    if (d.includes("combined geo-scientist") || d.includes("cgse")) return "combined_geo_scientist";
    if (d.includes("epfo enforcement officer") || d.includes("epfo ao")) return "epfo_enforcement_officer";
    if (d.includes("economic service") || d.includes("statistical service") || d.includes("ies/iss")) return "upsc_ies";
    if (d.includes("engineering services") || d.includes("ese") || d.includes("ies")) return "upsc_ese";
    
    if (d.includes("indian forest service") || d.includes("ifos")) return "upsc_ifos";
    if (d.includes("combined defence services") || d.includes("cds")) return "upsc_cds";
    if (d.includes("national defence academy") || d.includes("nda")) return "upsc_nda";
    if (d.includes("central armed police forces") && d.includes("assistant commandant")) return "upsc_capf_ac";
    if (d.includes("upsc capf") || d.includes("capf")) return "upsc_capf_ac";
    if (d.includes("upsc") || d.includes("civil services") || d.includes("cse") || d.includes("forest service") || d.includes("ifos") || d.includes("defence service") || d.includes("cds") || d.includes("defence academy") || d.includes("nda") || d.includes("economic service") || d.includes("epfo") || d.includes("central armed police forces") || d.includes("geo-scientist")) return "upsc";
    
    // 1. Precise Banking Matches (HIGHEST PRIORITY)
    if (d.includes("office assistant") || d.includes("rrb clerk") || d.includes("rrb po") || d.includes("officer scale i")) {
        if (d.includes("clerk") || d.includes("assistant")) return "ibps_rrb_clerk";
        if (d.includes("po") || d.includes("scale i")) return "ibps_rrb_po";
    }
    if (d.includes("specialist officer") || d.includes("so")) return "ibps_so";
    if (d.includes("sbi clerk") || d === "sbi clerk") return "sbi_clerk";
    if (d.includes("sbi po") || d === "sbi po") return "sbi_po";
    if (d.includes("ibps clerk") || d === "ibps clerk") return "ibps_clerk";
    if (d.includes("ibps po") || d === "ibps po") return "ibps_po";
    if (d.includes("bank") || d.includes("sbi") || d.includes("ibps") || d.includes("rbi") || d.includes("rbi po") || d.includes("rbi assistant")) return "bank_exams";
    
    // 2. Railways / RRB
    if (d.includes("railway") || d.includes("rrb") || d.includes("ntpc") || d.includes("group d") || d.includes("alp") || d.includes("rpf")) return "railways";
    
    // 3. Medical
    if (d.includes("medical services") || d.includes("combined medical services") || d.includes("cms")) return "upsc_cms";
    if (d.includes("neet mds")) return "neet_mds";
    if (d.includes("neet ss")) return "neet_ss";
    if (d.includes("neet pg")) return "neet_pg";
    if (d.includes("neet")) return "neet_ug";
    
    // Defence
    if (d.includes("afcat") || d.includes("defence_afcad") || d.includes("afcad")) return "defence_afcad";
    if (d.includes("agniveer")) return "indian_army_agniveer";
    if (d.includes("navy ssr") || d.includes("navy aa")) return "indian_navy_ssr";
    if (d.includes("coast guard")) return "coast_guard";
    if (d.includes("territorial army")) return "territorial_army_officer";
    if (d.includes("defence") || d.includes("army") || d.includes("navy") || d.includes("air force") || d.includes("military")) return "defence";
    
    // JEE sub-variants
    if (d.includes("jee advance")) return "jee_advance";
    if (d.includes("jee")) return "jee_main";

    // 4. Tech / Programming
    const techTopics = ["arrays", "strings", "hashing", "linked lists", "stack", "queue", "binary search", "trees", "graphs", "recursion", "backtracking", "dynamic programming", "greedy", "heap", "priority queue", "ai", "machine learning", "web dev", "software engineering", "operating systems", "database", "dsa", "c++", "java", "python", "javascript"];
    if (techTopics.some(t => d.includes(t)) || d.includes("data structure") || d.includes("algorithm") || d.includes("coding")) {
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
        "sbi_clerk", "sbi_po", "ibps_clerk", "ibps_po", "ibps_rrb_clerk", "ibps_rrb_po", "ibps_so", "upsc_ese",
        "coding_problems", "indian_army_agniveer", "indian_navy_ssr", "coast_guard", "territorial_army_officer",
        "upsc_cse", "combined_geo_scientist", "epfo_enforcement_officer", "upsc_capf_ac", "upsc_cms", "upsc_nda", "upsc_cds", "upsc_ifos", "upsc_ies"
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
                $or: [{ exam_name: exam }, { category: exam }],
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

// 5b. GET /topic-meta?exam=NEET+SS  → returns year_range + not_conducted for a single exam
app.get("/topic-meta", async (req, res) => {
  try {
    const { exam } = req.query;
    if (!exam) return res.status(400).json({ error: 'exam param required' });
    const doc = await Topic.findOne(
      { exam_name: exam },
      { year_range: 1, not_conducted: 1 }
    ).lean();
    if (!doc) return res.json({ year_range: '', not_conducted: '' });
    res.json({
      year_range: doc.year_range || '',
      not_conducted: doc.not_conducted || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ROOT HEALTH CHECK ──
app.get("/", (req, res) => {
  res.status(200).send(`
    <div style="font-family: sans-serif; padding: 40px; background: #050507; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #FF2D55;">🚀 Course Explorer Backend</h1>
      <p>Server is live and synchronized with MongoDB.</p>
      <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; margin-top: 24px; border: 1px solid rgba(255,255,255,0.1);">
        <p><strong>DB Status:</strong> ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}</p>
        <p><strong>Stats Cache:</strong> ${cachedProgressData ? '✅ Ready' : '⏳ Initializing...'}</p>
      </div>
    </div>
  `);
});

// 6. GET /api/progress
async function calculateProgress() {
  if (isCalculatingProgress) return;
  isCalculatingProgress = true;
  try {
    const collections = {
        'upsc': 'Govt Exams Track',
        'ssc': 'Govt Exams Track',
        'railways': 'Govt Exams Track',
        'defence': 'Govt Exams Track',
        'upsc_ese': 'Govt Exams Track',
        'upsc_cms': 'Govt Exams Track',
        'upsc_capf_ac': 'Govt Exams Track',
        'upsc_nda': 'Govt Exams Track',
        'state_psc_state_exams': 'Govt Exams Track',
        'central_police': 'Govt Exams Track',
        'teaching': 'Govt Exams Track',
        'judiciary': 'Govt Exams Track',
        'healthcare': 'Govt Exams Track',
        'psu': 'Govt Exams Track',
        'technical': 'Govt Exams Track',
        'defence_afcad': 'Govt Exams Track',
        'state_generic': 'Govt Exams Track',
        'indian_army_agniveer': 'Govt Exams Track',
        'indian_navy_ssr': 'Govt Exams Track',
        'coast_guard': 'Govt Exams Track',
        'territorial_army_officer': 'Govt Exams Track',
        'upsc_cse': 'Govt Exams Track',
        'combined_geo_scientist': 'Govt Exams Track',
        'epfo_enforcement_officer': 'Govt Exams Track',
        'upsc_cds': 'Govt Exams Track',
        'upsc_ifos': 'Govt Exams Track',
        'upsc_ies': 'Govt Exams Track',
        'bank_exams': 'Banking Track',
        'ibps_po': 'Banking Track',
        'ibps_clerk': 'Banking Track',
        'ibps_rrb_po': 'Banking Track',
        'ibps_rrb_clerk': 'Banking Track',
        'ibps_so': 'Banking Track',
        'sbi_po': 'Banking Track',
        'sbi_clerk': 'Banking Track',
        'insurance': 'Banking Track',
        'jee_advance': 'JEE / NEET Track',
        'jee_main': 'JEE / NEET Track',
        'neet_mds': 'JEE / NEET Track',
        'neet_pg': 'JEE / NEET Track',
        'neet_ss': 'JEE / NEET Track',
        'neet_ug': 'JEE / NEET Track',
        'coding_problems': 'Tech Track'
    };

    const topicYearRangeMap = {};
    const allTopicDocs = await Topic.find({ 
        track_name: { $ne: 'Tech Track' }
    }, { exam_name: 1, year_range: 1, not_conducted: 1 }).lean(); 
    allTopicDocs.forEach(doc => {
        const eName = doc.exam_name ? doc.exam_name.toString().trim() : null;
        if (eName && doc.year_range) {
            const rangeStr = doc.year_range.toString();
            const segments = rangeStr.split(',');
            let totalSpan = 0;
            segments.forEach(seg => {
                const parts = seg.match(/(\d{4})/g);
                if (parts && parts.length >= 2) {
                    const a = parseInt(parts[0]);
                    const b = parseInt(parts[1]);
                    totalSpan += Math.abs(a - b) + 1;
                } else if (parts && parts.length === 1) {
                    totalSpan += 1;
                }
            });

            if (doc.not_conducted && doc.not_conducted.toString().trim().length > 0) {
                const notHeldCount = doc.not_conducted.toString().split(',').map(y => y.trim()).filter(y => y.length === 4 && !isNaN(y)).length;
                totalSpan = Math.max(1, totalSpan - notHeldCount);
            }

            if (totalSpan > 0) {
                topicYearRangeMap[eName] = totalSpan;
            }
        }
    });

    const grandTotalTarget = Object.values(topicYearRangeMap).reduce((sum, s) => sum + s, 0);

    let metric = {
        totalUpdatedYears: 0,
        targetYears: grandTotalTarget, 
        totalQuestions: 0,
        totalExams: 0,
        totalTopics: 0,
        minYear: 2100,
        maxYear: 0,
        tracks: {
            "Govt Exams Track": { updated: 0, target: 0, questions: 0, exams: 0 },
            "Banking Track": { updated: 0, target: 0, questions: 0, exams: 0 },
            "JEE / NEET Track": { updated: 0, target: 0, questions: 0, exams: 0 },
            "Tech Track": { updated: 0, target: 0, questions: 0, exams: 0 }
        },
        exams: {},
        examTargets: {},
        examQuestionCounts: {},
        completedPerTrack: {},
        pendingPerTrack:   {}
    };

    const totalRoadmapExams = await Topic.countDocuments(); 
    metric.totalExams = totalRoadmapExams;
    metric.totalTopics = totalRoadmapExams;

    metric.tracks["Tech Track"].target = 5000; 
    metric.tracks["Tech Track"].updated = 0;   
    
    metric.tracks["Govt Exams Track"].exams = await Topic.countDocuments({ track_name: 'Govt Exams Track' });
    metric.tracks["Banking Track"].exams = await Topic.countDocuments({ track_name: 'Banking Track' });
    metric.tracks["JEE / NEET Track"].exams = await Topic.countDocuments({ track_name: 'JEE / NEET Track' });
    metric.tracks["Tech Track"].exams = await Topic.countDocuments({ track_name: 'Tech Track' });

    for (const [col, trackTitle] of Object.entries(collections)) {
      const Model = getQuestionModel(col);
      const totalQInCol = await Model.countDocuments();
      metric.tracks[trackTitle].questions = (metric.tracks[trackTitle].questions || 0) + totalQInCol;
      metric.totalQuestions += totalQInCol;
      
      if (trackTitle === "Tech Track") {
          metric.tracks[trackTitle].updated = totalQInCol;
      }
      
      const years = (await Model.distinct("year")).filter(y => y && !isNaN(y));
      years.forEach(y => {
        const yr = parseInt(y);
        if (yr < metric.minYear) metric.minYear = yr;
        if (yr > metric.maxYear) metric.maxYear = yr;
      });
      
      const singleExamOverrides = {
        'jee_main': 'JEE Main',
        'jee_advance': 'JEE Advanced',
        'neet_ug': 'NEET UG',
        'neet_pg': 'NEET PG',
        'neet_ss': 'NEET SS',
        'neet_mds': 'NEET MDS',
        'upsc_cms': 'Combined Medical Services (CMS)',
        'upsc_capf_ac': 'Central Armed Police Forces (Assistant Commandant - CAPF AC)',
        'upsc_nda': 'National Defence Academy (NDA) & NA',
        'ibps_rrb_po': 'IBPS RRB Officer Scale I (PO)',
        'ibps_rrb_clerk': 'IBPS RRB Office Assistant (Clerk)',
        'ibps_so': 'IBPS Specialist Officer (SO)',
        'sbi_clerk': 'SBI Clerk',
        'sbi_po': 'SBI PO',
        'ibps_clerk': 'IBPS Clerk',
        'ibps_po': 'IBPS PO',
        'upsc_ese': 'Engineering Services Examination (ESE/IES)',
        'indian_army_agniveer': 'Indian Army Agniveer',
        'indian_navy_ssr': 'Indian Navy SSR',
        'coast_guard': 'Coast Guard Navik / Yantrik',
        'territorial_army_officer': 'Territorial Army Officer',
        'upsc_cse': 'Civil Services Examination (CSE)',
        'combined_geo_scientist': 'Combined Geo-Scientist Examination',
        'epfo_enforcement_officer': 'EPFO Enforcement Officer/Accounts Officer',
        'upsc_cds': 'Combined Defence Services (CDS)',
        'upsc_ifos': 'Indian Forest Service (IFoS)',
        'upsc_ies': 'Indian Economic Service / Indian Statistical Service (IES/ISS)'
      };

      if (singleExamOverrides[col]) {
          const examLabel = singleExamOverrides[col];
          const years = (await Model.distinct("year")).filter(y => y && String(y).trim() !== "");
          const count = years.length;
          const examTarget = topicYearRangeMap[examLabel] || 15;
          metric.exams[examLabel] = count;
          metric.examTargets[examLabel] = examTarget;
          metric.examQuestionCounts[examLabel] = totalQInCol;
          metric.tracks[trackTitle].updated += count;
          metric.tracks[trackTitle].target += examTarget;
           metric.totalUpdatedYears += count;
           const examPct = examTarget > 0 ? (count / examTarget) * 100 : 0;
           if (examPct >= 80) {
               metric.completedPerTrack[trackTitle] = (metric.completedPerTrack[trackTitle] || 0) + 1;
           }
      } else {
          const aggr = await Model.aggregate([
              { $group: { _id: { exam_name: { $ifNull: ["$exam_type", "$exam"] }, year: "$year" } } },
              { $group: { _id: "$_id.exam_name", updated_years: { $sum: 1 } } }
          ]);
          
          aggr.forEach(item => {
              if (item._id) {
                  const examTarget = topicYearRangeMap[item._id] || 15;
                  metric.exams[item._id] = item.updated_years;
                  metric.examTargets[item._id] = examTarget;
                  metric.tracks[trackTitle].updated += item.updated_years;
                  metric.tracks[trackTitle].target += examTarget;
                  metric.totalUpdatedYears += item.updated_years;
                  const examPct = examTarget > 0 ? (item.updated_years / examTarget) * 100 : 0;
                  if (examPct >= 80) {
                      metric.completedPerTrack[trackTitle] = (metric.completedPerTrack[trackTitle] || 0) + 1;
                  }
              }
          });

          const qAggr = await Model.aggregate([
            { $group: { _id: { $ifNull: ["$exam_type", "$exam"] }, count: { $sum: 1 } } }
          ]);
          qAggr.forEach(item => {
            if (item._id) metric.examQuestionCounts[item._id] = item.count;
          });

          if (col === 'coding_problems') {
              const techTopicsDocs = await Topic.find({ track_name: 'Tech Track' });
              
              const getSearchTags = (name) => {
                  if (!name) return [];
                  const base = name.toLowerCase().replace(/ \/ /g, '-').replace(/\s+/g, '-').replace(/[()]/g, '');
                  const tags = [name, base];
                  if (base === 'arrays') tags.push('array');
                  if (base === 'strings') tags.push('string');
                  if (base === 'trees') tags.push('tree', 'binary-tree');
                  if (base === 'hashing') tags.push('hash-table');
                  if (base === 'graphs') tags.push('graph');
                  if (base === 'linked-lists') tags.push('linked-list');
                  if (base === 'greedy-algorithms') tags.push('greedy');
                  if (base === 'binary-search-trees-bst') tags.push('bst', 'binary-search-tree');
                  if (base === 'heap-priority-queue') tags.push('heap', 'priority-queue');
                  if (base === 'dynamic-programming') tags.push('dynamic programming');
                  return [...new Set(tags)];
              };

              for (const t of techTopicsDocs) {
                  if (t.exam_name) {
                      const searchTags = getSearchTags(t.exam_name);
                      if (t.sub_topic && Array.isArray(t.sub_topic)) {
                          t.sub_topic.forEach(st => {
                               searchTags.push(...getSearchTags(st));
                          });
                      }

                      const c = await Model.countDocuments({ 
                          $or: [
                              { topics: { $in: searchTags } }, 
                              { topic: { $in: searchTags } },
                              { role: { $in: searchTags } },
                              { topics_normalized: { $in: searchTags } },
                              { sub_topic: { $in: searchTags } }
                          ] 
                      });
                      metric.exams[t.exam_name] = c; 
                      metric.examQuestionCounts[t.exam_name] = c;
                      
                      // Tech Track: 200+ questions per topic for completion
                      if (c >= 200) {
                          metric.completedPerTrack['Tech Track'] = (metric.completedPerTrack['Tech Track'] || 0) + 1;
                      }
                  }
              }
          }
          
          if (col === 'bank_exams') {
              const bGroups = ["SBI PO", "SBI Clerk", "IBPS PO", "IBPS Clerk", "IBPS RRB Officer Scale I (PO)", "IBPS RRB Office Assistant (Clerk)", "IBPS Specialist Officer (SO)"];
              bGroups.forEach(g => {
                const base = g.split(' ')[0]; // SBI or IBPS
                metric.exams[g] = metric.exams[base] || 0;
                metric.examQuestionCounts[g] = metric.examQuestionCounts[base] || 0;
              });
          }
      }
    }

    const perTrackGrandTarget = { "Govt Exams Track": 0, "Banking Track": 0, "JEE / NEET Track": 0 };
    const allNonTechTopics = await Topic.find(
      { track_name: { $ne: 'Tech Track' }, year_range: { $ne: '' } },
      { track_name: 1, exam_name: 1, year_range: 1 }
    ).lean();
    allNonTechTopics.forEach(doc => {
      if (doc.track_name && doc.year_range && perTrackGrandTarget.hasOwnProperty(doc.track_name)) {
        const span = topicYearRangeMap[doc.exam_name] || 0;
        perTrackGrandTarget[doc.track_name] += span;
      }
    });

    for (const [trackName, grandTarget] of Object.entries(perTrackGrandTarget)) {
      if (grandTarget > 0) metric.tracks[trackName].target = grandTarget;
    }

    // 🚀 NEW: Dynamic Track Summary for Table View
    metric.trackSummary = Object.entries(metric.tracks).map(([name, data]) => {
        const raw = data.updated || 0;
        const target = data.target || 0;
        const need = Math.max(0, target - raw);
        const exams = data.exams || 0;
        
        // Completion heuristic: Use the sync ratio to estimate "Completed" milestones
        const completed = Math.round((raw / (target || 1)) * (name === "Tech Track" ? 1 : 5)); 

        return {
            name: name.replace(" Track", ""),
            totalExams: exams,
            raw: raw,
            need: need,
            completed: completed
        };
    });

    // Finalize pending counts: Total Exams - Completed Exams
    for (const trackName of Object.keys(metric.tracks)) {
        const total = metric.tracks[trackName].exams || 0;
        const done = metric.completedPerTrack[trackName] || 0;
        metric.pendingPerTrack[trackName] = Math.max(0, total - done);
    }

    metric.totalQuestions = Math.round(metric.totalQuestions);
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
    // Check if a calculation is already running to avoid overlaps
    if (isCalculatingProgress) {
        return res.status(200).json({ 
            success: true, 
            message: "⚠️ Sync is already in progress locally. Cron triggered acknowledgment.",
            time: new Date()
        });
    }

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
