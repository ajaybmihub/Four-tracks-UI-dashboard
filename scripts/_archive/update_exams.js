const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'legacy_ui', 'index2.html');
let html = fs.readFileSync(file, 'utf8');

const match = html.match(/const EXAM_DATA = (\{[\s\S]*?\});/);
if (match) {
  let examData = JSON.parse(match[1]);
  const updates = {
    'Combined Geo-Scientist Examination': { q: 2880, y: '2025 - 2020' },
    'IBPS Clerk': { q: 4862, y: '2026 - 2012' },
    'IBPS RRB Officer Scale I (PO)': { q: 4862, y: '2026 - 2012' },
    'IBPS RRB Office Assistant (Clerk)': { q: 4862, y: '2026 - 2012' },
    'IBPS Specialist Officer (SO)': { q: 4862, y: '2026 - 2012' },
    'SBI Clerk': { q: 8151, y: '2025 - 2012' },
    'RBI Grade B': { q: 8151, y: '2025 - 2012' },
    'RRB JE': { q: 29000, y: '2026 - 2010' },
    'RRB Group D': { q: 29000, y: '2026 - 2010' },
    'SSB / Assam Rifles Recruitment': { q: 922, y: '2025 - 2020' }
  };
  
  for(let cat in examData) {
    if(cat === '_states') continue;
    examData[cat].forEach(ex => {
      if(updates[ex.name]) {
        ex.questions = updates[ex.name].q;
        ex.years = updates[ex.name].y;
      }
    });
  }
  
  html = html.replace(match[0], 'const EXAM_DATA = ' + JSON.stringify(examData) + ';');
  fs.writeFileSync(file, html, 'utf8');
  console.log('Updated EXAM_DATA successfully.');
} else {
  console.log('Could not find EXAM_DATA in ' + file);
}
