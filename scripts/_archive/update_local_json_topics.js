const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'goverment_qb.topics.json');
let topics = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const MAPPINGS = {
    // Sheet 2
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
    "CHSL – Data Entry Operator (DEO)": "SSC Combined Higher Secondary Level (CHSL)", // Note: DEO is part of CHSL

    "RRB NTPC (Non-Technical Popular Categories)": "RRB NTPC",
    "RRB JE (Junior Engineer)": "RRB JE",
    "RRB Group D (Level 1 Posts)": "RRB Group D",
    "RRB ALP (Assistant Loco Pilot)": "RRB ALP",
    "RRB Technician (Grades 1 & 3)": "RRB Technician",
    "RPF Constable": "RPF Constable",
    "RPF Sub-Inspector (SI)": "RPF SI",
    "AFCAT (Air Force Common Admission Test)": "AFCAT",

    // Sheet 3
    "IBPS PO\n(Probationary Officer)": "IBPS PO",
    "IBPS Clerk\n(Clerical Cadre)": "IBPS Clerk",
    "IBPS RRB Officer Scale I\n(RRB PO)": "IBPS RRB Officer Scale I (PO)",
    "IBPS RRB Office Assistant\n(RRB Clerk / Multipurpose)": "IBPS RRB Office Assistant (Clerk)",
    "IBPS SO\n(Specialist Officer – IT/Law/HR/Agri/Marketing/Rajbhasha)": "IBPS Specialist Officer (SO)",
    "SBI PO\n(Probationary Officer)": "SBI PO",
    "SBI Clerk\n(Junior Associates – Customer Support & Sales)": "SBI Clerk",

    // Sheet 4
    "RBI Grade B\n(DR – General)": "RBI Grade B",
    "RBI Assistant": "RBI Assistant",
    "NABARD Grade A\n(RDBS – General)": "NABARD Grade A",
    "NABARD Grade B\n(Manager)": "NABARD Grade B",
    "SIDBI Grade A\n(Assistant Manager)": "SIDBI Grade A",
    "EXIM Bank MT\n(Management Trainee)": "EXIM Bank Recruitment",
    "IPPB Officer Scale-I\n(Variant 1 – Direct)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 1",
    "IBPS RRB Officer Scale-I\n(Variant 2 – IBPS Channel)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 2",
    "IBPS RRB Office Assistant\n(Variant 4 – Multipurpose)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 4",
    "IBPS RRB Officer Scale-II\n(Variant 5 – Specialist)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 5",
    "IBPS RRB Officer Scale-III\n(Variant 5 – Senior Manager)": "IPPB / Regional Rural Bank (RBI-linked) Recruitment - Variant 5"
};

const DATA = [];

// Combine all manual data segments
const sheet2Data = [
    ["Civil Services Examination (CSE)", "2015-2025", ""],
    ["Indian Forest Service (IFoS)", "2015-2025", ""],
    ["Engineering Services Examination (ESE / IES)", "2015-2025", ""],
    ["Combined Defence Services (CDS)", "2015-2025", ""],
    ["National Defence Academy & Naval Academy (NDA & NA)", "2015-2025", ""],
    ["Combined Medical Services (CMS)", "2015-2025", ""],
    ["Indian Economic Service / Indian Statistical Service (IES/ISS)", "2015-2025", ""],
    ["Combined Geo-Scientist Examination", "2015-2025", ""],
    ["EPFO – Enforcement Officer / Accounts Officer", "2015-2025", "2016, 2018"],
    ["Central Armed Police Forces – Assistant Commandant (CAPF AC)", "2015-2025", ""],
    ["Combined Graduate Level (CGL)", "2015-2025", ""],
    ["Combined Higher Secondary Level (CHSL)", "2015-2025", ""],
    ["Multi Tasking Staff (MTS)", "2015-2025", "2016"],
    ["GD Constable", "2015-2025", "2016, 2017, 2022"],
    ["Junior Engineer (JE)", "2015-2025", ""],
    ["CPO – Sub-Inspector (SI) in Delhi Police / CAPFs", "2015-2025", ""],
    ["Stenographer Grade C & D", "2015-2025", ""],
    ["RRB NTPC (Non-Technical Popular Categories)", "2015-2025", "2016, 2017, 2018, 2022, 2024"],
    ["RRB JE (Junior Engineer)", "2015-2025", "2015, 2016, 2017, 2020, 2022, 2023"],
    ["RRB Group D (Level 1 Posts)", "2015-2025", "2015, 2016, 2017, 2020, 2021, 2023"],
    ["RRB ALP (Assistant Loco Pilot)", "2015-2025", "2015, 2016, 2017, 2020, 2021, 2022, 2023"],
    ["RRB Technician (Grades 1 & 3)", "2015-2025", "2015, 2016, 2017, 2020, 2021, 2022, 2023"],
    ["RPF Constable", "2015-2025", "2015, 2016, 2017, 2020, 2021, 2022"],
    ["RPF Sub-Inspector (SI)", "2015-2025", "2015, 2016, 2017, 2020, 2021, 2022"],
    ["AFCAT (Air Force Common Admission Test)", "2015-2025", ""]
];

const sheet3Data = [
    ["IBPS PO\n(Probationary Officer)", "2015-2024", ""],
    ["IBPS Clerk\n(Clerical Cadre)", "2015-2024", ""],
    ["IBPS RRB Officer Scale I\n(RRB PO)", "2015-2024", ""],
    ["IBPS RRB Office Assistant\n(RRB Clerk / Multipurpose)", "2015-2024", ""],
    ["IBPS SO\n(Specialist Officer – IT/Law/HR/Agri/Marketing/Rajbhasha)", "2015-2025", ""],
    ["SBI PO\n(Probationary Officer)", "2015-2024", ""],
    ["SBI Clerk\n(Junior Associates – Customer Support & Sales)", "2015-2024", "2016, 2017"]
];

const sheet4Data = [
    ["RBI Grade B\n(DR – General)", "2009-2025", "2020, 2022"],
    ["RBI Assistant", "2012-2023", "2013, 2015, 2016, 2019, 2021, 2022"],
    ["NABARD Grade A\n(RDBS – General)", "2014-2024", "2016, 2020, 2022"],
    ["NABARD Grade B\n(Manager)", "2014-2024", "2016, 2019, 2020, 2022"],
    ["SIDBI Grade A\n(Assistant Manager)", "2016-2024", "2017, 2018, 2020, 2022"],
    ["EXIM Bank MT\n(Management Trainee)", "2014-2024", "2015, 2016, 2018, 2020, 2022"],
    ["IPPB Officer Scale-I\n(Variant 1 – Direct)", "2017-2023", "2019, 2020, 2022"],
    ["IBPS RRB Officer Scale-I\n(Variant 2 – IBPS Channel)", "2012-2024", "2020"],
    ["IBPS RRB Office Assistant\n(Variant 4 – Multipurpose)", "2012-2024", "2020"],
    ["IBPS RRB Officer Scale-II\n(Variant 5 – Specialist)", "2012-2024", "2020"],
    ["IBPS RRB Officer Scale-III\n(Variant 5 – Senior Manager)", "2012-2024", "2020"]
];

const allUpdates = [...sheet2Data, ...sheet3Data, ...sheet4Data];

allUpdates.forEach(([csvName, range, gaps]) => {
    const dbName = MAPPINGS[csvName] || csvName;
    const cleanRange = range.replace(/\u2013|\u2014/g, "-").trim();
    const cleanNotConducted = gaps.replace(/None|conducted every year|deferred|no notification/gi, "").trim();

    topics.forEach(t => {
        if (t.exam_name === dbName) {
            t.year_range = cleanRange;
            t.not_conducted = cleanNotConducted;
        }
    });
});

fs.writeFileSync(filePath, JSON.stringify(topics, null, 2));
console.log('Local topics JSON updated.');
