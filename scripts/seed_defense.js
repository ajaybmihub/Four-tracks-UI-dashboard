const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";
const DATA_DIR = path.join(__dirname, '..', 'separated_exams');

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

const DefenceQuestion = mongoose.model('DefenceQuestion', questionSchema, 'defence');

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    if (!fs.existsSync(DATA_DIR)) {
      console.error(`Directory not found: ${DATA_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} files to seed.`);

    for (const fileName of files) {
      const filePath = path.join(DATA_DIR, fileName);
      console.log(`Seeding ${fileName}...`);
      
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);

      if (!Array.isArray(data)) {
        console.error(`${fileName} is not a valid JSON array. Skipping.`);
        continue;
      }

      // We remove _id to let MongoDB generate new ones or preserve if they are unique
      // Usually it's better to remove them if we are re-seeding to avoid duplicates if they were copied
      const cleanedData = data.map(item => {
          const { _id, ...rest } = item;
          return rest;
      });

      console.log(`Inserting ${cleanedData.length} records from ${fileName}...`);
      await DefenceQuestion.insertMany(cleanedData, { ordered: false }).catch(err => {
          console.warn(`Note: Some duplicates or errors in ${fileName} were skipped.`);
      });
      
      console.log(`Completed ${fileName}\n`);
    }

    console.log('All files processed.');
    process.exit(0);
  } catch (err) {
    console.error('Critical seeding error:', err);
    process.exit(1);
  }
}

seedData();
