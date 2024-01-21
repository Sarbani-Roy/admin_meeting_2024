from flask import Flask, render_template, request, jsonify
import openpyxl
from itertools import zip_longest
import requests
import os

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), 'templates'))

# Wikidata endpoint URL for fetching keywords
wikidata_endpoint = "https://www.wikidata.org/w/api.php"

# Function to fetch suggestions from Wikidata API
def get_wikidata_suggestions(user_input):
    params = {
        'action': 'wbsearchentities',
        'format': 'json',
        'search': user_input,
        'language': 'en',
    }

    response = requests.get(wikidata_endpoint, params=params)

    print(f"API Request URL: {response.url}")

    if response.status_code == 200:
        data = response.json()
        print(f"API Response Data: {data}")

        # Accumulate all suggestions in this list
        suggestions = []

        for result in data.get('search', []):
            suggestions.append((result['label'], result['id'], result.get('aliases', []), result['concepturi'], result['url']))

        return suggestions
    else:
        print(f"API Request failed with status code {response.status_code}. Response text: {response.text}")
        return []

# Load existing workbook or create a new one
excel_file = 'data.xlsx'
try:
    workbook = openpyxl.load_workbook(excel_file)
except FileNotFoundError:
    workbook = openpyxl.Workbook()
    workbook.active.append(['Dataverse Name', 'Subject area', 'Research field', 'Choosen discipline', 'Discipline reco', 'User Keyword' 'Wiki Keyword', 'Wiki URL','TEMA Keyword', 'TEMA URL', 'Vocab Suggestion', 'Subject area discipline match', 'Keyword match', 'Description match', 'Suggestion'])
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
    user_keywords = data.get('user_keyword', [])
    choose_keywords = data.get('choose_keyword', [])
    choose_cvoc_urls = data.get('choose_cvoc_url', [])
    vocab_recos = data.get('vocab_reco', [])
    
    # Append the form data to the sheet
    name = data['name']
    index_suggestion = data['index_suggestion']
    discipline_reco = data['discipline_reco']

    # Use get method to get the value or provide a default value if the key is not present
    subject_area_discipline_match = data.get('subject_area_discipline_match', '')
    keyword_match = data.get('keyword_match', '')
    description_match = data.get('description_match', '')

    for subject_area, research_field, choose_discipline, user_keyword, choose_keyword, choose_cvoc_url, vocab_reco in zip_longest(subject_areas, research_fields, choose_disciplines, user_keywords, choose_keywords, choose_cvoc_urls, vocab_recos, fillvalue=""):
        sheet.append([name, subject_area, research_field, choose_discipline, discipline_reco, user_keyword, choose_keyword, choose_cvoc_url, '', '', vocab_reco, subject_area_discipline_match, keyword_match, description_match, index_suggestion])
        name = ''
        discipline_reco = ''
        subject_area_discipline_match = ''
        keyword_match = ''
        description_match = ''
        index_suggestion = ''

    # Save the workbook
    workbook.save(excel_file)

    #'Subject area', 'Research field', 'Choosen discipline', 'discipline_reco', User Keyword' 'Wiki Keyword', 'Wiki URL','TEMA Keyword', 'TEMA URL', 'Vocab Suggestion', 'Dataverse Name', 'Subject area discipline match', 'Keyword match', 'Description match', 'suggestion'
    
    return jsonify({'success': True})

@app.route('/search')
def search():
    user_input = request.args.get('keywordInput', '').lower()
    matching_keywords = []

    if user_input:
        # Get suggestions from Wikidata API
        suggestions = get_wikidata_suggestions(user_input)

        # Map suggestions to the format expected by the frontend
        matching_keywords = [(label, qid, aliases, concept_uri, f"https://www.wikidata.org/wiki/{qid}") for label, qid, aliases, concept_uri, _ in suggestions]

    return jsonify(matching_keywords)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
