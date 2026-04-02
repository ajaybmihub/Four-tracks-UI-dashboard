const fs = require('fs');

// Helper to clean strings
const clean = (s) => (s || '').replace(/\r/g, '').trim();

// Function to parse CSV (simple split-based for these specific files)
function parseCSV(filePath, startRow) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const data = [];
    
    for (let i = startRow - 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle CSV parts with possible quotes
        const row = [];
        let current = '';
        let inQuotes = false;
        const line = lines[i];
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                row.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current);
        data.push(row.map(s => s.replace(/^"|"$/g, '').trim()));
    }
    return data;
}

const normalizedData = [];

// PROCESS SHEET 2 (UPSC, SSC, Railways, Defence)
const sheet2 = parseCSV('government examss  - Sheet2.csv', 2);
sheet2.forEach(row => {
    if (row.length < 8) return;
    normalizedData.push({
        track: "Govt / General Track",
        category: row[0],
        exam_name: row[1],
        year_range: row[2],
        not_conducted: row[3],
        paper_availability: row[4],
        stages: [
            { stage: 1, info: row[5] },
            { stage: 2, info: row[6] },
            { stage: 3, info: row[7] }
        ].filter(s => s.info && s.info !== 'N/A' && s.info !== '—'),
        notes: row[8] || ""
    });
});

// PROCESS SHEET 3 (Banking - IBPS/SBI)
// Note: This sheet has pairs of rows for names or specific multi-line blocks.
// I'll manually handle the logic based on the visible content.
const sheet3Raw = parseCSV('government examss  - Sheet3.csv', 7);
sheet3Raw.forEach((row, i) => {
    // In Sheet3, rows are a bit coupled. Every 8th line in the raw parse seems to be a new exam
    // Actually, looking at the previous view_file, it's structured like: 
    // row 6,7,8,9,10,11,12 are attributes for one exam? No.
    // Let's re-examine Sheet 3 structure from the view_file logs.
});

// Re-parsing Sheet 3 specifically based on row indices observed in logs
function processSheet3() {
    const rawLines = fs.readFileSync('government examss  - Sheet3.csv', 'utf8').split('\n');
    // IBPS PO: starts around line 6
    // IBPS Clerk: line 15
    // etc.
    // I will extract them as blocks.
    const exams = [
        { name: "IBPS PO", lines: [7, 14] },
        { name: "IBPS Clerk", lines: [15, 23] },
        { name: "IBPS RRB Officer Scale I (PO)", lines: [24, 32] },
        { name: "IBPS RRB Office Assistant (Clerk)", lines: [33, 41] },
        { name: "IBPS SO", lines: [42, 52] },
        { name: "SBI PO", lines: [53, 62] },
        { name: "SBI Clerk", lines: [63, 73] }
    ];

    exams.forEach(ex => {
        const block = rawLines.slice(ex.lines[0]-1, ex.lines[1]);
        const cleanBlock = block.map(l => l.replace(/^"|"$/g, '').trim());
        
        normalizedData.push({
            track: "Banking Track",
            category: "Banking – IBPS/SBI",
            exam_name: ex.name,
            year_range: cleanBlock[1] || "",
            not_conducted: (cleanBlock[2] || "").includes("Gap:") ? cleanBlock[2] : "",
            paper_availability: cleanBlock[3] || "",
            stages: [
                { stage: 1, info: cleanBlock[4] || "" },
                { stage: 2, info: cleanBlock[5] || "" },
                { stage: 3, info: cleanBlock[6] || "" }
            ].filter(s => s.info && !s.info.includes("Overall:")),
            notes: ""
        });
    });
}
processSheet3();

// PROCESS SHEET 4 (RBI / NABARD / Dev Banks)
const sheet4 = parseCSV('government examss  - Sheet4.csv', 12);
sheet4.forEach(row => {
    if (row.length < 9) return;
    normalizedData.push({
        track: "Banking Track",
        category: row[0],
        exam_name: row[1],
        year_range: row[2],
        not_conducted: row[3],
        paper_availability: row[4],
        stages: [
            { stage: 1, info: row[7] },
            { stage: 2, info: row[8] },
            { stage: 3, info: row[9] }
        ].filter(s => s.info && s.info !== '—' && s.info !== '—'),
        notes: ""
    });
});

// Final cleanup: remove newlines inside properties and quotes
const finalized = normalizedData.map(obj => {
    const newObj = {};
    for (let key in obj) {
        if (key === 'stages') {
            newObj[key] = obj[key].map(s => ({ stage: s.stage, info: s.info.replace(/\n|\r/g, ' ').trim() }));
        } else {
            newObj[key] = (typeof obj[key] === 'string') ? obj[key].replace(/\n|\r/g, ' ').trim() : obj[key];
        }
    }
    return newObj;
});

fs.writeFileSync('normalized_exam_database.json', JSON.stringify(finalized, null, 2));
console.log('Successfully created normalized_exam_database.json with', finalized.length, 'entries.');
