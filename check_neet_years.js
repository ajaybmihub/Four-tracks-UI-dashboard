const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb?retryWrites=true&w=majority&appName=TAT-Qestion-Bank";

async function check() {
    await mongoose.connect(MONGO_URI);
    const neet_ss_years = await mongoose.connection.db.collection('neet_ss').distinct('year');
    console.log(`NEET SS years: ${JSON.stringify(neet_ss_years)}`);
    const neet_mds_years = await mongoose.connection.db.collection('neet_mds').distinct('year');
    console.log(`NEET MDS years: ${JSON.stringify(neet_mds_years)}`);
    await mongoose.connection.close();
}

check();
