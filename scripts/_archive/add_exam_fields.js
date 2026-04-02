const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');

// ── Only patch these tracks (Tech Track is intentionally excluded) ──
const ALLOWED_TRACKS = [
  'JEE / NEET Track',
  'Banking Track',
  'Govt Exams Track',
];

// ── Schema: strict:false so we can $set new fields onto existing docs ──
const Topic = mongoose.model('Topic', new mongoose.Schema({}, { collection: 'topics', strict: false }));

// ── Name mapping: normalized JSON name → DB exam_name ──
const MAPPINGS = {
  // UPSC
  "Engineering Services Examination (ESE / IES)": "Engineering Services Examination (ESE/IES)",
  "National Defence Academy & Naval Academy (NDA & NA)":  "National Defence Academy (NDA) & NA",
  "Central Armed Police Forces – Assistant Commandant (CAPF AC)": "Central Armed Police Forces (Assistant Commandant - CAPF AC)",
  "EPFO – Enforcement Officer / Accounts Officer": "EPFO Enforcement Officer/Accounts Officer",
  // SSC
  "Combined Graduate Level (CGL)":       "SSC Combined Graduate Level (CGL)",
  "Combined Higher Secondary Level (CHSL)": "SSC Combined Higher Secondary Level (CHSL)",
  "Multi Tasking Staff (MTS)":            "SSC Multi Tasking Staff (MTS)",
  "GD Constable":                         "SSC GD Constable",
  "Junior Engineer (JE)":                 "SSC Junior Engineer (JE)",
  "CPO – Sub-Inspector (SI) in Delhi Police / CAPFs": "SSC Sub Inspector (CPO)",
  "Stenographer Grade C & D":             "SSC Stenographer Grade C & D",
  "Selection Post (Phase-wise)":          "SSC Selection Post (Phase-wise)",
  // Railways
  "RRB NTPC (Non-Technical Popular Categories)": "RRB NTPC",
  "RRB JE (Junior Engineer)":             "RRB JE",
  "RRB Group D (Level 1 Posts)":          "RRB Group D",
  "RRB ALP (Assistant Loco Pilot)":       "RRB ALP",
  "RRB Technician (Grades 1 & 3)":        "RRB Technician",
  "RPF Constable":                        "RPF Constable",
  "RPF Sub-Inspector (SI)":              "RPF Sub-Inspector (SI)",
  // Defence
  "Indian Army Agniveer":                 "Indian Army Agniveer",
  "Coast Guard Navik / Yantrik":          "Coast Guard Navik / Yantrik",
  "Military Nursing Service (MNS)":       "Military Nursing Service (MNS)",
  // Banking
  "IBPS RRB Officer Scale I":             "IBPS RRB Officer Scale I (PO)",
  "IBPS RRB Office Assistant":            "IBPS RRB Office Assistant (Clerk)",
  "IBPS SO":                              "IBPS Specialist Officer (SO)",
  "RBI Grade B (DR – General)":           "RBI Grade B",
  "NABARD Grade A (RDBS – General)":      "NABARD Grade A",
  "NABARD Grade B (Manager)":             "NABARD Grade B",
  "SIDBI Grade A (Assistant Manager)":    "SIDBI Grade A",
  "EXIM Bank MT (Management Trainee)":    "EXIM Bank Recruitment",
  "EXIM Bank MT":                         "EXIM Bank Recruitment",
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.\n');

    const dataPath = path.join(__dirname, '..', 'exam_database_normalized.json');
    const normalizedExams = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    let updated = 0, skipped = 0, notFound = 0;

    for (const ex of normalizedExams) {
      const dbName = MAPPINGS[ex.exam_name] || ex.exam_name;

      // Find the topic — must belong to an allowed track
      const topic = await Topic.findOne({
        exam_name: dbName,
        track_name: { $in: ALLOWED_TRACKS }
      });

      if (!topic) {
        console.log(`⚠️  Not found (or Tech track): ${dbName}`);
        notFound++;
        continue;
      }

      // Build patch object — only the three new fields
      const patch = {
        year_range:        ex.year_range        || topic.year_range || '',
        not_conducted:     ex.not_conducted     || '',
        paper_availability: ex.paper_availability || '',
      };

      await Topic.updateOne({ _id: topic._id }, { $set: patch });
      console.log(`✅ Patched: ${dbName}`);
      updated++;
    }

    console.log(`\n── DONE ──`);
    console.log(`Updated : ${updated}`);
    console.log(`Not found: ${notFound}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
