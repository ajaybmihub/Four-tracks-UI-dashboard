import json
import os

files_to_update = [
    ('defense_other_2021.json', '2021'),
    ('defense_other_2024.json', '2024'),
    ('defense_other_2025.json', '2025')
]

for filename, year in files_to_update:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for item in data:
            item['year'] = year
            
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {filename} with year {year}")
    else:
        print(f"File {filename} not found.")
