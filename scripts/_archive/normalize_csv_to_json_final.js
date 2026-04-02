const fs = require('fs');

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentRow.length > 0 || currentCell) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    return rows;
}

const normalized = [];

const cleanStr = (s) => (s || "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();

// --- Sheet 2: Govt Exams ---
const s2 = parseCSV('government examss  - Sheet2.csv').slice(1);
s2.forEach(row => {
    if (row.length < 5 || !row[1] || row[0].includes("Category") || row[1].includes("Sub Category")) return;
    normalized.push({
        exam_id: row[1].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        exam_name: cleanStr(row[1]),
        category: cleanStr(row[0]),
        track: "Govt Exams",
        year_range: cleanStr(row[2]),
        not_conducted: cleanStr(row[3]),
        paper_availability: cleanStr(row[4]),
        pattern: {
            stage_1: cleanStr(row[5]),
            stage_2: cleanStr(row[6]),
            stage_3: cleanStr(row[7])
        },
        remarks: cleanStr(row[8] || "")
    });
});

// --- Sheet 3: Banking (Direct Manual Clean Parse due to irregular layout) ---
const s3 = parseCSV('government examss  - Sheet3.csv');

const bankingExams = [
    { start: 6, name: "IBPS PO" },
    { start: 14, name: "IBPS Clerk" },
    { start: 23, name: "IBPS RRB Officer Scale I" },
    { start: 32, name: "IBPS RRB Office Assistant" },
    { start: 41, name: "IBPS SO" },
    { start: 52, name: "SBI PO" },
    { start: 62, name: "SBI Clerk" }
];

bankingExams.forEach(ex => {
    const r = (offset) => s3[ex.start + offset] ? s3[ex.start + offset][1] : "";
    normalized.push({
        exam_id: ex.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        exam_name: ex.name,
        category: "Banking (IBPS/SBI)",
        track: "Banking Track",
        year_range: cleanStr(r(1)),
        not_conducted: cleanStr(r(2)),
        paper_availability: cleanStr(r(3)),
        pattern: {
            stage_1: cleanStr(r(4)),
            stage_2: cleanStr(r(5)),
            stage_3: cleanStr(r(6))
        },
        remarks: cleanStr(r(7))
    });
});

// --- Sheet 4: RBI & Dev Banks ---
const s4 = parseCSV('government examss  - Sheet4.csv').slice(12);
s4.forEach(row => {
    if (row.length < 5 || !row[1] || row[0].includes("Category") || row[1].includes("Sub-Category")) return;
    normalized.push({
        exam_id: row[1].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        exam_name: cleanStr(row[1]),
        category: cleanStr(row[0]),
        track: "Banking Track",
        year_range: cleanStr(row[2]),
        not_conducted: cleanStr(row[3]),
        paper_availability: cleanStr(row[4]),
        pattern: {
            stage_1: cleanStr(row[7]),
            stage_2: cleanStr(row[8]),
            stage_3: cleanStr(row[9])
        },
        remarks: cleanStr(row[10] || "")
    });
});

// Final filter of empty or garbage entries
const result = normalized.filter(ex => ex.exam_name.length > 3 && !ex.exam_name.includes("Years for which"));

fs.writeFileSync('exam_database_normalized.json', JSON.stringify(result, null, 2));
console.log("Written exam_database_normalized.json with " + result.length + " entries.");
