const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/quiz_bank?retryWrites=true&w=majority&appName=TAT-Qestion-Bank");
  const doc = await mongoose.connection.db.collection('upsc').findOne({});
  console.log('Sample UPSC doc:', JSON.stringify(doc, null, 2));
  process.exit(0);
}
check();
