const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DATA_DIR = path.join(__dirname, '..', 'banking json');

const collectionMap = {
    'ibps_clerk': 'ibps_clerk',
    'ibps_po': 'ibps_po',
    'ibps_rrb_office_assistant_clerk': 'ibps_rrb_clerk',
    'ibps_rrb_officer_scale_i_po': 'ibps_rrb_po',
    'sbi_clerk': 'sbi_clerk',
    'sbi_po': 'sbi_po'
};

const examTypeNormalization = {
    'ibps_rrb_clerk': 'IBPS RRB Office Assistant (Clerk)',
    'ibps_rrb_po': 'IBPS RRB Officer Scale I (PO)',
    'ibps_clerk': 'IBPS Clerk',
    'ibps_po': 'IBPS PO',
    'sbi_clerk': 'SBI Clerk',
    'sbi_po': 'SBI PO'
};

async function reseed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = Object.values(collectionMap);
        
        for (const col of collections) {
            console.log(`Dropping collection ${col}...`);
            try {
                await db.collection(col).drop();
            } catch (e) {
                console.log(`Collection ${col} not found or already dropped`);
            }
        }

        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        const stats = {};

        for (const file of files) {
            const match = file.replace(/(_\d{4})?\.json$/, '');
            const targetCol = collectionMap[match];
            if (!targetCol) continue;

            console.log(`Processing ${file} -> ${targetCol}`);
            const rawData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

            const cleanedData = rawData.map(item => {
                const { _id, ...rest } = item;
                return {
                    ...rest,
                    exam_type: examTypeNormalization[targetCol] || rest.exam_type,
                    year: String(rest.year || file.match(/\d{4}/)?.[0] || "Unknown")
                };
            });

            const schema = new mongoose.Schema({ any: {} }, { strict: false, collection: targetCol });
            const Model = mongoose.models[targetCol] || mongoose.model(targetCol, schema);
            await Model.insertMany(cleanedData);
            stats[targetCol] = (stats[targetCol] || 0) + cleanedData.length;
        }

        console.log('Reseeding complete!', stats);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reseed();
