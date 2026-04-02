const fs = require('fs');
const path = require('path');

const fileName = 'JEE Main - 2026.json';
const targetYear = '2026';

const filePath = path.join(__dirname, '..', fileName);

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
  process.exit(1);
}

try {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(rawData);

  const normalizedQuestions = questions.map(q => {
    // 1. Force exam_type to "JEE Main"
    q.exam_type = 'JEE Main';

    // 2. Force year corresponding to filename
    q.year = targetYear;

    // 3. Clean up unknown and notdefined elements
    Object.keys(q).forEach(key => {
      if (typeof q[key] === 'string') {
        const lowerValue = q[key].toLowerCase().trim();
        if (lowerValue === 'unknown' || lowerValue === 'notdefined' || lowerValue === 'undefined') {
          q[key] = '';
        }
      } else if (typeof q[key] === 'object' && q[key] !== null) {
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

  fs.writeFileSync(filePath, JSON.stringify(normalizedQuestions, null, 2), 'utf8');
  console.log(`Successfully normalized: ${fileName} (${normalizedQuestions.length} questions)`);
} catch (err) {
  console.error(`Error processing ${fileName}:`, err.message);
}
