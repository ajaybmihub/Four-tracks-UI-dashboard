// add_not_conducted.js
// Adds/updates the `not_conducted` field in MongoDB topics collection
// Define each exam's not_conducted years here.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const topicSchema = new mongoose.Schema({
  exam_name: String,
  not_conducted: String,
}, { collection: 'topics', strict: false });

const Topic = mongoose.model('Topic', topicSchema);

// ── DEFINE NOT-CONDUCTED YEARS PER EXAM ──
const NOT_CONDUCTED = {
  'NEET SS': '2018, 2019',
  // Add more exams here as needed:
  // 'NEET MDS': '2020',
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  for (const [examName, years] of Object.entries(NOT_CONDUCTED)) {
    const result = await Topic.updateMany(
      { exam_name: examName },
      { $set: { not_conducted: years } }
    );
    console.log(`  ✏️  "${examName}" → not_conducted: "${years}" (matched: ${result.matchedCount}, modified: ${result.modifiedCount})`);
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
