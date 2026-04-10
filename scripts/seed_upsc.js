const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/goverment_qb';
const DATA_DIR = path.join(__dirname, '../separated_upsc');

const questionSchema = new mongoose.Schema({
  exam_type: String,
  department: String,
  subject: String,
  topic: String,
  subtopic: String,
  difficulty: String,
  question: String,
  option: Object,
  answer: String,
  explanation: String,
  level: String,
  eligibility: String,
  year: String,
  pdf_name: String
}, { strict: false });

// Helper to map collection based on filename or content
function getTargetCollection(fileName) {
  const d = fileName.toLowerCase();
  if (d.includes("engineering_services") || d.includes("ese") || d.includes("ies")) {
      return "upsc_ese";
  }
  if (d.includes("cds")) {
      return "upsc_cds";
  }
  if (d.includes("ifos") || d.includes("forest")) {
      return "upsc_ifos";
  }
  return "upsc";
}

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    if (!fs.existsSync(DATA_DIR)) {
      console.error(`Directory not found: ${DATA_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} files in separated_upsc to seed.`);

    for (const fileName of files) {
      const targetCol = getTargetCollection(fileName);
      console.log(`Seeding ${fileName} into collection: ${targetCol}...`);
      
      const filePath = path.join(DATA_DIR, fileName);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);

      if (!Array.isArray(data)) {
        console.error(`${fileName} is not a valid JSON array. Skipping.`);
        continue;
      }

      // Dynamic model
      const Model = mongoose.models[targetCol] || mongoose.model(targetCol, questionSchema, targetCol);

      // Clean data
      const cleanedData = data.map(item => {
          const { _id, ...rest } = item;
          if (rest.year) rest.year = String(rest.year);
          return rest;
      });

      console.log(`Inserting ${cleanedData.length} records...`);
      await Model.insertMany(cleanedData, { ordered: false }).catch(err => {
          console.warn(`Note: Some duplicates or errors in ${fileName} were skipped.`);
      });
      
      console.log(`Completed ${fileName}\n`);
    }

    console.log('UPSC seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Critical seeding error:', err);
    process.exit(1);
  }
}

seedData();
