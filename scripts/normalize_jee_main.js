const fs = require('fs');
const path = require('path');

const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'];
const results = {};

const baseDir = path.join(__dirname, '..', 'JEE main');

if (!fs.existsSync(baseDir)) {
  console.log(`Directory not found: ${baseDir}`);
  process.exit(1);
}

years.forEach(year => {
  const fileName = `jee_main_${year}.json`;
  const filePath = path.join(baseDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileName} at ${filePath}`);
    results[year] = 'File not found';
    return;
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(rawData);

    const normalizedQuestions = questions.map(q => {
      // 1. Force exam_type to "JEE Main"
      q.exam_type = 'JEE Main';

      // 2. Force year from filename
      q.year = year;

      // 3. Optional: Deep clean unknown/undefined values if present (consistency)
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
    results[year] = normalizedQuestions.length;
    console.log(`Successfully normalized: ${fileName} (${normalizedQuestions.length} questions)`);
  } catch (err) {
    console.error(`Error processing ${fileName}:`, err.message);
    results[year] = `Error: ${err.message}`;
  }
});

console.log('\n--- JEE MAIN NORMALIZATION RESULTS ---');
Object.entries(results).forEach(([year, count]) => {
  console.log(`JEE Main ${year}: ${count} questions`);
});
