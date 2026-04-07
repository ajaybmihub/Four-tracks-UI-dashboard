const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

async function check() {
    await mongoose.connect(MONGO_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(", ")}`);
    await mongoose.connection.close();
}

check();
