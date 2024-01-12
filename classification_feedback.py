from flask import Flask, render_template, request, jsonify
import openpyxl
from itertools import zip_longest

app = Flask(__name__)

# Load existing workbook or create a new one
excel_file = 'data.xlsx'
try:
    workbook = openpyxl.load_workbook(excel_file)
except FileNotFoundError:
    workbook = openpyxl.Workbook()
    workbook.active.append(['Name', 'Subject area', 'Research field', 'Choosen discipline', 'Subject area discipline match', 'Choosen keyword', 'Keyword match', 'Description match'])
    workbook.save(excel_file)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    data = None
    data = request.get_json()
    print(data)

    # Open the default sheet
    sheet = workbook.active

    # Check if 'subject_area' and 'research_field' are present in the data
    subject_areas = data.get('subject_area', [])
    research_fields = data.get('research_field', [])
    choose_disciplines = data.get('choose_discipline', [])
    choose_keywords = data.get('choose_keyword', [])
    
    # Append the form data to the sheet
    name = data['name']

    # Use get method to get the value or provide a default value if the key is not present
    subject_area_discipline_match = data.get('subject_area_discipline_match', '')
    keyword_match = data.get('keyword_match', '')
    description_match = data.get('description_match', '')

    for subject_area, research_field, choose_discipline, choose_keyword in zip_longest(subject_areas, research_fields, choose_disciplines, choose_keywords, fillvalue=""):
        sheet.append([name, subject_area, research_field, choose_discipline, subject_area_discipline_match, choose_keyword, keyword_match, description_match])
        name = ''
        subject_area_discipline_match = ''
        keyword_match = ''
        description_match = ''

    # Save the workbook
    workbook.save(excel_file)
    
    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True)
