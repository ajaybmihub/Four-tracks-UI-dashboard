require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const T = mongoose.model('T', new mongoose.Schema({ exam_name: String, track_name: String }, { collection: 'topics', strict: false }));
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const d = await T.find({ track_name: { $ne: 'Tech Track' } }, { exam_name: 1, track_name: 1 }).lean();
  d.forEach(x => console.log(x.track_name + ' | ' + x.exam_name));
  await mongoose.disconnect();
});
