// debug_topics.js - Check what exam_name + year_range values exist in MongoDB topics
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  const db = mongoose.connection.db;
  const docs = await db.collection('topics').find(
    {},
    { projection: { exam_name: 1, year_range: 1, track_name: 1 } }
  ).toArray();

  console.log(`\nTotal topics in DB: ${docs.length}\n`);

  // Show all Banking Track ones
  const banking = docs.filter(d => d.track_name === 'Banking Track');
  console.log(`\n=== Banking Track (${banking.length}) ===`);
  banking.forEach(d => console.log(`  "${d.exam_name}" → "${d.year_range}"`));

  // Show ones with empty year_range
  const empty = docs.filter(d => !d.year_range || d.year_range.trim() === '');
  console.log(`\n=== Topics with empty year_range: ${empty.length} ===`);
  empty.forEach(d => console.log(`  [${d.track_name}] "${d.exam_name}"`));

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
