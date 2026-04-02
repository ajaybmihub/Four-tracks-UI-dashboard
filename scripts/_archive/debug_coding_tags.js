const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const problems = await mongoose.connection.db.collection('coding_problems').find({}).limit(5).toArray();
    console.log("Sample Tags:", JSON.stringify(problems.map(p => ({
        title: p.title,
        topics: p.topics,
        topic: p.topic,
        topics_normalized: p.topics_normalized
    })), null, 2));

    // Get all distinct tags across the collection to know what to search for
    const distinctTopics = await mongoose.connection.db.collection('coding_problems').distinct('topics');
    const distinctTopic = await mongoose.connection.db.collection('coding_problems').distinct('topic');
    const distinctNorm = await mongoose.connection.db.collection('coding_problems').distinct('topics_normalized');
    
    console.log("Distinct Topics (first 10):", distinctTopics.slice(0, 10));
    console.log("Distinct Topic (first 10):", distinctTopic.slice(0, 10));
    console.log("Distinct Normalized (first 10):", distinctNorm.slice(0, 10));

    process.exit(0);
}

run();
