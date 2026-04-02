// update_topic_year_ranges_force.js
// Force-updates year_range in MongoDB topics collection from goverment_qb.topics.json
// Updates ALL matched docs regardless of current value.

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

  // Build a map: exam_name → year_range (only non-empty entries)
  const yearRangeMap = {};
  allTopics.forEach(t => {
    if (t.exam_name && t.year_range && t.year_range.trim() !== '') {
      yearRangeMap[t.exam_name] = t.year_range.trim();
    }
  });

  console.log(`📋 Found ${Object.keys(yearRangeMap).length} exams with year_range in JSON`);

  // First: show current state for a few IBPS-style exams
  const sample = await Topic.find(
    { exam_name: { $in: ['IBPS Clerk', 'SBI PO', 'SSC Combined Higher Secondary Level (CHSL)', 'RRB ALP'] } },
    { exam_name: 1, year_range: 1 }
  ).lean();
  console.log('\n📊 Sample current MongoDB state:');
  sample.forEach(t => console.log(`  "${t.exam_name}" → year_range: "${t.year_range}"`));

  // Force update ALL docs by exam_name from the JSON map
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const [examName, yearRange] of Object.entries(yearRangeMap)) {
    const result = await Topic.updateMany(
      { exam_name: examName },
      { $set: { year_range: yearRange } }
    );
    if (result.matchedCount > 0) {
      updatedCount += result.modifiedCount;
      if (result.modifiedCount > 0) {
        console.log(`  ✏️  Updated "${examName}" → "${yearRange}"`);
      }
    } else {
      notFoundCount++;
    }
  }

  console.log(`\n✅ Done! Modified ${updatedCount} MongoDB documents.`);
  console.log(`❓ ${notFoundCount} exam names not found in MongoDB.`);

  // Verify final state
  const afterSample = await Topic.find(
    { exam_name: { $in: ['IBPS Clerk', 'SBI PO', 'SSC Combined Higher Secondary Level (CHSL)', 'RRB ALP'] } },
    { exam_name: 1, year_range: 1 }
  ).lean();
  console.log('\n✅ Verified final MongoDB state:');
  afterSample.forEach(t => console.log(`  "${t.exam_name}" → year_range: "${t.year_range}"`));

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
