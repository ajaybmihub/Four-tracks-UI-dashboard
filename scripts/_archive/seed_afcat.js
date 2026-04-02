const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

const questionSchema = new mongoose.Schema({
  exam_type: String,
  department: String,
  subject: String,
  topic: String,
  subtopic: String,
  difficulty: String,
  question: String,
  option: mongoose.Schema.Types.Mixed,
  answer: String,
  explanation: String,
  level: String,
  eligibility: String,
  year: String,
  pdf_name: String
}, { strict: false });

const AFCATQuestion = mongoose.model('AFCATQuestion', questionSchema, 'defence_afcad');

const filesToSeed = [
  'AFCAT - 2021.json',
  'AFCAT - 2022.json',
  'AFCAT - 2023.json',
  'AFCAT_-_2024.json'
];

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    for (const fileName of filesToSeed) {
      const filePath = path.join(__dirname, '..', fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${fileName}. Skipping.`);
        continue;
      }

      console.log(`Seeding ${fileName}...`);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);

      if (!Array.isArray(data)) {
        console.error(`${fileName} is not a valid JSON array. Skipping.`);
        continue;
      }

      // Optional: Check for duplicates before inserting
      // For now, we'll insert all but we could use updateOne with upsert if needed
      // To keep it simple and fast for a seed task:
      const result = await AFCATQuestion.insertMany(data, { ordered: false }).catch(err => {
          console.warn(`Some documents might have failed insertion in ${fileName}:`, err.message);
          return { insertedCount: data.length }; // Approximation
      });

      console.log(`Finished seeding ${fileName}.`);
    }

    console.log('\nAll files processed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Critical seeding error:', err);
    process.exit(1);
  }
}

seedData();
