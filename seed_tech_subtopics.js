const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pf3ihub:42eoLwZCRIdRO8Yz@tat-qestion-bank.qjtlk.mongodb.net/goverment_qb';

const topicSchema = new mongoose.Schema({
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
}, { collection: 'topics' });

const Topic = mongoose.model('Topic', topicSchema);

const dsaMapping = {
  "Arrays": ["Array", "Matrix", "Prefix Sum", "Sliding Window", "Two Pointers", "Enumeration", "Counting", "Bucket Sort", "Counting Sort", "Radix Sort", "Quickselect", "Sorting", "Merge Sort", "Divide and Conquer"],
  "Strings": ["String", "String Matching", "Rolling Hash", "Suffix Array", "Trie", "Hash Function", "Bitmask"],
  "Hashing": ["Hash Table", "Hash Function", "Rolling Hash", "Prefix Sum", "Counting"],
  "Linked Lists": ["Linked List"],
  "Stack": ["Stack", "Monotonic Stack"],
  "Queue / Deque": ["Queue", "Monotonic Queue", "Breadth-First Search"],
  "Binary Search": ["Binary Search", "Divide and Conquer", "Ordered Set"],
  "Trees": ["Tree", "Binary Tree", "Segment Tree", "Binary Indexed Tree", "Trie", "Minimum Spanning Tree", "Strongly Connected Component", "Topological Sort"],
  "Binary Search Trees (BST)": ["Binary Search Tree", "Ordered Set"],
  "Graphs": ["Graph", "Graph Theory", "Breadth-First Search", "Depth-First Search", "Shortest Path", "Topological Sort", "Strongly Connected Component", "Minimum Spanning Tree", "Union Find", "Line Sweep"],
  "Recursion": ["Recursion", "Divide and Conquer", "Memoization"],
  "Backtracking": ["Backtracking", "Combinatorics", "Enumeration", "Game Theory", "Bitmask"],
  "Dynamic Programming": ["Dynamic Programming", "Memoization", "Coin Change Problem", "Combinatorial Optimization", "Optimization", "Counting", "Probability and Statistics"],
  "Greedy Algorithms": ["Greedy", "Greedy Algorithms", "Line Sweep", "Minimum Spanning Tree", "Sorting", "Simulation"],
  "Heap / Priority Queue": ["Heap", "Priority Queue", "Shortest Path", "Greedy", "Dijkstra"]
};

// Also adding some smart mapping for Domain based just in case
const domainMapping = {
    "AI / Machine Learning": ["ML Algorithms", "Data Processing", "Model Logic", "Machine Learning", "Artificial Intelligence", "Deep Learning", "Neural Networks", "AI Engineer", "ML Engineer"],
    "Web Development": ["Frontend Logic", "Backend APIs", "DOM Manipulation", "HTML", "CSS", "JavaScript", "React", "Node.js", "Express", "API Design", "Web Design", "Web Developer", "Frontend Developer", "Backend Developer"],
    "Software Engineering": ["Code Design", "OOP Implementation", "Modular Programming", "Software Craftsmanship", "Agile", "Testing", "QA", "Refactoring", "Clean Code", "Software Engineer"],
    "Programming Languages": ["Language Syntax", "Memory Behavior", "Language-Specific Problems", "Type Systems", "Garbage Collection", "Pointers", "References", "Standard Library", "Python", "Java", "C++", "JavaScript", "C#"],
    "Operating Systems & Networking": ["Process Scheduling", "Threads", "Networking Logic", "TCP/IP", "HTTP", "Memory Management", "File Systems", "Concurrency", "Synchronization", "Deadlocks", "Network Engineer"],
    "Behavioral / Logical": ["Logical Reasoning", "Scenario-Based Coding", "Soft Skills", "Teamwork", "Problem Solving", "Conflict Resolution", "Communication", "Leadership"],
    "Cloud & DevOps": ["Infrastructure Automation", "CI/CD Logic", "Cloud Service Implementation", "AWS", "Docker", "Kubernetes", "Azure", "Terraform", "Monitoring", "Scaling", "DevOps Engineer", "Cloud Engineer"],
    "System Design": ["Scalable Architecture", "Distributed System Logic", "Microservices", "Load Balancing", "Caching", "Sharding", "Reliability", "Fault Tolerance", "Communication Protocols", "System Architect"],
    "Databases": ["SQL Queries", "Schema Design", "Query Optimization", "NoSQL", "Indexing", "Transactions", "Normalization", "Data Integrity", "Relational Databases", "Document Stores", "Database Administrator", "DBA"]
};

async function seedSubTopics() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Update DSA Topics
    console.log('Updating DSA Topics...');
    for (const [topicName, subTopics] of Object.entries(dsaMapping)) {
      // Escape all regex special characters for safety (e.g. parentheses in BST)
      const escapedName = topicName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const queryName = new RegExp(escapedName, 'i');
      const result = await Topic.updateMany(
        { track_name: 'Tech Track', exam_name: queryName, category: /DSA/i },
        { $set: { sub_topic: subTopics } }
      );
      console.log(`Updated ${topicName}: Found ${result.matchedCount}, Modified ${result.modifiedCount}`);
    }

    // 2. Update Domain-Based Topics
    console.log('Updating Domain-Based Topics...');
    for (const [topicName, subTopics] of Object.entries(domainMapping)) {
      const queryName = new RegExp(topicName, 'i');
      const result = await Topic.updateMany(
        { track_name: 'Tech Track', exam_name: topicName, category: /Domain/i },
        { $set: { sub_topic: subTopics } }
      );
      console.log(`Updated Domain ${topicName}: Found ${result.matchedCount}, Modified ${result.modifiedCount}`);
    }

    // 3. Special case for the "Matrix" and other general tags - adding them to Arrays or other relevant categories
    const generalTags = ["Algorithm", "Design", "Math", "Number Theory", "Geometry", "Matrix", "Randomized", "Simulation", "Bit Manipulation", "Brainteaser"];
    
    // For now, these were mapped in the plan above. 
    // Matrix is already in Arrays sub_topic.
    // We can add "Simulation" to "Greedy Algorithms" as per user plan.
    // We can add "Math" to "Hashing" or a general collection if needed.

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seedSubTopics();
