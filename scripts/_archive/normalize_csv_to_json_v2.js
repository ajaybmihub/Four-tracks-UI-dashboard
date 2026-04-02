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
                // Escaped quote
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

// --- Sheet 2: Govt Exams ---
const s2 = parseCSV('government examss  - Sheet2.csv').slice(1);
s2.forEach(row => {
    if (row.length < 5 || !row[1]) return;
    normalized.push({
        exam_id: row[1].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        exam_name: row[1],
        category: row[0],
        track: "Govt Exams",
        year_range: row[2],
        not_conducted: row[3],
        paper_availability: row[4],
        pattern: {
            stage_1: row[5],
            stage_2: row[6],
            stage_3: row[7]
        },
        remarks: row[8] || ""
    });
});

// --- Sheet 3: Banking (IBPS/SBI) ---
// Note: This sheet has a very specific vertical layout.
const s3 = parseCSV('government examss  - Sheet3.csv');
// We look for rows that act as "Exam Name" headers
// IBPS PO is at row index ~6 (line 7)
const extractBanking = (startIndex, name) => {
    const base = s3[startIndex];
    if (!base) return;
    normalized.push({
        exam_id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        exam_name: name,
        category: "Banking (IBPS/SBI)",
        track: "Banking Track",
        year_range: s3[startIndex + 1] ? s3[startIndex + 1][1] : "",
        not_conducted: s3[startIndex + 2] ? s3[startIndex + 2][1] : "",
        paper_availability: s3[startIndex + 3] ? s3[startIndex + 3][1] : "",
        pattern: {
            stage_1: s3[startIndex + 4] ? s3[startIndex + 4][1] : "",
            stage_2: s3[startIndex + 5] ? s3[startIndex + 5][1] : "",
            stage_3: s3[startIndex + 6] ? s3[startIndex + 6][1] : ""
        },
        remarks: s3[startIndex + 7] ? s3[startIndex + 7][1] : ""
    });
};

// Fixed positions for Sheet 3 based on inspection
extractBanking(6, "IBPS PO");
extractBanking(14, "IBPS Clerk");
extractBanking(23, "IBPS RRB Officer Scale I");
extractBanking(32, "IBPS RRB Office Assistant");
extractBanking(41, "IBPS SO");
extractBanking(52, "SBI PO");
extractBanking(62, "SBI Clerk");

// --- Sheet 4: RBI & Dev Banks ---
const s4 = parseCSV('government examss  - Sheet4.csv').slice(12);
s4.forEach(row => {
    if (row.length < 5 || !row[1]) return;
    normalized.push({
        exam_id: row[1].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        exam_name: row[1],
        category: row[0],
        track: "Banking Track",
        year_range: row[2],
        not_conducted: row[3],
        paper_availability: row[4],
        pattern: {
            stage_1: row[7],
            stage_2: row[8],
            stage_3: row[9]
        },
        remarks: row[10] || ""
    });
});

// Final Clean
const final = normalized.map(item => {
    const cleanStr = (s) => (s || "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    item.year_range = cleanStr(item.year_range);
    item.not_conducted = cleanStr(item.not_conducted);
    item.paper_availability = cleanStr(item.paper_availability);
    item.pattern.stage_1 = cleanStr(item.pattern.stage_1);
    item.pattern.stage_2 = cleanStr(item.pattern.stage_2);
    item.pattern.stage_3 = cleanStr(item.pattern.stage_3);
    item.remarks = cleanStr(item.remarks);
    return item;
});

fs.writeFileSync('exam_database_normalized.json', JSON.stringify(final, null, 2));
console.log("Written exam_database_normalized.json with " + final.length + " entries.");
