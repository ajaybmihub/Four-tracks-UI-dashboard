const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb';

const Topic = mongoose.model('Topic', new mongoose.Schema({
  track_name: String,
  category: String,
  exam_name: String,
  conducting_body: String,
  level: String,
  eligibility: String,
  frequency: String,
  question_count: String,
  year_range: String,
  sub_topic: [String]
}, { collection: 'topics' }));

const NEW_DOMAINS = [
    {
        name: "Core Programming",
        sub_topics: ["Language Syntax", "Memory Behavior", "Language-Specific Problems", "Type Systems", "Garbage Collection", "Pointers", "References", "Standard Library", "Python", "Java", "C++", "JavaScript", "C#", "OOP Implementation", "Modular Programming", "Code Design", "Software Craftsmanship"]
    },
    {
        name: "Backend Development",
        sub_topics: ["Backend APIs", "Node.js", "Express", "API Design", "Server-Side Logic", "Authentication", "Authorization", "Middleware", "Microservices", "REST APIs", "GraphQL", "Web Sockets", "Event-Driven Architecture"]
    },
    {
        name: "Databases",
        sub_topics: ["SQL Queries", "Schema Design", "Query Optimization", "NoSQL", "Indexing", "Transactions", "Normalization", "Data Integrity", "Relational Databases", "Document Stores", "Database Administrator", "DBA", "ACID Properties", "Replication", "Sharding"]
    },
    {
        name: "Debugging & Optimization",
        sub_topics: ["Testing", "QA", "Refactoring", "Clean Code", "Code Debugging", "Performance Optimization", "Query Optimization", "Memory Leaks", "Profiling", "Runtime Behavior", "Error Handling", "Unit Testing", "Integration Testing"]
    },
    {
        name: "Cloud & DevOps",
        sub_topics: ["Infrastructure Automation", "CI/CD Logic", "Cloud Service Implementation", "AWS", "Docker", "Kubernetes", "Azure", "Terraform", "Monitoring", "Scaling", "DevOps Engineer", "Cloud Engineer", "Serverless", "Security", "Networking"]
    },
    {
        name: "System Design",
        sub_topics: ["Scalable Architecture", "Distributed System Logic", "Microservices", "Load Balancing", "Caching", "Sharding", "Reliability", "Fault Tolerance", "Communication Protocols", "System Architect", "High Availability", "Service Discovery"]
    }
];

async function updateTechTopics() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Remove ALL current "Domain-Based" topics for "Tech Track"
        const deleteRes = await Topic.deleteMany({ track_name: 'Tech Track', category: 'Domain-Based' });
        console.log(`Removed ${deleteRes.deletedCount} old domains.`);

        // 2. Insert the 6 NEW domains
        const insertedDocs = [];
        for (const dom of NEW_DOMAINS) {
            const doc = new Topic({
                track_name: 'Tech Track',
                category: 'Domain-Based',
                exam_name: dom.name,
                conducting_body: 'Standard Technology Practice',
                level: 'Intermediate/Advanced',
                eligibility: 'Computer Science Fundamental Knowledge',
                frequency: 'Continuous',
                question_count: '—',
                year_range: 'Topic-Based Selection',
                sub_topic: dom.sub_topics
            });
            await doc.save();
            insertedDocs.push(doc.toObject());
            console.log(`Inserted: [${dom.name}] with ${dom.sub_topics.length} sub-topics.`);
        }

        // 3. Update local government_qb.topics.json
        const localPath = path.join(__dirname, '..', 'goverment_qb.topics.json');
        let localTopics = JSON.parse(fs.readFileSync(localPath, 'utf8'));

        // Filter out all current Domain-Based Tech Track nodes from local JS
        localTopics = localTopics.filter(t => !(t.track_name === 'Tech Track' && t.category === 'Domain-Based'));

        // Add the new 6 nodes
        for (const doc of insertedDocs) {
            // Remove MongoDB internal fields
            delete doc._id;
            delete doc.__v;
            localTopics.push(doc);
        }

        fs.writeFileSync(localPath, JSON.stringify(localTopics, null, 4));
        console.log(`Local JSON updated. Total topics: ${localTopics.length}.`);

        console.log('Update completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Update Error:', err);
        process.exit(1);
    }
}

updateTechTopics();
