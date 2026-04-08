const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/goverment_qb';
const DATA_ROOT = path.join(__dirname, '../data/UPSC');

const questionSchema = new mongoose.Schema({
  exam_type: String,
  subject: String,
  topic: String,
  subtopic: String,
  question: String,
  option: Object,
  answer: String,
  explanation: String,
  year: String,
  pdf_name: String
}, { strict: false });

async function seedFolder(dir, collectionName, examType) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} files in ${dir} (Collection: ${collectionName})`);

    const Model = mongoose.models[collectionName] || mongoose.model(collectionName, questionSchema, collectionName);

    for (const fileName of files) {
        const year = fileName.replace('.json', '');
        console.log(`Seeding ${fileName} (Year: ${year})...`);
        
        const filePath = path.join(dir, fileName);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const cleanedData = data.map(item => {
            const { _id, ...rest } = item;
            rest.year = rest.year || year;
            rest.exam_type = rest.exam_type || examType;
            return rest;
        });

        await Model.insertMany(cleanedData, { ordered: false }).catch(err => {
            console.warn(`Skipped some records in ${fileName} (likely duplicates)`);
        });
    }
}

async function start() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        // Seed CAPF AC
        await seedFolder(path.join(DATA_ROOT, 'CAPF_AC'), 'upsc_capf_ac', 'UPSC CAPF AC');
        
        // Seed CMS
        await seedFolder(path.join(DATA_ROOT, 'CMS'), 'upsc_cms', 'UPSC CMS');

        // Seed NDA
        await seedFolder(path.join(DATA_ROOT, 'NDA'), 'upsc_nda', 'National Defence Academy (NDA) & NA');

        console.log('Seeding finished.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

start();
