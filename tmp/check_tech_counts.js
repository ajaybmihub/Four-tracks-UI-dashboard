const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const subTopicsCore = ["Language Syntax", "Memory Behavior", "Language-Specific Problems", "Type Systems", "Garbage Collection", "Pointers", "References", "Standard Library", "Python", "Java", "C++", "JavaScript", "C#", "OOP Implementation", "Modular Programming", "Code Design", "Software Craftsmanship"];
const subTopicsBackend = ["Backend APIs", "Node.js", "Express", "API Design", "Server-Side Logic", "Authentication", "Authorization", "Middleware", "Microservices", "REST APIs", "GraphQL", "Web Sockets", "Event-Driven Architecture"];

async function check() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const col = db.collection('coding_problems');

    const coreCount = await col.countDocuments({ 
        $or: [
            { topics: { $in: subTopicsCore } }, 
            { topic: { $in: subTopicsCore } }, 
            { topics_normalized: { $in: subTopicsCore } }
        ] 
    });
    
    const backendCount = await col.countDocuments({ 
        $or: [
            { topics: { $in: subTopicsBackend } }, 
            { topic: { $in: subTopicsBackend } }, 
            { topics_normalized: { $in: subTopicsBackend } }
        ] 
    });

    const pythonCount = await col.countDocuments({ topic: /Python/i });
    const nodeCount = await col.countDocuments({ topic: /Node/i });
    
    console.log('Core Programming Count:', coreCount);
    console.log('Backend Development Count:', backendCount);
    console.log('Fuzzy Python Count:', pythonCount);
    console.log('Fuzzy Node Count:', nodeCount);
    
    process.exit(0);
}
check();
