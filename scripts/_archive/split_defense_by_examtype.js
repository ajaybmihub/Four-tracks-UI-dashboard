const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', '..', 'Question-Extraction');

const files = [
  'defense _2020.json',
  'defense_2021.json',
  'defense_2024.json'
];

const outputDir = path.join(baseDir, 'defense_split');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Sanitize exam_type name for use as filename
function sanitize(str) {
  return str
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9\-_ ]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

async function splitFiles() {
  // Grouped: { 'ExamType_Year': [...records] }
  const grouped = {};
  const summary = {};

  for (const file of files) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${file}`);
      continue;
    }

    console.log(`\nProcessing: ${file}`);
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    data.forEach(item => {
      const { _id, ...rest } = item; // Strip old MongoDB _id
      const examType = rest.exam_type || 'Unknown';
      const year = rest.year || 'Unknown';
      const key = `${sanitize(examType)}_${year}`;

      if (!grouped[key]) {
        grouped[key] = [];
        summary[key] = { exam_type: examType, year, count: 0 };
      }
      grouped[key].push(rest);
      summary[key].count++;
    });
  }

  console.log('\n\n=== EXAM TYPES FOUND ===');
  const headers = ['Key', 'Exam Type', 'Year', 'Count'];
  console.log(headers.join('\t'));
  Object.entries(summary)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([key, info]) => {
      console.log(`${key}\t${info.exam_type}\t${info.year}\t${info.count}`);
    });

  console.log('\n\n=== WRITING FILES ===');
  for (const [key, records] of Object.entries(grouped)) {
    const fileName = `${key}.json`;
    const outPath = path.join(outputDir, fileName);
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
    console.log(`  ✅ ${fileName} → ${records.length} records`);
  }

  console.log(`\n✅ Done! ${Object.keys(grouped).length} files written to: ${outputDir}`);
}

splitFiles().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
