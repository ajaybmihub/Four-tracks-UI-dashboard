const fs = require('fs');
const path = require('path');

const fileName = 'AFCAT - 2020.json';
const targetYear = '2020';

const filePath = path.join(__dirname, '..', fileName);

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
process.exit(1);
}

try {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(rawData);

  const cleanedQuestions = questions.map(q => {
    // 1. Ensure exam_type is "AFCAT"
    q.exam_type = 'AFCAT';

    // 2. Ensure year is current
    q.year = targetYear;

    // 3. Clean up unknown and notdefined elements
    Object.keys(q).forEach(key => {
      if (typeof q[key] === 'string') {
        const lowerValue = q[key].toLowerCase().trim();
        if (lowerValue === 'unknown' || lowerValue === 'notdefined' || lowerValue === 'undefined') {
          q[key] = '';
        }
      } else if (typeof q[key] === 'object' && q[key] !== null) {
        // Check options or other nested objects
        Object.keys(q[key]).forEach(subKey => {
          if (typeof q[key][subKey] === 'string') {
            const subLowerValue = q[key][subKey].toLowerCase().trim();
            if (subLowerValue === 'unknown' || subLowerValue === 'notdefined' || subLowerValue === 'undefined') {
              q[key][subKey] = '';
            }
          }
        });
      }
    });

    return q;
  });

  fs.writeFileSync(filePath, JSON.stringify(cleanedQuestions, null, 2), 'utf8');
  console.log(`Successfully cleaned: ${fileName} (${cleanedQuestions.length} questions)`);
} catch (err) {
  console.error(`Error cleaning ${fileName}:`, err.message);
}
