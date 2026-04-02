const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', '..', 'Question-Extraction');

const files = [
  'upsc_2017.json',
  'upsc_2018.json',
  'upsc_2019.json',
  'upsc_2020.json',
  'upsc_2021.json',
  'upsc_2022.json',
  'upsc_ese_2023 (1).json',
  'upsc_ese_2023.json',
  'upsc_ese_2024.json',
  'upsc_ese_2025.json'
];

const outputDir = path.join(baseDir, 'upsc_split');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function sanitize(str) {
  return str
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9\-_ ]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

async function splitFiles() {
  const grouped = {};
  const summary = {};

  for (const file of files) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${file}`);
      continue;
    }

    console.log(`Processing: ${file}`);
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    console.log(`  Total records: ${data.length}`);

    data.forEach(item => {
      const { _id, ...rest } = item;
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

  console.log('\n=== EXAM TYPES FOUND ===');
  const sorted = Object.entries(summary).sort((a, b) => a[1].exam_type.localeCompare(b[1].exam_type) || a[1].year.localeCompare(b[1].year));
  sorted.forEach(([key, info]) => {
    console.log(`  [${info.year}] ${info.exam_type}: ${info.count} records`);
  });

  console.log('\n=== WRITING FILES ===');
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
