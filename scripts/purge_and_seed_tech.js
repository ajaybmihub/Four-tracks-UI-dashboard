const mongoose = require('mongoose');
require('dotenv').config();

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
  not_conducted: String,
  sub_topic: [String]
}, { collection: 'topics' }));

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    // 1. Purge all Tech Track topics
    const del = await Topic.deleteMany({ track_name: 'Tech Track' });
    console.log(`Deleted ${del.deletedCount} tech topics.`);

    const dsaTopics = ["Arrays", "Strings", "Hashing", "Linked Lists", "Stack", "Queue / Deque", "Binary Search", "Trees", "Binary Search Trees (BST)", "Graphs", "Recursion", "Backtracking", "Dynamic Programming", "Greedy Algorithms", "Heap / Priority Queue"];
    const domains = [
        { name: "Core Programming", sub: ["Language Syntax", "Memory Behavior", "Language-Specific Problems", "Type Systems", "Garbage Collection", "Pointers", "References", "Standard Library", "Python", "Java", "C++", "JavaScript", "C#", "OOP Implementation", "Modular Programming", "Code Design", "Software Craftsmanship"] },
        { name: "Backend Development", sub: ["Backend APIs", "Node.js", "Express", "API Design", "Server-Side Logic", "Authentication", "Authorization", "Middleware", "Microservices", "REST APIs", "GraphQL", "Web Sockets", "Event-Driven Architecture"] },
        { name: "Databases", sub: ["SQL Queries", "Schema Design", "Query Optimization", "NoSQL", "ACID Properties", "Indexing", "Database Transactions", "Sharding", "Replication"] },
        { name: "Debugging & Optimization", sub: ["Unit Testing", "Debugging Logic", "Integration Testing", "Performance Profiling", "Memory Leak Analysis", "Test-Driven Development (TDD)", "Code Reviews", "Optimization Strategies"] },
        { name: "Cloud & DevOps", sub: ["Infrastructure Automation", "CI/CD Logic", "Cloud Service Implementation", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Monitoring", "Logging", "Serverless Architecture"] },
        { name: "System Design", sub: ["Scalable Architecture", "Distributed System Logic", "Load Balancing", "Caching Strategies", "Microservices Design", "Message Queues", "System Availability", "Disaster Recovery"] }
    ];

    const toInsert = [];

    // Add DSA
    dsaTopics.forEach(t => {
        toInsert.push({
            track_name: 'Tech Track',
            category: 'DSA — Data Structures & Algorithms',
            exam_name: t,
            conducting_body: 'Standard DSA',
            year_range: 'Topic-Based',
            sub_topic: []
        });
    });

    // Add Domains
    domains.forEach(d => {
        toInsert.push({
            track_name: 'Tech Track',
            category: 'Domain-Based',
            exam_name: d.name,
            conducting_body: 'Standard Domains',
            year_range: 'Topic-Based',
            sub_topic: d.sub
        });
    });

    await Topic.insertMany(toInsert);
    console.log(`Inserted ${toInsert.length} tech topics.`);

    process.exit(0);
}

run();
