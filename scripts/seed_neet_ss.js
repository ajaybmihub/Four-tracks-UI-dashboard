const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";
const COLLECTION_NAME = "neet_ss";
const FILES = [
    'neet_ss_2022.json',
    'neet_ss_2023.json',
    'neet_ss_2024.json'
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        const db = mongoose.connection.db;
        const collection = db.collection(COLLECTION_NAME);

        let totalInserted = 0;

        for (const fileName of FILES) {
            const filePath = path.join(__dirname, '..', fileName);
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  File not found: ${fileName}. Skipping.`);
                continue;
            }

            console.log(`Reading ${fileName}...`);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const questions = JSON.parse(rawData);

            // Clean data: Standardize exam_type, year and remove $oid to avoid conflicts
            const cleanedQuestions = questions.map(q => {
                const newQ = { ...q };
                if (newQ._id) delete newQ._id; // Let MongoDB generate its own IDs
                
                // Ensure year is stored as string for consistency with dashboard
                newQ.year = String(newQ.year);
                newQ.exam_type = "NEET SS"; // Force standard name
                
                return newQ;
            });

            console.log(`Inserting ${cleanedQuestions.length} questions from ${fileName}...`);
            const result = await collection.insertMany(cleanedQuestions);
            totalInserted += result.insertedCount;
            console.log(`✅ Inserted ${result.insertedCount} questions from ${fileName}.`);
        }

        console.log(`\n🎉 SEEDING COMPLETE! Total inserted: ${totalInserted}`);

        // Update topic record in 'topics' collection
        console.log("Updating topic record...");
        const topicsCol = db.collection("topics");
        
        // Find if NEET SS exists
        const existingTopic = await topicsCol.findOne({ exam_name: "NEET SS" });
        if (existingTopic) {
             const allYears = await collection.distinct("year");
             const minYear = Math.min(...allYears.map(Number));
             const maxYear = Math.max(...allYears.map(Number));
             const count = await collection.countDocuments({ exam_type: "NEET SS" });

             await topicsCol.updateOne(
                 { _id: existingTopic._id },
                 {
                     $set: {
                         year_range: `${minYear}-${maxYear}`,
                         question_count: String(count)
                     }
                 }
             );
             console.log(`✅ Updated topics record for NEET SS (Years: ${minYear}-${maxYear}, Count: ${count})`);
        } else {
            console.log("⚠️  No topic record found for 'NEET SS' in 'topics' collection. You may need to create it manually.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Fatal Error during seeding:", err);
        process.exit(1);
    }
}

seed();
