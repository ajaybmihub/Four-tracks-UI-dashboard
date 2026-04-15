const fs = require('fs');
const path = 'e:/Github/Course-Explorer/server.js';
let content = fs.readFileSync(path, 'utf8');

// The problematic section was roughly:
// return "topics"; 
// }
// 
//     }
// 
//     return "topics"; 
// }

// Let's use a regex to find and replace it
const regex = /return "topics"; \r?\n}\s*\r?\n\s*}\s*\r?\n\s*return "topics"; \r?\n}/g;
if (regex.test(content)) {
    console.log('Regex matched! Fixing...');
    const fixedContent = content.replace(regex, 'return "topics"; \n}');
    fs.writeFileSync(path, fixedContent);
    console.log('Fixed.');
} else {
    console.log('Regex did NOT match.');
    // Fallback: try to find the start and end and cut it out
    const startIdx = content.indexOf('return "topics"; \n}\n\n    }\n\n    return "topics"; \n}');
    if (startIdx !== -1) {
        console.log('Found literal match (\\n). Fixing...');
        // logic...
    } else {
         const startIdxRN = content.indexOf('return "topics"; \r\n}\r\n\r\n    }\r\n\r\n    return "topics"; \r\n}');
         if (startIdxRN !== -1) {
             console.log('Found literal match (\\r\\n). Fixing...');
         } else {
             console.log('Complete fallback: search for consecutive closing brackets');
             const fallbackRegex = /}\s*\r?\n\s*}\s*\r?\n\s*return "topics"; \r?\n}/g;
             if (fallbackRegex.test(content)) {
                 console.log('Fallback Regex matched! Fixing...');
                 fs.writeFileSync(path, content.replace(fallbackRegex, '}'));
             }
         }
    }
}
