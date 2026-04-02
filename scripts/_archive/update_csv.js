const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

// ── SCHEMAS ──
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

const questionSchema = new mongoose.Schema({
  department: String,
  exam_type: String,
  subject: String,
  topic: String,
  subtopic: String,
  difficulty: String,
  question: String,
  option: { A: String, B: String, C: String, D: String, E: String },
  answer: String,
  explanation: String,
  level: String,
  eligibility: String,
  year: String,
  pdf_name: String
});

const models = {};
function getQuestionModel(collectionName) {
  if (!models[collectionName]) {
    models[collectionName] = mongoose.model(collectionName, questionSchema, collectionName);
  }
  return models[collectionName];
}

function mapToCollection(dept) {
    if (!dept) return "topics"; 
    const d = dept.toLowerCase();
    
    // Exact/Specific matches for UPSC sub-exams
    if (d.includes("medical services") || d.includes("cms")) return "upse_cms";
    if (d.includes("upsc") || d.includes("civil services") || d.includes("cse") || d.includes("forest service") || d.includes("ifos") || d.includes("engineering services") || d.includes("ese") || d.includes("ies") || d.includes("defence service") || d.includes("cds") || d.includes("defence academy") || d.includes("nda") || d.includes("economic service") || d.includes("epfo") || d.includes("central armed police forces") || d.includes("capf") || d.includes("geo-scientist")) return "upsc";
    
    // Railways / RRB
    if (d.includes("railway") || d.includes("rrb") || d.includes("ntpc") || d.includes("group d") || d.includes("alp") || d.includes("rpf")) return "railways";
    
    // Banking / PSUs
    if (d.includes("bank") || d.includes("sbi") || d.includes("ibps") || d.includes("rbi") || d.includes("pnb") || d.includes("canara") || d.includes("hdfc") || d.includes("bob") || d.includes("axis") || d.includes("icici") || d.includes("idbi") || d.includes("indian bank") || d.includes("central bank") || d.includes("union bank") || d.includes("corporation bank") || d.includes("dena bank") || d.includes("vijaya bank") || d.includes("syndicate bank") || d.includes("oriental bank") || d.includes("idfc") || d.includes("yes bank") || d.includes("kotak")) return "bank_exams";
    
    // Medical
    if (d.includes("neet mds")) return "neet_mds";
    if (d.includes("neet ss")) return "neet_ss";
    if (d.includes("neet pg")) return "neet_pg";
    if (d.includes("neet")) return "neet_ug";
    
    // Defence
    if (d.includes("afcat") || d.includes("defence_afcad") || d.includes("afcad")) return "defence_afcad";
    
    // JEE sub-variants
    if (d.includes("jee advance")) return "jee_advance";
    if (d.includes("jee main") || d.includes("jee")) return "jee_main";

    return "topics"; 
}

function parseRow(line) {
    const result = [];
    let cell = "";
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') { cell += '"'; i++; }
        else if (char === '"') { insideQuotes = !insideQuotes; }
        else if (char === ',' && !insideQuotes) { result.push(cell.trim()); cell = ""; }
        else { cell += char; }
    }
    result.push(cell.trim());
    return result;
}

function stringifyRow(cells) {
    return cells.map(cell => {
        let str = String(cell || "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.trim() !== str) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }).join(",");
}

const csvFiles = [
    { name: 'Copy of Entire India Govt Exams - Banking Track.csv', track: 'Banking Track' },
    { name: 'Copy of Entire India Govt Exams - Govt Exams Track.csv', track: 'Govt Exams Track' },
    { name: 'Copy of Entire India Govt Exams - JEE _ NEET Track.csv', track: 'JEE / NEET Track' },
    { name: 'Copy of Entire India Govt Exams - Tech Track.csv', track: 'Tech Track' }
];

async function updateCSVs() {
    try {
        await mongoose.connect(MONGO_URI);
        const allTopics = await Topic.find({});

        for (const csvInfo of csvFiles) {
            const filePath = path.join(__dirname, '..', 'data', csvInfo.name);
            if (!fs.existsSync(filePath)) {
                console.log(`File not found: ${csvInfo.name}`);
                continue;
            }

            console.log(`\nProcessing ${csvInfo.name}...`);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/).filter(l => l.trim() !== "");
            if (lines.length === 0) continue;

            let header = parseRow(lines[0]);
            
            // Check and add missing columns if needed
            const requiredColumns = ["Question Count", "Completed Years", "Pending Years", "Status"];
            let headerChanged = false;
            requiredColumns.forEach(col => {
                if (header.indexOf(col) === -1) {
                    header.push(col);
                    headerChanged = true;
                }
            });

            const questIdx = header.indexOf("Question Count");
            const compYIdx = header.indexOf("Completed Years");
            const pendYIdx = header.indexOf("Pending Years");
            const statusIdx = header.indexOf("Status");
            const examIdx = header.indexOf("Exam Name");
            const catIdx = header.indexOf("Category");
            const techExamIdx = header.indexOf("Topics and Domain Covered");
            const subDomainIdx = header.indexOf("Sub-Domain");

            const updatedLines = [stringifyRow(header)];

            for (let i = 1; i < lines.length; i++) {
                try {
                    const cells = parseRow(lines[i]);
                    // Pad cells if header was extended
                    while (cells.length < header.length) cells.push("");

                    let exam = examIdx !== -1 ? cells[examIdx] : "";
                    let category = catIdx !== -1 ? cells[catIdx] : "";
                    let techExam = techExamIdx !== -1 ? cells[techExamIdx] : "";
                    let subDomain = subDomainIdx !== -1 ? cells[subDomainIdx] : "";

                    const effectiveExam = exam || techExam || category;

                    const topic = allTopics.find(t => 
                        (t.exam_name === effectiveExam || t.category === category) && 
                        t.track_name === csvInfo.track
                    );

                    const collectionName = mapToCollection(category || effectiveExam);
                    const Model = getQuestionModel(collectionName);
                    
                    let foundYears = [];
                    let totalQuestions = 0;

                    const dedicated = ["jee_main", "jee_advance", "neet_ug", "neet_pg"];
                    if (dedicated.includes(collectionName)) {
                        totalQuestions = await Model.countDocuments({});
                        foundYears = (await Model.distinct("year")).filter(y => y && String(y).trim() !== "");
                    } else if (collectionName === "topics") {
                        // For Tech Track or entries without a specific collection
                        totalQuestions = 0;
                        foundYears = [];
                    } else {
                        const filter = {
                            $or: [
                                { exam_type: effectiveExam },
                                { exam: effectiveExam },
                                { category: effectiveExam },
                                { department: effectiveExam },
                                { exam_type: category },
                                { exam: category }
                            ]
                        };
                        
                        // Tech Track specific filtering by subtopic/topic if available
                        if (csvInfo.track === "Tech Track") {
                            filter.$or.push({ topic: effectiveExam });
                            if (subDomain && subDomain !== "NO Sub-Domain") {
                                filter.$or.push({ subtopic: subDomain });
                            }
                        }

                        if (collectionName === "bank_exams" && effectiveExam) {
                            filter.$or.push({ exam_type: { $regex: effectiveExam.split(' ')[0], $options: 'i' } });
                        }
                        
                        totalQuestions = await Model.countDocuments(filter);
                        foundYears = (await Model.distinct("year", filter)).filter(y => y && String(y).trim() !== "");
                    }

                    let pendingYears = [];
                    if (topic && topic.year_range) {
                        const match = topic.year_range.match(/(\d{4})\s*-\s*(\d{4})/);
                        if (match) {
                            const start = Math.min(parseInt(match[1]), parseInt(match[2]));
                            const end = Math.max(parseInt(match[1]), parseInt(match[2]));
                            for (let y = start; y <= end; y++) {
                                if (!foundYears.map(fy => String(fy)).includes(String(y))) {
                                    pendingYears.push(String(y));
                                }
                            }
                        }
                    }

                    cells[questIdx] = totalQuestions.toLocaleString();
                    cells[compYIdx] = foundYears.sort((a,b) => b-a).join(", ") || "N/A";
                    cells[pendYIdx] = pendingYears.sort((a,b) => b-a).join(", ") || (csvInfo.track === "Tech Track" ? "N/A" : "");
                    
                    const totalTarget = topic && topic.year_range && topic.year_range.match(/(\d{4})\s*-\s*(\d{4})/) ? 
                        (Math.abs(parseInt(topic.year_range.match(/(\d{4})/)[0]) - parseInt(topic.year_range.match(/-\s*(\d{4})/)[1])) + 1) : 0;
                    
                    if (totalQuestions > 0) {
                       if (totalTarget > 0) {
                           const perc = ((foundYears.length / totalTarget) * 100).toFixed(1);
                           cells[statusIdx] = perc + "% Synced";
                       } else {
                           cells[statusIdx] = "Synced (" + totalQuestions + ")";
                       }
                    } else {
                       cells[statusIdx] = "Not Started";
                    }

                    updatedLines.push(stringifyRow(cells));
                } catch (rowErr) {
                    console.error(`Error processing row ${i} in ${csvInfo.name}:`, rowErr.message);
                    updatedLines.push(lines[i]);
                }
            }

            fs.writeFileSync(filePath, updatedLines.join('\n') + '\n', 'utf8');
            console.log(`Finished ${csvInfo.name}.`);
        }

        console.log("\nAll CSVs updated!");
        process.exit(0);
    } catch (err) {
        console.error("Critical Error:", err);
        process.exit(1);
    }
}

updateCSVs();
