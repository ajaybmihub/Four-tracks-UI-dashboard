const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Topic = mongoose.model('Topic', new mongoose.Schema({}, { collection: 'topics', strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await Topic.findOne({ exam_name: 'Military Nursing Service (MNS)' }).lean();
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}

run();
