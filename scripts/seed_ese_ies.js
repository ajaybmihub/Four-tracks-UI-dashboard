const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const COLLECTION_NAME = 'engineering_services_examination_(ESE/IES)';

const files = [
    'Engineering_Services_Examination_ESE-IES_2017.json',
    'Engineering_Services_Examination_ESE-IES_2018.json',
    'Engineering_Services_Examination_ESE-IES_2019.json',
    'Engineering_Services_Examination_ESE-IES_2020.json',
    'Engineering_Services_Examination_ESE-IES_2021.json',
    'Engineering_Services_Examination_ESE-IES_2022.json',
    'Engineering_Services_Examination_ESE-IES_2023.json',
    'Engineering_Services_Examination_ESE-IES_2024.json',
    'Engineering_Services_Examination_ESE-IES_2025.json'
];

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection(COLLECTION_NAME);

        let totalAdded = 0;

        for (const fileName of files) {
            const filePath = path.join(__dirname, '..', fileName);
            if (!fs.existsSync(filePath)) {
                console.log(`File not found: ${fileName}`);
                continue;
            }

            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const cleanedData = rawData.map(item => {
                const { _id, ...rest } = item;
                return {
                    ...rest,
                    exam_type: 'Engineering Services Examination (ESE/IES)',
                    year: String(rest.year)
                };
            });

            const result = await collection.insertMany(cleanedData);
            console.log(`Added ${result.insertedCount} records from ${fileName}`);
            totalAdded += result.insertedCount;
        }

        console.log(`\nTotal records added to collection "${COLLECTION_NAME}": ${totalAdded}`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seedData();
