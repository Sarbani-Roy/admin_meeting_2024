from flask import Flask, render_template, request, jsonify
import openpyxl
from itertools import zip_longest
import requests
import os

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), 'templates'))

# Function to fetch suggestions from Wikidata API
def get_wikidata_suggestions(user_input):
    params = {
        'action': 'wbsearchentities',
        'format': 'json',
        'search': user_input,
        'language': 'en',
        'limit': 50,
    }

    wikidata_endpoint = "https://www.wikidata.org/w/api.php"

    response = requests.get(wikidata_endpoint, params=params)

    # print(f"API Request URL: {response.url}")

    if response.status_code == 200:
        data = response.json()
        # print(f"API Response Data: {data}")

        # Accumulate all suggestions in this list
        suggestions = []

        for result in data.get('search', []):
            #suggestions.append((result['label'], result['id'], result.get('aliases', []), result['concepturi'], result['url']))
            suggestions.append((result['label'], result['id'], result['url']))

        return suggestions
    else:
        print(f"API Request failed with status code {response.status_code}. Response text: {response.text}")
        return []

@app.route('/search')
def search():
    user_input = request.args.get('keywordInput', '').lower()
    matching_keywords = []

    if user_input:
        # Get suggestions from Wikidata API
        suggestions = get_wikidata_suggestions(user_input)
        matching_keywords = [(label, qid, f"https{url}") for label, qid, url in suggestions]
        print(matching_keywords)

    return jsonify(matching_keywords)


# Function to fetch suggestions from the TEMA API
def get_tema_suggestions(user_input):
    
    params = {
        'format': 'json',
        'q': user_input,
        'ontology': 'tema',
        'rows': '50',
        'start': '1'
        }
    
    tibapi = "https://service.tib.eu/ts4tib/api/search?"

    response = requests.get(tibapi, params=params)
    print(f"API Request URL: {response.url}")

    if response.status_code == 200:
        data = response.json()
        #print(data)
        suggestions = []

        for result in data['response']['docs']:
            print(result['label'])
            suggestions.append((result['label'], result['short_form'], result['iri']))
        return suggestions
    else:
        print(f"API Request failed with status code {response.status_code}. Response text: {response.text}")
        return []
    
@app.route('/tema-search')
def tema_search():
    user_input = request.args.get('keywordInput', '').lower()
    matching_keywords = []

    if user_input:
        # Get suggestions from TEMA API
        suggestions = get_tema_suggestions(user_input)
        matching_keywords = [(label, id, iri) for label, id, iri in suggestions]

    return jsonify(matching_keywords)



# Load existing workbook or create a new one
excel_file = 'data.xlsx'
try:
    workbook = openpyxl.load_workbook(excel_file)
except FileNotFoundError:
    workbook = openpyxl.Workbook()
    workbook.active.append(['Dataverse Name', 'User Keyword', 'Wiki Keyword', 'Wiki URL','TEMA Keyword', 'TEMA URL', 'Vocab Suggestion', 'Keyword match', 'Suggestion'])
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

    # Append the form data to the sheet
    user_keywords = data.get('user_keyword', [])
    choose_keywords = data.get('choose_keyword', [])
    choose_cvoc_urls = data.get('choose_cvoc_url', [])
    choose_tema_keywords = data.get('choose_tema_keyword', [])
    choose_tema_cvoc_urls = data.get('choose_tema_cvoc_url', [])
    vocab_recos = data.get('vocab_reco', [])    
    name = data['name']
    index_suggestion = data['index_suggestion']
    keyword_match = data.get('keyword_match', '')

    for user_keyword, choose_keyword, choose_cvoc_url, choose_tema_keyword, choose_tema_cvoc_url, vocab_reco in zip_longest(user_keywords, choose_keywords, choose_cvoc_urls,choose_tema_keywords, choose_tema_cvoc_urls, vocab_recos, fillvalue=""):
        sheet.append([name, user_keyword, choose_keyword, choose_cvoc_url, choose_tema_keyword, choose_tema_cvoc_url, vocab_reco, keyword_match, index_suggestion])
        name = ''
        keyword_match = ''
        index_suggestion = ''

    # Save the workbook
    workbook.save(excel_file)

    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
