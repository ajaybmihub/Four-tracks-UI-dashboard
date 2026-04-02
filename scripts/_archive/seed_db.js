require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

// ── SCHEMA ──
const questionSchema = new mongoose.Schema({
  exam: String,
  exam_stage: String,
  paper: String,
  year: Number,
  paper_id: String,
  pdf_name: String,
  subject: String,
  topic: String,
  subtopic: String,
  difficulty: String,
  level: String,
  eligibility: String,
  question: String,
  options: {
    A: String,
    B: String,
    C: String,
    D: String
  },
  answer: String,
  explanation: String
}, { collection: 'questions' });

const Question = mongoose.model('Question', questionSchema);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'questions.json'), 'utf8'));

    // Clear existing
    console.log("Clearing existing questions...");
    await Question.deleteMany({});

    // Insert new
    console.log(`Inserting ${data.length} questions...`);
    await Question.insertMany(data);

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
