require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

// ── TOPIC SCHEMA ──
const topicSchema = new mongoose.Schema({
  track_name: String,      // "JEE / NEET Track", etc.
  category: String,        // "JEE — Joint Entrance Examination", etc.
  exam_name: String,       // "JEE Main", etc.
  conducting_body: String,
  level: String,
  eligibility: String,
  frequency: String,
  question_count: String,
  year_range: String
}, { collection: 'topics' }); // Specifically targeting the 'topics' collection (lowercase)

const Topic = mongoose.model('Topic', topicSchema);

async function seedTopics() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB for topic seeding...");

    const files = [
      'Govt Exams Track.json',
      'Banking Track.json',
      'JEE NEET Track.json',
      'tech track.json'
    ];

    let allTopics = [];

    files.forEach(file => {
      const filePath = path.join(__dirname, '..', 'data', file);
      if (fs.existsSync(filePath)) {
        let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Filter out header rows that snuck into the JSON
        data = data.filter(item => 
          item["Track Name"] && 
          item["Track Name"] !== "Track Name" &&
          item["Category"] !== "Category"
        );

        const normalized = data.map(item => ({
          track_name: item["Track Name"],
          category: item["Category"],
          exam_name: item["Exam Name"] || item["Topics and Domain Covered"],
          conducting_body: item["Conducting Body"],
          level: item["Level"],
          eligibility: item["Eligibility"] || item["Sub-Domain"],
          frequency: item["Frequency"],
          question_count: item["Question Count"],
          year_range: item["Year"]
        }));
        allTopics = [...allTopics, ...normalized];
      }
    });

    // Clear existing
    console.log("🧹 Clearing existing data in 'Topic' collection...");
    await Topic.deleteMany({});

    // Bulk insert
    console.log(`🌱 Inserting ${allTopics.length} topics into DB...`);
    await Topic.insertMany(allTopics);

    console.log("✨ Seeding complete! Topics are now in your Atlas database.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed Error:", err);
    process.exit(1);
  }
}

seedTopics();
