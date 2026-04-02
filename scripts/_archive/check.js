const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const jee = await db.collection('jee_main').findOne({});
  console.log('jee_main:', jee ? jee.department : 'empty');
  const railways = await db.collection('railways').findOne({});
  console.log('railways:', railways ? railways.department : 'empty');
  const neet = await db.collection('neet_ug').findOne({});
  console.log('neet_ug:', neet ? neet.department : 'empty');
  process.exit(0);
});
