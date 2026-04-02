const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const bank = await db.collection('bank_exams').distinct('department');
  console.log('bank_exams departments:', bank);
  process.exit(0);
});