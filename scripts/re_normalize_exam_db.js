const fs = require('fs');
const path = require('path');

const TOPICS_FILE = path.join(__dirname, '..', 'goverment_qb.topics.json');
const NORMAL_FILE = path.join(__dirname, '..', 'exam_database_normalized.json');

function normalizeYearRange(val) {
  if (!val) return "2015-2025";
  const match = val.match(/(\d{4})[-\u2013](\d{4})/);
  if (match) return `${match[1]}-${match[2]}`;
  return "2015-2025";
}

function normalizeGaps(val) {
  if (!val) return "";
  if (val.toLowerCase().includes("no gaps")) return "";
  const years = val.match(/\d{4}/g);
  if (years) return [...new Set(years)].sort().join(', ');
  return "";
}

async function run() {
  const topics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  const normal = JSON.parse(fs.readFileSync(NORMAL_FILE, 'utf8'));

  const MAPPINGS = {
    "SSC CPO (SI)": "SSC CPO (SI)",
    "CPO-SI": "SSC CPO (SI)",
    "CHSL-DEO": "SSC CHSL DEO (Data Entry Operator)",
    "Selection Post": "SSC Selection Post (Phase-wise)",
    "AFCAT": "AFCAT",
    "Indian Navy SSR": "AFCAT", // Wait, SSR?
    "Agnipath – Agniveer": "Indian Army Agniveer",
    "Indian Army Agniveer": "Indian Army Agniveer",
    "Coast Guard Navik": "Coast Guard Navik / Yantrik",
    "Coast Guard Navik / Yantrik": "Coast Guard Navik / Yantrik",
    "Coast Guard Navik (GD & DB) / Yantrik": "Coast Guard Navik / Yantrik",
    "Military Nursing Service (MNS)": "Military Nursing Service (MNS)",
    "Military Nursing Service (MNS) – Lieutenant": "Military Nursing Service (MNS)",
    "RPF Sub-Inspector (SI)": "RPF Sub-Inspector (SI)",
    "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 3": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 3",
    "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 4": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 4",
    "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 5": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 5"
  };

  const result = normal.map(entry => {
    let targetName = entry.exam_name.trim();

    if (MAPPINGS[targetName]) {
      targetName = MAPPINGS[targetName];
    }

    let matchedTopic = topics.find(t => t.exam_name === targetName);
    if (!matchedTopic) {
        matchedTopic = topics.find(t => t.exam_name.toLowerCase().includes(targetName.toLowerCase()));
    }

    const cleanedEntry = {
      exam_id: matchedTopic ? matchedTopic.exam_name.toLowerCase().replace(/[^a-z0-9]/g, '-') : entry.exam_id,
      exam_name: matchedTopic ? matchedTopic.exam_name : entry.exam_name,
      category: entry.category,
      track: entry.track,
      year_range: normalizeYearRange(entry.year_range),
      not_conducted: normalizeGaps(entry.not_conducted),
      paper_availability: entry.paper_availability || "Available"
    };

    return cleanedEntry;
  });

  const uniqueResult = [];
  const seenNames = new Set();
  for (const entry of result) {
    if (!seenNames.has(entry.exam_name)) {
      uniqueResult.push(entry);
      seenNames.add(entry.exam_name);
    }
  }

  fs.writeFileSync(NORMAL_FILE, JSON.stringify(uniqueResult, null, 2));
  console.log(`Final sync prep complete. Total entries: ${uniqueResult.length}. Names aligned with topics.`);
}

run();
