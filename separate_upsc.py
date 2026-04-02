import json
import os
import re

def separate_upsc_exams():
    input_files = [
        "upsc_2017 (1).json",
        "upsc_2018 (1).json",
        "upsc_2019 (1).json",
        "upsc_2020 (1).json",
        "upsc_2021 (1).json",
        "upsc_2022 (1).json"
    ]
    
    output_dir = "separated_upsc"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for file_name in input_files:
        if not os.path.exists(file_name):
            print(f"Skipping {file_name} (not found)")
            continue
            
        print(f"Processing {file_name}...")
        try:
            with open(file_name, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error loading {file_name}: {e}")
            continue
            
        if not isinstance(data, list):
            print(f"Error: {file_name} is not a list")
            continue
            
        # Group in memory
        groups = {}
        for item in data:
            exam_type = item.get("exam_type", "Unknown_UPSC")
            year = item.get("year", "Unknown_Year")
            
            # Sanitize names for filenames
            safe_type = re.sub(r'[^a-zA-Z0-9]', '_', exam_type).strip('_')
            safe_type = re.sub(r'_+', '_', safe_type)
            
            out_file_name = f"{safe_type}_{year}.json"
            if out_file_name not in groups:
                groups[out_file_name] = []
            groups[out_file_name].append(item)
            
        # Write files
        for out_file_name, items in groups.items():
            out_path = os.path.join(output_dir, out_file_name)
            
            # Check if file already exists from another input file - append
            existing_data = []
            if os.path.exists(out_path):
                with open(out_path, 'r', encoding='utf-8') as out_f:
                    existing_data = json.load(out_f)
            
            with open(out_path, 'w', encoding='utf-8') as out_f:
                json.dump(existing_data + items, out_f, indent=2)

    print("Separation complete.")

if __name__ == "__main__":
    separate_upsc_exams()
