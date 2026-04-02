const fs = require('fs');
const path = require('path');

const years = ['2011', '2012', '2013', '2014', '2015', '2016', '2017'];
const results = {};

years.forEach(year => {
  const fileName = `AFCAT - ${year}.json`;
  const filePath = path.join(__dirname, '..', fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileName}`);
    results[year] = 'File not found';
    return;
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(rawData);

    const cleanedQuestions = questions.map(q => {
      // 1. Ensure exam_type is "AFCAT"
      q.exam_type = 'AFCAT';

      // 2. Ensure year is correct
      q.year = year;

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
    results[year] = cleanedQuestions.length;
    console.log(`Successfully cleaned: ${fileName} (${cleanedQuestions.length} questions)`);
  } catch (err) {
    console.error(`Error cleaning ${fileName}:`, err.message);
    results[year] = `Error: ${err.message}`;
  }
});

console.log('\n--- BATCH CLEANUP RESULTS ---');
Object.entries(results).forEach(([year, count]) => {
  console.log(`AFCAT - ${year}: ${count} questions`);
});
