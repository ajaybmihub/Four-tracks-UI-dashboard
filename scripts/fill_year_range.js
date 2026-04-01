// fill_year_range.js
// Fills in "2025 - 2010" for any topic in goverment_qb.topics.json
// that has an empty or missing year_range field.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'goverment_qb.topics.json');
const DEFAULT_YEAR_RANGE = '2025 - 2010';

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

let filled = 0;
const updated = data.map(topic => {
  if (!topic.year_range || topic.year_range.trim() === '') {
    filled++;
    return { ...topic, year_range: DEFAULT_YEAR_RANGE };
  }
  return topic;
});

fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), 'utf8');
console.log(`✅ Done. Filled year_range for ${filled} topics (out of ${data.length} total).`);
