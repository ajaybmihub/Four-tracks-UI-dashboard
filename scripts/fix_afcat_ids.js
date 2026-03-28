const fs = require('fs');
const path = require('path');

const filesToFix = ['AFCAT - 2013.json', 'AFCAT - 2014.json'];

filesToFix.forEach(fileName => {
  const filePath = path.join(__dirname, '..', fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileName}`);
    return;
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(rawData);

    const fixedQuestions = questions.map(q => {
      // Remove the _id field entirely
      if (q._id) {
        delete q._id;
      }
      return q;
    });

    fs.writeFileSync(filePath, JSON.stringify(fixedQuestions, null, 2), 'utf8');
    console.log(`Successfully removed _id fields from: ${fileName}`);
  } catch (err) {
    console.error(`Error fixing ${fileName}:`, err.message);
  }
});
