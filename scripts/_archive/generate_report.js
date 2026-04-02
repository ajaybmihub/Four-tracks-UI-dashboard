const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

// Models
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

async function generateReport() {
    try {
        await mongoose.connect(MONGO_URI);
        const allTopics = await Topic.find({});

        const completed = [];
        const inProgress = [];
        const notStarted = [];

        for (const topic of allTopics) {
            const collectionName = mapToCollection(topic.category || topic.exam_name);
            const Model = getQuestionModel(collectionName);
            
            let count = 0;
            const dedicated = ["jee_main", "jee_advance", "neet_ug", "neet_pg"];
            
            if (dedicated.includes(collectionName)) {
                count = await Model.countDocuments({});
            } else {
                const exam = topic.exam_name || topic.category;
                const filter = {
                    $or: [
                        { exam_type: exam },
                        { exam: exam },
                        { category: exam }
                    ]
                };
                if (collectionName === "bank_exams" && exam) {
                    filter.$or.push({ exam_type: { $regex: exam.split(' ')[0], $options: 'i' } });
                }
                count = await Model.countDocuments(filter);
            }

            const targetCount = parseInt(topic.question_count.replace(/,/g, '')) || 0;
            const isFinished = count > 0 && (targetCount > 0 ? count >= targetCount : false);
            
            const info = {
                track: topic.track_name,
                exam: topic.exam_name,
                found: count,
                target: targetCount
            };

            if (isFinished) {
                completed.push(info);
            } else if (count > 0) {
                inProgress.push(info);
            } else {
                notStarted.push(info);
            }
        }

        let reportMd = `# Exam Tracking Report\n\n`;
        reportMd += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        reportMd += `## Summary\n\n`;
        reportMd += `| Status | Count |\n`;
        reportMd += `| :--- | :--- |\n`;
        reportMd += `| **Total Exams** | **${allTopics.length}** |\n`;
        reportMd += `| Completed (100%+) | ${completed.length} |\n`;
        reportMd += `| In Progress (>0 questions) | ${inProgress.length} |\n`;
        reportMd += `| Not Started (0 questions) | ${notStarted.length} |\n\n`;

        reportMd += `## Completed Exams List\n\n`;
        reportMd += `| Exam Name | Track | Questions Found | Target |\n`;
        reportMd += `| :--- | :--- | :--- | :--- |\n`;
        completed.forEach(c => {
            reportMd += `| ${c.exam} | ${c.track} | ${c.found.toLocaleString()} | ${c.target.toLocaleString()} |\n`;
        });

        reportMd += `\n## In-Progress Exams List\n\n`;
        reportMd += `| Exam Name | Track | Questions Found | Target |\n`;
        reportMd += `| :--- | :--- | :--- | :--- |\n`;
        inProgress.forEach(c => {
            reportMd += `| ${c.exam} | ${c.track} | ${c.found.toLocaleString()} | ${c.target.toLocaleString()} |\n`;
        });

        reportMd += `\n## Not Started Exams List (First 50)\n\n`;
        reportMd += `| Exam Name | Track | Target |\n`;
        reportMd += `| :--- | :--- | :--- |\n`;
        notStarted.slice(0, 50).forEach(nc => {
            reportMd += `| ${nc.exam} | ${nc.track} | ${nc.target.toLocaleString() || 'Unknown'} |\n`;
        });
        
        if (notStarted.length > 50) {
            reportMd += `\n*... and ${notStarted.length - 50} more not started exams.*\n`;
        }

        console.log(reportMd);
        process.exit(0);
    } catch (err) {
        console.error("Error generating report:", err);
        process.exit(1);
    }
}

generateReport();
