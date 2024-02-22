from flask import Flask, render_template, request, jsonify
import openpyxl
from itertools import zip_longest
import requests
import os
import multiprocessing
from multiprocessing import Process
import turtle
from rdflib import Graph
from rdflib.namespace import SKOS

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


def draw_tree_and_listen(turtle_file_path, x, y, gap_broader, gap_narrower, result_queue):
    def draw_tree(concepts, x, y, parent_label, gap):
        turtle.penup()
        turtle.goto(x, y)
        turtle.pendown()

        turtle.hideturtle()
        if parent_label is not None:
            turtle.write(parent_label, font=("Arial", 12, "normal"))

        coordinate_x = x + 20
        coordinate_y = y - 20
        y = coordinate_y

        turtle.goto(x, y)
        coordinate = {}
        node_rectangles = {}

        for concept in concepts:
            if len(list(g.objects(concept, SKOS.prefLabel))) > 0:
                label = list(g.objects(concept, SKOS.prefLabel))[0].value

            turtle.goto(x, y)
            turtle.goto(coordinate_x, y)
            turtle.write(label, font=("Arial", 10, "normal"))
            turtle.goto(x, y)

            coordinate[concept] = (coordinate_x, y)

            label_width = 50
            label_height = 15
            node_rectangles[concept] = (coordinate_x, y, coordinate_x + label_width, y + label_height)

            coordinate_y = y - gap
            y = coordinate_y

        return coordinate, node_rectangles

    def on_click(x, y):

        nonlocal result_queue  
        # nonlocal g, node_rectangles

        clicked_label = None
        for concept, rect in node_rectangles.items():
            print(f'concept: {concept}, rect: {rect}')
            x1, y1, x2, y2 = rect
            if x1 <= x <= x2 and y1 <= y <= y2:
                if len(list(g.objects(concept, SKOS.prefLabel))) > 0:
                    clicked_label = list(g.objects(concept, SKOS.prefLabel))[0].value
                    print(f'clicked concept: {clicked_label}')
                    #clicked_labels.append(label)

        result_queue.put(clicked_label)
        #return clicked_label

    # Load the Turtle file
    g = Graph()
    g.parse(turtle_file_path, format="turtle")

    # Get the broader concepts using a set to ensure uniqueness
    broader_concepts = set(g.objects(None, SKOS.hasTopConcept))

    # Set up the turtle window
    turtle.speed(10)
    turtle.width(2)

    node_rectangles = {}

    if broader_concepts:
        (coordinate, node_rectangles) = draw_tree(broader_concepts, x, y, "DFG", gap_broader)

        for broader_concept in broader_concepts:
            (coordinate_x, coordinate_y) = coordinate[broader_concept]
            narrower_concepts = set(g.objects(broader_concept, SKOS.narrower))
            draw_tree(narrower_concepts, coordinate_x, coordinate_y, None, gap_narrower)

    else:
        print("DFG broader concept not found in the given Turtle file.")

    # Bind the callback function to the mouse click event
    turtle.onscreenclick(on_click)

    # Keep the window open
    turtle.mainloop()

    #result_queue.put("Finished")


def get_dfg_classification():
    result_queue = multiprocessing.Queue()
    p = Process(target=draw_tree_and_listen, args=("output_skos_min.ttl", -370, 350, 60, 20, result_queue))
    p.start()
    #p.join()  # Wait for the process to finish

    result = result_queue.get()
    print("Result from turtle process:", result)

    return result


@app.route('/get_dfg_classification')
def get_dfg_classification_route():
    dfg_classification = get_dfg_classification()
    print(dfg_classification)
    return jsonify({'dfgClassification': dfg_classification})


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
    app.run(debug=True, host='0.0.0.0', port=8080)
