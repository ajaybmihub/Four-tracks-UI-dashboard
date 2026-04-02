const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Topic = mongoose.model('Topic', new mongoose.Schema({}, { collection: 'topics', strict: false }));

// Only keep these 6 topics in Domain-Based
const KEEP = [
  'Core Programming',
  'Backend Development',
  'Databases',
  'Debugging & Optimization',
  'Cloud & DevOps',
  'System Design',
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.\n');

    // First: show current Domain-Based topics
    const all = await Topic.find(
      { track_name: 'Tech Track', category: 'Domain-Based' },
      { exam_name: 1, _id: 0 }
    ).lean();

    console.log(`Found ${all.length} Domain-Based topics:`);
    all.forEach(d => {
      const keeping = KEEP.includes(d.exam_name) ? '✅ KEEP' : '🗑️  DELETE';
      console.log(`  ${keeping}  →  ${d.exam_name}`);
    });

    console.log('\nDeleting topics not in the keep list...');

    // Delete all Domain-Based topics whose exam_name is NOT in KEEP
    const result = await Topic.deleteMany({
      track_name: 'Tech Track',
      category: 'Domain-Based',
      exam_name: { $nin: KEEP }
    });

    console.log(`\n✅ Deleted: ${result.deletedCount} topics`);
    console.log('✨ Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
