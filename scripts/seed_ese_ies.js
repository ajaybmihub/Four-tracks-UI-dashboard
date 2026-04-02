const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";
const COLLECTION_NAME = 'engineering_services_examination_(ESE/IES)';

const files = [
    'Engineering_Services_Examination_ESE_IES_2017.json',
    'Engineering_Services_Examination_ESE_IES_2018.json',
    'Engineering_Services_Examination_ESE_IES_2019.json',
    'Engineering_Services_Examination_ESE_IES_2020.json',
    'Engineering_Services_Examination_ESE_IES_2021.json',
    'Engineering_Services_Examination_ESE_IES_2022.json'
];

async function seedData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection(COLLECTION_NAME);

        // Clear existing data to avoid duplicates
        console.log(`🧹 Clearing existing data in "${COLLECTION_NAME}"...`);
        await collection.deleteMany({});

        let totalAdded = 0;

        for (const fileName of files) {
            const filePath = path.join(__dirname, '..', 'separated_upsc', fileName);
            if (!fs.existsSync(filePath)) {
                console.log(`❌ File not found: ${fileName} at ${filePath}`);
                continue;
            }

            console.log(`Reading ${fileName}...`);
            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Normalize data if necessary
            const cleanedData = rawData.map(item => {
                const { _id, ...rest } = item;
                return {
                    ...rest,
                    exam_type: 'Engineering Services Examination (ESE/IES)',
                    year: String(rest.year)
                };
            });

            if (cleanedData.length === 0) {
                console.log(`⚠️ No records found in ${fileName}`);
                continue;
            }

            const result = await collection.insertMany(cleanedData);
            console.log(`+ Added ${result.insertedCount} records from ${fileName}`);
            totalAdded += result.insertedCount;
        }

        console.log(`\n✨ Total records seeded: ${totalAdded}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
}

seedData();
