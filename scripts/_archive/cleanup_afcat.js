const fs = require('fs');
const path = require('path');

const filesToProcess = [
  { path: 'AFCAT - 2021.json', year: '2021' },
  { path: 'AFCAT - 2022.json', year: '2022' },
  { path: 'AFCAT - 2023.json', year: '2023' },
  { path: 'AFCAT_-_2024.json', year: '2024' }
];

filesToProcess.forEach(({ path: fileName, year }) => {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${fileName}`);
    return;
  }

  console.log(`Processing ${fileName}...`);
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.error(`Error parsing ${fileName}:`, e.message);
      return;
    }

    if (!Array.isArray(data)) {
      console.error(`${fileName} is not an array.`);
      return;
    }

    const cleanedData = data.map(item => {
      const newItem = { ...item };
      
      // 1. Set year
      newItem.year = year;
      
      // 2. Set exam_type
      newItem.exam_type = "AFCAT";

      // 3. Clean up unknown/undefined elements
      Object.keys(newItem).forEach(key => {
        const value = newItem[key];
        if (value === "unknown" || value === "notdefined" || value === "null" || value === null || value === undefined || (typeof value === 'string' && value.toLowerCase() === 'undefined')) {
          newItem[key] = ""; // Replace with empty string or handle accordingly
        }
        
        // Detailed check for options if it's an object
        if (key === 'option' && typeof value === 'object' && value !== null) {
          Object.keys(value).forEach(optKey => {
            if (value[optKey] === "unknown" || value[optKey] === "notdefined" || value[optKey] === null) {
              value[optKey] = "";
            }
          });
        }
      });

      return newItem;
    });

    fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2), 'utf8');
    console.log(`Successfully cleaned and updated ${fileName}.`);
  } catch (err) {
    console.error(`Failed to process ${fileName}:`, err.message);
  }
});
