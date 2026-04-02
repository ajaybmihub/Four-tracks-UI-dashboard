const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, '..', 'goverment_qb.jee_main.json');

if (!fs.existsSync(inputFilePath)) {
  console.error(`Input file not found: ${inputFilePath}`);
  process.exit(1);
}

try {
  const rawData = fs.readFileSync(inputFilePath, 'utf8');
  const questions = JSON.parse(rawData);

  const groups = {};

  questions.forEach(q => {
    // Standardize exam_type: remove trailing/leading spaces
    const examType = (q.exam_type || 'Unknown').toString().trim();
    // Standardize year: remove trailing/leading spaces
    const year = (q.year || 'Unknown').toString().trim();

    const fileName = `${examType} - ${year}.json`.replace(/[/\\?%*:|"<>]/g, '-');
    
    if (!groups[fileName]) {
      groups[fileName] = [];
    }
    
    // Remove MongoDB-specific _id if needed? (User didn't ask, but good to keep it clean)
    // q._id is likely there. I'll keep it for now.
    
    groups[fileName].push(q);
  });

  Object.keys(groups).forEach(fileName => {
    const outputFilePath = path.join(__dirname, '..', fileName);
    fs.writeFileSync(outputFilePath, JSON.stringify(groups[fileName], null, 2), 'utf8');
    console.log(`Successfully created: ${fileName} (${groups[fileName].length} questions)`);
  });

} catch (err) {
  console.error(`Error processing file:`, err.message);
}
