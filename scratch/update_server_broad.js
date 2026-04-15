const fs = require('fs');
const path = 'e:/Github/Course-Explorer/server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove limit(50)
content = content.replace(/\.limit\(50\);/g, ';');

// 2. Expand search tags
const oldTags = `if (base === 'core-programming') tags.push('programming', 'coding', 'languages', 'syntax', 'oop');
    if (base === 'backend-development') tags.push('backend', 'server', 'api', 'apis');
    if (base === 'frontend-development') tags.push('frontend', 'ui', 'ux', 'web');
    if (base === 'databases') tags.push('sql', 'nosql', 'database', 'db');
    if (base === 'cloud-devops') tags.push('cloud', 'devops', 'aws', 'docker', 'kubernetes', 'cicd');
    if (base === 'system-design') tags.push('architecture', 'scaling', 'distributed');`;

const newTags = `if (base === 'core-programming') tags.push('programming', 'coding', 'languages', 'syntax', 'oop', 'logic', 'development');
    if (base === 'backend-development') tags.push('backend', 'server', 'api', 'apis', 'rest', 'db');
    if (base === 'debugging-optimization') tags.push('debug', 'optimization', 'performance', 'refactoring', 'testing');
    if (base === 'databases') tags.push('sql', 'nosql', 'database', 'db', 'query', 'schema');
    if (base === 'cloud-devops') tags.push('cloud', 'devops', 'aws', 'docker', 'kubernetes', 'cicd');
    if (base === 'system-design') tags.push('architecture', 'scaling', 'distributed', 'microservices');`;

if (content.indexOf(oldTags.replace(/\n/g, '\r\n')) !== -1) {
    content = content.replace(oldTags.replace(/\n/g, '\r\n'), newTags.replace(/\n/g, '\r\n'));
} else {
    content = content.replace(oldTags, newTags);
}

// 3. Expand query fields
const oldQuery = `{ topics: { $in: searchTags } }, 
                    { topic: { $in: searchTags } },
                    { role: { $in: searchTags } },
                    { topics_normalized: { $in: searchTags } },
                    { sub_topic: { $in: searchTags } }`;

const newQuery = `{ topics: { $in: searchTags } }, 
                    { topic: { $in: searchTags } },
                    { subtopic: { $in: searchTags } },
                    { sub_topic: { $in: searchTags } },
                    { subject: { $in: searchTags } },
                    { role: { $in: searchTags } },
                    { topics_normalized: { $in: searchTags } },
                    { exam_type: { $in: searchTags } }`;

// Apply globally (for /questions and calculateProgress)
while (content.indexOf(oldQuery.replace(/\n/g, '\r\n')) !== -1) {
    content = content.replace(oldQuery.replace(/\n/g, '\r\n'), newQuery.replace(/\n/g, '\r\n'));
}
while (content.indexOf(oldQuery) !== -1) {
    content = content.replace(oldQuery, newQuery);
}

fs.writeFileSync(path, content);
console.log('Successfully updated server.js');
