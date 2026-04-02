import json
import os
import re

def sanitize_filename(filename):
    return re.sub(r'[^a-zA-Z0-9_-]', '_', filename)

import glob

def separate_exams(input_files):
    # Dictionary to hold grouped data: {exam_type: {year: [items]}}
    grouped_data = {}

    for input_file in input_files:
        if not os.path.exists(input_file):
            print(f"File {input_file} not found.")
            continue
            
        with open(input_file, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"Error loading {input_file}: {e}")
                continue

        for item in data:
            # Handle potential None values or missing keys
            exam_type = str(item.get('exam_type', 'Unknown_Exam'))
            year = str(item.get('year', 'Unknown_Year'))
            
            if exam_type not in grouped_data:
                grouped_data[exam_type] = {}
            
            if year not in grouped_data[exam_type]:
                grouped_data[exam_type][year] = []
            
            grouped_data[exam_type][year].append(item)

    # Create a directory for separated files if needed
    output_dir = "separated_exams"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for exam_type, years in grouped_data.items():
        for year, items in years.items():
            # Clean up exam_type for filename
            clean_type = sanitize_filename(exam_type)
            filename = f"{clean_type}_{year}.json"
            file_path = os.path.join(output_dir, filename)
            
            # If file already exists, we might want to append or just overwrite with combined data
            # Here we are overwrite with unique set of items across all files
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(items)} items to {file_path}")

if __name__ == "__main__":
    # Include both defense_*.json and defense_other_*.json
    files = glob.glob("defense*.json")
    print(f"Found files: {files}")
    separate_exams(files)
