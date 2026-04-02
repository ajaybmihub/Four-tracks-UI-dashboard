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

const topicDisplayNames = {
    'ibps_clerk': 'IBPS Clerk',
    'ibps_po': 'IBPS PO',
    'ibps_rrb_clerk': 'IBPS RRB Clerk',
    'ibps_rrb_po': 'IBPS RRB PO',
    'sbi_clerk': 'SBI Clerk',
    'sbi_po': 'SBI PO'
};

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        const stats = {};

        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Extract prefix by removing year and .json
            // e.g., ibps_clerk_2016.json -> ibps_clerk
            const match = file.match(/^(.*?)(?:_\d{4})?\.json$/);
            if (!match) continue;
            
            const prefix = match[1];
            const targetCol = collectionMap[prefix];
            
            if (!targetCol) {
                console.log(`Skipping unknown file prefix: ${prefix} (${file})`);
                continue;
            }

            console.log(`Seeding ${file} into ${targetCol}...`);
            
            const schema = new mongoose.Schema({ any: {} }, { strict: false, collection: targetCol });
            const Model = mongoose.models[targetCol] || mongoose.model(targetCol, schema);

            // Clean data
            const cleanedData = rawData.map(item => {
                const { _id, ...rest } = item;
                return {
                    ...rest,
                    year: String(rest.year || file.match(/\d{4}/)?.[0] || "Unknown")
                };
            });

            await Model.insertMany(cleanedData);
            stats[targetCol] = (stats[targetCol] || 0) + cleanedData.length;
        }

        console.log('Seeding summary:', stats);

        // Update topics collection for dashboard
        const TopicSchema = new mongoose.Schema({ any: {} }, { strict: false, collection: 'topics' });
        const Topic = mongoose.models['topics'] || mongoose.model('topics', TopicSchema);

        for (const [col, displayName] of Object.entries(topicDisplayNames)) {
            const exists = await Topic.findOne({ category: displayName });
            if (!exists) {
                await Topic.create({
                    category: displayName,
                    track_name: 'Banking Track',
                    order: 2,
                    total_years: 15,
                    year_range: "2010-2025"
                });
                console.log(`Created topic entry for ${displayName}`);
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
