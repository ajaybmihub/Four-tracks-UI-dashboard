const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const collection = mongoose.connection.db.collection('coding_problems');
    const problems = await collection.find({}).toArray();
    console.log(`Processing ${problems.length} problems...`);

    const mapping = {
        // DSA Topics
        "Array": "Arrays", "Array Manipulation": "Arrays", "array": "Arrays",
        "String": "Strings", "String Manipulation": "Strings", "string": "Strings",
        "Hash": "Hashing", "Hash Table": "Hashing", "hashing": "Hashing", "Hashing": "Hashing",
        "Linked List": "Linked Lists", "linkedlist": "Linked Lists",
        "Stack": "Stack", "Stacks": "Stack",
        "Queue": "Queue / Deque", "Deque": "Queue / Deque", "Queue/Deque": "Queue / Deque",
        "Binary Search": "Binary Search",
        "Tree": "Trees", "Binary Tree": "Trees", "Trees": "Trees",
        "Binary Search Tree": "Binary Search Trees (BST)", "BST": "Binary Search Trees (BST)",
        "Graph": "Graphs", "Graphs": "Graphs",
        "Recursion": "Recursion", "Recursive": "Recursion",
        "Backtracking": "Backtracking",
        "Dynamic Programming": "Dynamic Programming", "DP": "Dynamic Programming",
        "Greedy": "Greedy Algorithms", "Greedy Algorithms": "Greedy Algorithms",
        "Heap": "Heap / Priority Queue", "Priority Queue": "Heap / Priority Queue",

        // Domain-Based (Add common variants if seen)
        "Backend": "Backend Development", "Node.js": "Backend Development", "Express": "Backend Development", "Python": "Core Programming", "Java": "Core Programming", "Java Syntax": "Core Programming", "C++": "Core Programming", "JavaScript": "Core Programming", "DBMS": "Databases", "SQL": "Databases", "NoSQL": "Databases", "Debugging": "Debugging & Optimization", "Unit Testing": "Debugging & Optimization", "AWS": "Cloud & DevOps", "Docker": "Cloud & DevOps", "Kubernetes": "Cloud & DevOps", "System Design": "System Design", "Scalability": "System Design"
    };

    let updatedCount = 0;
    for (const p of problems) {
        let currentTags = [];
        if (Array.isArray(p.topics)) currentTags = [...p.topics];
        if (p.topic) currentTags.push(p.topic);
        
        const normalized = new Set();
        currentTags.forEach(tag => {
            if (mapping[tag]) {
                normalized.add(mapping[tag]);
            } else {
                // If no mapping, but it looks like a close match
                const match = Object.keys(mapping).find(m => tag.toLowerCase().includes(m.toLowerCase()));
                if (match) normalized.add(mapping[match]);
            }
        });

        if (normalized.size > 0) {
            await collection.updateOne(
                { _id: p._id },
                { $set: { topics_normalized: Array.from(normalized) } }
            );
            updatedCount++;
        }
    }

    console.log(`Successfully normalized ${updatedCount} problems.`);
    process.exit(0);
}

run();
