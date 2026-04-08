const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

async function check() {
    await mongoose.connect(MONGO_URI);
    const topics = await mongoose.connection.db.collection('topics').find({ exam_name: /NEET/i }).toArray();
    console.log(JSON.stringify(topics, null, 2));
    await mongoose.connection.close();
}

check();
