const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Topic = mongoose.model('Topic', new mongoose.Schema({}, { collection: 'topics', strict: false }));

const ALLOWED_TRACKS = ['JEE / NEET Track', 'Banking Track', 'Govt Exams Track'];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // Find topics in allowed tracks with missing/empty year_range
    const result = await Topic.updateMany(
      {
        track_name: { $in: ALLOWED_TRACKS },
        $or: [
          { year_range: { $exists: false } },
          { year_range: null },
          { year_range: '' }
        ]
      },
      { $set: { year_range: '2010-2025' } }
    );

    console.log(`Matched : ${result.matchedCount}`);
    console.log(`Updated : ${result.modifiedCount}`);
    console.log('✨ Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
