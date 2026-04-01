require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Topic = mongoose.model('Topic', new mongoose.Schema({
    exam_name: String,
    track_name: String,
    year_range: String,
    not_conducted: String,
    remarks: String,
    exam_stages: Object
}, { collection: 'topics', strict: false }));

const MAPPINGS = {
    "Civil Services Examination (CSE)": "Civil Services Examination (CSE)",
    "Indian Forest Service (IFoS)": "Indian Forest Service (IFoS)",
    "Engineering Services Examination (ESE / IES)": "Engineering Services Examination (ESE/IES)",
    "Combined Defence Services (CDS)": "Combined Defence Services (CDS)",
    "National Defence Academy & Naval Academy (NDA & NA)": "National Defence Academy (NDA) & NA",
    "Combined Medical Services (CMS)": "Combined Medical Services (CMS)",
    "Indian Economic Service / Indian Statistical Service (IES/ISS)": "Indian Economic Service / Indian Statistical Service (IES/ISS)",
    "Combined Geo-Scientist Examination": "Combined Geo-Scientist Examination",
    "EPFO – Enforcement Officer / Accounts Officer": "EPFO Enforcement Officer/Accounts Officer",
    "Central Armed Police Forces – Assistant Commandant (CAPF AC)": "Central Armed Police Forces (Assistant Commandant - CAPF AC)",
    "Combined Graduate Level (CGL)": "SSC Combined Graduate Level (CGL)",
    "Combined Higher Secondary Level (CHSL)": "SSC Combined Higher Secondary Level (CHSL)",
    "Multi Tasking Staff (MTS)": "SSC Multi Tasking Staff (MTS)",
    "GD Constable": "SSC GD Constable",
    "Junior Engineer (JE)": "SSC Junior Engineer (JE)",
    "CPO – Sub-Inspector (SI) in Delhi Police / CAPFs": "SSC Sub Inspector (CPO)",
    "Stenographer Grade C & D": "SSC Stenographer Grade C & D",
    "Selection Post (Phase-wise)": "SSC Selection Post",
    "CHSL – Data Entry Operator (DEO)": "SSC Combined Higher Secondary Level (CHSL)",

    "RRB NTPC (Non-Technical Popular Categories)": "RRB NTPC",
    "RRB JE (Junior Engineer)": "RRB JE",
    "RRB Group D (Level 1 Posts)": "RRB Group D",
    "RRB ALP (Assistant Loco Pilot)": "RRB ALP",
    "RRB Technician (Grades 1 & 3)": "RRB Technician",
    "RPF Constable": "RPF Constable",
    "RPF Sub-Inspector (SI)": "RPF Sub-Inspector (SI)",
    "AFCAT": "AFCAT",
    "Indian Army Agniveer": "Indian Army Agniveer",
    "Coast Guard Navik / Yantrik": "Coast Guard Navik / Yantrik",
    "Military Nursing Service (MNS)": "Military Nursing Service (MNS)",

    "IBPS PO": "IBPS PO",
    "IBPS Clerk": "IBPS Clerk",
    "IBPS RRB Officer Scale I": "IBPS RRB Officer Scale I (PO)",
    "IBPS RRB Office Assistant": "IBPS RRB Office Assistant (Clerk)",
    "IBPS SO": "IBPS Specialist Officer (SO)",
    "SBI PO": "SBI PO",
    "SBI Clerk": "SBI Clerk",

    "RBI Grade B (DR – General)": "RBI Grade B",
    "RBI Grade B": "RBI Grade B",
    "RBI Assistant": "RBI Assistant",
    "NABARD Grade A (RDBS – General)": "NABARD Grade A",
    "NABARD Grade A": "NABARD Grade A",
    "NABARD Grade B (Manager)": "NABARD Grade B",
    "NABARD Grade B": "NABARD Grade B",
    "SIDBI Grade A (Assistant Manager)": "SIDBI Grade A",
    "SIDBI Grade A": "SIDBI Grade A",
    "EXIM Bank MT (Management Trainee)": "EXIM Bank Recruitment",
    "EXIM Bank MT": "EXIM Bank Recruitment",
    "EXIM Bank Recruitment": "EXIM Bank Recruitment",
    "IPPB Officer Scale-I (Variant 1 – Direct)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 1",
    "IBPS RRB Officer Scale-I (Variant 2 – IBPS Channel)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 2",
    "IBPS RRB Office Assistant (Variant 4 – Multipurpose)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 4",
    "IBPS RRB Officer Scale-II (Variant 5 – Specialist)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 5",
    "IBPS RRB Officer Scale-III (Variant 5 – Senior Manager)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 5"
};

// Helper: Extract only years from "2016, 2018 - Not conducted; 2020 - Deferred"
function extractYears(str) {
    if (!str) return "";
    const matches = str.match(/\b(20\d{2})\b/g);
    if (!matches) return "";
    return [...new Set(matches)].join(", ");
}

async function sync() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const normalizedData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'exam_database_normalized.json'), 'utf8'));
    const localTopicsPath = path.join(__dirname, '..', 'goverment_qb.topics.json');
    let localTopics = JSON.parse(fs.readFileSync(localTopicsPath, 'utf8'));

    const results = { matched: 0, unmatched: [], errors: [] };

    for (const ex of normalizedData) {
        const dbName = MAPPINGS[ex.exam_name] || ex.exam_name;
        const cleanNotConducted = extractYears(ex.not_conducted);
        const cleanRange = ex.year_range.replace(/\u2013|\u2014/g, "-").trim();

        const updateData = {
            year_range: cleanRange,
            not_conducted: cleanNotConducted,
            remarks: ex.remarks,
            exam_stages: ex.pattern
        };

        try {
            const res = await Topic.updateMany({ exam_name: dbName }, { $set: updateData });
            if (res.matchedCount > 0) {
                results.matched++;
                console.log(`✓ Updated [${dbName}] -> Range: ${cleanRange}, Gaps: ${cleanNotConducted}`);
                
                // Also update local JSON
                localTopics = localTopics.map(t => {
                    if (t.exam_name === dbName) {
                        return { ...t, ...updateData };
                    }
                    return t;
                });
            } else {
                results.unmatched.push(ex.exam_name);
                // console.warn(`? No match for [${ex.exam_name}]`);
            }
        } catch (err) {
            results.errors.push({ name: ex.exam_name, error: err.message });
        }
    }

    fs.writeFileSync(localTopicsPath, JSON.stringify(localTopics, null, 2));
    console.log("Local topics JSON updated.");

    console.log("\n--- SYNC SUMMARY ---");
    console.log(`Total Matched: ${results.matched}`);
    console.log(`Total Unmatched: ${results.unmatched.length}`);
    if (results.unmatched.length > 0) {
        console.log(`Unmatched Names: ${results.unmatched.join(", ")}`);
    }
    if (results.errors.length > 0) {
        console.log(`Errors: ${results.errors.length}`);
    }

    await mongoose.disconnect();
}

sync().catch(err => console.error(err));
