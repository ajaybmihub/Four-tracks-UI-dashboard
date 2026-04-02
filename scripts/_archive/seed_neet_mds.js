const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";
const COLLECTION_NAME = "neet_mds";
const FILES = [
    'neet_mds_2019.json',
    'neet_mds_2021.json',
    'neet_mds_2022.json',
    'neet_mds_2023.json',
    'neet_mds_2024.json',
    'neet_mds_2025.json'
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

            // Clean data: Standardize exam_type, year and normalize options
            const cleanedQuestions = questions.map(q => {
                const newQ = { ...q };
                if (newQ._id) delete newQ._id; // Let MongoDB generate its own IDs
                
                // Ensure year is stored as string
                newQ.year = String(newQ.year);
                newQ.exam_type = "NEET MDS"; 

                // Normalize options from 1,2,3,4 to A,B,C,D if necessary
                if (newQ.option) {
                    const keys = Object.keys(newQ.option);
                    if (keys.includes("1") && keys.includes("4")) {
                        const newOptions = {
                            "A": newQ.option["1"],
                            "B": newQ.option["2"],
                            "C": newQ.option["3"],
                            "D": newQ.option["4"]
                        };
                        newQ.option = newOptions;

                        // Also update answer if it's "1" through "4"
                        if (newQ.answer === "1") newQ.answer = "A";
                        else if (newQ.answer === "2") newQ.answer = "B";
                        else if (newQ.answer === "3") newQ.answer = "C";
                        else if (newQ.answer === "4") newQ.answer = "D";
                    }
                }
                
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
        
        // Find if NEET MDS exists (smart check for name variations)
        const existingTopic = await topicsCol.findOne({ exam_name: "NEET MDS" });
        if (existingTopic) {
             const allYears = await collection.distinct("year");
             const numericYears = allYears.map(Number).filter(y => !isNaN(y));
             const minYear = Math.min(...numericYears);
             const maxYear = Math.max(...numericYears);
             const count = await collection.countDocuments({ exam_type: "NEET MDS" });

             await topicsCol.updateOne(
                 { _id: existingTopic._id },
                 {
                     $set: {
                         year_range: `${minYear}-${maxYear}`,
                         question_count: String(count)
                     }
                 }
             );
             console.log(`✅ Updated topics record for NEET MDS (Years: ${minYear}-${maxYear}, Count: ${count})`);
        } else {
            console.log("⚠️  No topic record found for 'NEET MDS' in 'topics' collection.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Fatal Error during seeding:", err);
        process.exit(1);
    }
}

seed();
