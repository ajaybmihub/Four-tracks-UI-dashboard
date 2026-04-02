const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const TopicSchema = new mongoose.Schema({ any: {} }, { strict: false, collection: 'topics' });
        const Topic = mongoose.models['topics'] || mongoose.model('topics', TopicSchema);

        // 1. Move all IBPS/SBI individual categories to "IBPS/SBI" category
        // This is what the user meant by "dont show the collection in the side bar"
        // They want them grouped under the "IBPS/SBI" category instead of separate categories.
        const ibpsSbiExams = [
            'IBPS PO', 'IBPS Clerk', 'IBPS RRB Clerk', 'IBPS RRB PO', 
            'SBI PO', 'SBI Clerk', 'IBPS RRB Office Assistant (Clerk)', 
            'IBPS RRB Officer Scale I (PO)', 'IBPS Specialist Officer (SO)'
        ];

        const updateRes = await Topic.updateMany(
            { category: { $in: ibpsSbiExams } },
            { $set: { category: "IBPS/SBI" } }
        );
        console.log(`Updated ${updateRes.modifiedCount} topic categories to 'IBPS/SBI'`);

        // 2. Remove any duplicate topics for the same exam name in the same track
        // If we have "IBPS PO" (cat: IBPS PO) and "IBPS PO" (cat: IBPS/SBI), we should merge or remove.
        const allTopics = await Topic.find({ track_name: 'Banking Track' });
        const uniqueKeys = new Set();
        for (const t of allTopics) {
            const key = (t.exam_name || t.topic) + t.category;
            if (uniqueKeys.has(key)) {
                console.log(`Deleting duplicate topic: ${t.exam_name || t.topic}`);
                await Topic.deleteOne({ _id: t._id });
            } else {
                uniqueKeys.add(key);
            }
        }

        console.log('Topics cleaned up!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanup();
