// update_topic_year_ranges.js
// Updates year_range in MongoDB topics collection from goverment_qb.topics.json
// Only updates documents where year_range is empty/missing in MongoDB.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;

const topicSchema = new mongoose.Schema({
  exam_name: String,
  year_range: String,
}, { collection: 'topics', strict: false });

const Topic = mongoose.model('Topic', topicSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Load the updated JSON file
  const jsonPath = path.join(__dirname, '..', 'goverment_qb.topics.json');
  const allTopics = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Build a map: exam_name → year_range (only entries that have a value)
  const yearRangeMap = {};
  allTopics.forEach(t => {
    if (t.exam_name && t.year_range && t.year_range.trim() !== '') {
      yearRangeMap[t.exam_name] = t.year_range.trim();
    }
  });

  console.log(`📋 Found ${Object.keys(yearRangeMap).length} exams with year_range in JSON`);

  // Update MongoDB: only where year_range is empty or missing
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [examName, yearRange] of Object.entries(yearRangeMap)) {
    const result = await Topic.updateMany(
      {
        exam_name: examName,
        $or: [{ year_range: '' }, { year_range: null }, { year_range: { $exists: false } }]
      },
      { $set: { year_range: yearRange } }
    );
    if (result.modifiedCount > 0) {
      updatedCount += result.modifiedCount;
      console.log(`  ✏️  Updated "${examName}" → "${yearRange}" (${result.modifiedCount} docs)`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ Done! Updated ${updatedCount} MongoDB documents.`);
  console.log(`⏭️  Skipped ${skippedCount} exams (already had year_range).`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
