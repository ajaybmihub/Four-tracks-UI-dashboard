const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const manualMapping = {
    'IBPS RRB Officer Scale I (PO)': 'ibps_rrb_po',
    'IBPS RRB Office Assistant (Clerk)': 'ibps_rrb_clerk',
    'SBI Clerk': 'sbi_clerk',
    'SBI PO': 'sbi_po',
    'IBPS Clerk': 'ibps_clerk',
    'IBPS PO': 'ibps_po',
    'IBPS Specialist Officer (SO)': 'ibps_rrb_so'
};

async function updateTopics() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const TopicSchema = new mongoose.Schema({ any: {} }, { strict: false, collection: 'topics' });
        const Topic = mongoose.models['topics'] || mongoose.model('topics', TopicSchema);

        const topics = await Topic.find({ track_name: 'Banking Track' });
        console.log(`Found ${topics.length} banking topics`);

        for (const t of topics) {
            const name = t.exam_name || t.topic;
            const targetCol = manualMapping[name];
            
            if (targetCol) {
                await Topic.updateOne({ _id: t._id }, { $set: { collection_name: targetCol } });
                console.log(`Updated mapping: ${name} -> ${targetCol}`);
            } else if (!name || name === '-') {
                console.log('Deleting invalid topic with name:', name);
                await Topic.deleteOne({ _id: t._id });
            }
        }

        console.log('All updates done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateTopics();
