const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

const topicSchema = new mongoose.Schema({
    exam_id: String,
    exam_name: String,
    category: String,
    track_name: String, 
    year_range: String,
    not_conducted: String,
    paper_availability: String
}, { collection: 'topics', strict: false });

const Topic = mongoose.model('Topic', topicSchema);

const MAPPINGS = {
    "Engineering Services Examination (ESE / IES)": "Engineering Services Examination (ESE/IES)",
    "IBPS RRB Officer Scale I": "IBPS RRB Officer Scale I (PO)",
    "IBPS RRB Office Assistant": "IBPS RRB Office Assistant (Clerk)",
    "IBPS SO": "IBPS Specialist Officer (SO)"
};

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        const dataPath = path.join(__dirname, '..', 'exam_database_normalized.json');
        const normalizedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        console.log(`🧬 Processing ${normalizedData.length} records...`);

        for (const ex of normalizedData) {
            const dbName = MAPPINGS[ex.exam_name] || ex.exam_name;
            const cleanRange = ex.year_range.replace(/\u2013|\u2014/g, "-").trim();

            const updateData = {
                category: ex.category || "Other",
                year_range: cleanRange,
                not_conducted: ex.not_conducted || "",
                track_name: ex.track.includes("Track") ? ex.track : ex.track + " Track"
            };

            await Topic.updateOne(
                { exam_name: dbName },
                { $set: updateData },
                { upsert: true }
            );
        }

        console.log("🚀 Seeding completed!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed Error:", err.message);
        process.exit(1);
    }
}

seed();
