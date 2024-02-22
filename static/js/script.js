// For questions
// To add serial numbers to questions
document.addEventListener("DOMContentLoaded", function() {
    var formQuestions = document.querySelectorAll('.form-question');

    formQuestions.forEach(function(question, index) {
        // Add serial number to each question
        question.dataset.serialNumber = index + 1;

        // Add serial number as a prefix to the question text
        question.innerHTML = (index + 1) + ". " + question.innerHTML;
    });
});


// Function to load graph.html content into #graphContainer
function loadGraphContent() {
    $('#graphContainer').load('graph.html');
}

// Add a click event listener to the 'DFG Classification' button
$(document).ready(function() {
    // Load graph content on button click
    $('#chooseDisciplineContainer .dfg-button').click(function() {
        loadGraphContent();
    });
});

// Load graph content when the page initially loads
$(document).ready(function() {
    loadGraphContent();
});


// For keywords
// To set the position of the suggestions list
function positionSuggestionsList() {
    
    const inputRect = keywordInput.getBoundingClientRect();
    console.log('Input Rect:', inputRect);
    suggestionsList.style.top = inputRect.bottom + 'px';
    suggestionsList.style.left = inputRect.left + 'px';
    suggestionsList.style.width = inputRect.width + 'px'; // Set width to match the input box
}

const keywordInput = document.getElementById('keyword');
const keywordIDInput = document.getElementById('keywordID');
const controlledVocabularyURLInput = document.getElementById('controlledVocabularyURL');
const suggestionsList = document.getElementById('suggestions');
let selectedIndex = -1;
let keyword_data = [];

keywordInput.addEventListener('input', function () {
    const user_input = keywordInput.value.toLowerCase();
    fetch(`/search?keywordInput=${user_input}`)
        .then(response => response.json())
        .then(dataResponse => {
            keyword_data = dataResponse;
            suggestionsList.innerHTML = '';
            selectedIndex = -1;

            keyword_data.forEach((keyword, index) => {
                const suggestion = document.createElement('li');
                suggestion.textContent = keyword[0];
                suggestion.addEventListener('click', function () {
                    keywordInput.value = keyword[0];
                    keywordIDInput.value = keyword[1];
                    controlledVocabularyURLInput.value = keyword[4];
                    suggestionsList.style.display = 'none';
                });
                suggestion.addEventListener('mouseenter', function () {
                    selectSuggestion(index);
                });
                suggestionsList.appendChild(suggestion);
            });

            if (keyword_data.length > 0) {
                suggestionsList.style.display = 'block';
                positionSuggestionsList();
            } else {
                suggestionsList.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

keywordInput.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        scrollSuggestions('up');
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        scrollSuggestions('down');
    } else if (event.key === 'Enter') {
        event.preventDefault();
        const selectedSuggestion = suggestionsList.children[selectedIndex];
        if (selectedSuggestion) {
            const keyword = keyword_data[selectedIndex];
            keywordInput.value = keyword[0];
            keywordIDInput.value = keyword[1];
            controlledVocabularyURLInput.value = keyword[4];
            suggestionsList.style.display = 'none';
        }
    }
});

//  event listeners to handle mouse selection and highlight suggestions
suggestionsList.addEventListener('mouseover', function (event) {
    if (event.target.tagName === 'LI') {
        selectSuggestion(Array.from(event.target.parentNode.children).indexOf(event.target));
    }
});

suggestionsList.addEventListener('mouseout', function () {
    selectedIndex = -1;
    selectSuggestion(selectedIndex);
});

keywordInput.addEventListener('focus', function () {
    if (selectedIndex !== -1) {
        selectSuggestion(selectedIndex);
    }
});

keywordInput.addEventListener('blur', function () {
    selectedIndex = -1;
    selectSuggestion(selectedIndex);
});  

function dfg() {
    fetch('/get_dfg_classification')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(dfgdata => {
            // Update the input field with the returned DFG classification
            var dfgClassificationResult = document.querySelector('#chooseDisciplineContainer input[name="choose_discipline[]"]');
            if (dfgClassificationResult) {
                dfgClassificationResult.value = dfgdata.dfgClassification;
            }
        })
        .catch(error => {
            console.error('Error fetching DFG classification:', error);
            alert('An error occurred while fetching DFG classification.');
        });
}

// Function to get DFG classification
/*function dfg() {
    $.ajax({
        type: 'GET',
        url: '/get_dfg_classification',
        success: function(response) {
            // Update the input field with the returned DFG classification
            var dfgClassificationResult = document.querySelector('#chooseDisciplineContainer input[name="choose_discipline[]"]');
            if (dfgClassificationResult) {
                dfgClassificationResult.value = response.dfgClassification;
            }
        },
        error: function(error) {
            console.error('Error fetching DFG classification:', error);
            alert('An error occurred while fetching DFG classification.');
        }
    });*/
    // Get the input element
    //var disciplineInput = document.querySelector('#chooseDisciplineContainer input[name="choose_discipline[]"]');

    // Set its value to "DFG"
    //if (disciplineInput) {
        //disciplineInput.value = "DFG";
    //}

function scrollSuggestions(direction) {
    const suggestions = suggestionsList.children;

    if (suggestions.length > 0) {
        if (direction === 'up' && selectedIndex > 0) {
            selectedIndex -= 1;
        } else if (direction === 'down' && selectedIndex < suggestions.length - 1) {
            selectedIndex += 1;
        }

        selectedIndex = Math.max(0, Math.min(selectedIndex, suggestions.length - 1));

        for (let i = 0; i < suggestions.length; i++) {
            suggestions[i].classList.remove('selected');
        }

        const selectedSuggestion = suggestions[selectedIndex] || null;

        if (selectedSuggestion) {
            selectedSuggestion.classList.add('selected');
            
            const offsetTop = selectedSuggestion.offsetTop;
            const scrollPosition = suggestionsList.scrollTop;
            const scrollHeight = suggestionsList.scrollHeight;

            if (offsetTop < scrollPosition) {
                suggestionsList.scrollTop = offsetTop;
            } else if (offsetTop + selectedSuggestion.clientHeight > scrollPosition + suggestionsList.clientHeight) {
                suggestionsList.scrollTop = offsetTop + selectedSuggestion.clientHeight - suggestionsList.clientHeight;
            }
        }
    }
}


function selectSuggestion(index) {
    selectedIndex = index;
    const suggestions = suggestionsList.children;

    for (let i = 0; i < suggestions.length; i++) {
        suggestions[i].classList.remove('selected');
    }

    suggestions[selectedIndex].classList.add('selected');
}

function addInput(containerId) {
    var container = document.getElementById(containerId);

    // Clone the original input group within the specified container
    var originalInputGroup = container.querySelector('.input-group');
    var newInputGroup = originalInputGroup.cloneNode(true);

    // Reset values in the cloned input group
    var inputs = newInputGroup.querySelectorAll('input[type="text"]');
    inputs.forEach(function (input) {
        input.value = '';
    });

    // Create a new button element for add
    var addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = '+';
    addButton.onclick = function () {
        addInput(containerId);
    };

    // Create a new button element for removal
    var removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = '-';
    removeButton.onclick = function () {
        removeInput(this);
    };

    // Append the new input group, add button, and remove button to the container
    var newContainer = document.createElement('div');
    newContainer.classList.add(getContainerClass(containerId));
    newContainer.appendChild(newInputGroup);
    newContainer.appendChild(addButton);
    newContainer.appendChild(removeButton);

    // Insert the new container after the current container
    container.parentNode.insertBefore(newContainer, container.nextSibling);
}

function getInputName(containerId) {
    switch (containerId) {
        case 'subjectAreasContainer':
            return 'subject_area[]';
        case 'researchFieldContainer':
            return 'research_field[]';
        case 'chooseDisciplineContainer':
            return 'choose_discipline[]';
        case 'userKeywordContainer':
            return 'user_keyword[]';
        case 'chooseKeywordContainer':
            return 'choose_keyword[]', 'choose_keywordid[]', 'choose_cvoc_url[]';
        case 'vocabRecoContainer':
            return 'vocab_reco[]';
        default:
            return '';
    }
}

function getContainerClass(containerId) {
    switch (containerId) {
        case 'subjectAreasContainer':
            return 'subject-area-container';
        case 'researchFieldContainer':
            return 'research-field-container';
        case 'chooseDisciplineContainer':
            return 'choose-discipline-container';
        case 'userKeywordContainer':
            return 'user-keyword-container';
        case 'chooseKeywordContainer':
            return 'choose-keyword-container';
        case 'vocabRecoContainer':
            return 'vocab-reco-container';
        default:
            return '';
    }
}

function removeInput(button) {
    var container = button.parentNode;

    // Extract the container class from the container
    var containerClass = container.classList[0];

    // Ensure there's at least one input before trying to remove
    if (document.querySelectorAll('.' + containerClass).length >= 1) {
        container.parentNode.removeChild(container);
    }
}

function submitForm() {

    var name = $('#name').val();
    var index_suggestion = $('#index_suggestion').val()
    var discipline_reco = $('#discipline_reco').val()
    var data = { 
        name: name,
        subject_area: $('input[name="subject_area[]"]').map(function () {
            return this.value;
        }).get(),
        research_field: $('input[name="research_field[]"]').map(function () {
            return this.value;
        }).get(),
        choose_discipline: $('input[name="choose_discipline[]"]').map(function () {
            return this.value;
        }).get(),
        discipline_reco: discipline_reco,
        user_keyword: $('input[name="user_keyword[]"]').map(function () {
            return this.value;
        }).get(),                
        choose_keyword: $('input[name="choose_keyword[]"]').map(function () {
            return this.value
        }).get(),
        choose_keywordid: $('input[name="choose_keywordid[]"]').map(function () {
            return this.value
        }).get(),
        choose_cvoc_url: $('input[name="choose_cvoc_url[]"]').map(function () {
            return this.value
        }).get(),
        vocab_reco: $('input[name="vocab_reco[]"]').map(function () {
            return this.value;
        }).get(),  
        subject_area_discipline_match: $('input[name="likert_scale_subject[]"]:checked').val() || '',
        keyword_match: $('input[name="likert_scale_keyword[]"]:checked').val() || '',
        description_match: $('input[name="likert_scale_description[]"]:checked').val() || '',
        index_suggestion: index_suggestion
    };

    $.ajax({
        type: 'POST',
        url: '/submit',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(data),
        success: function(response) {
            alert('Data submitted successfully!');
            $('#dataForm')[0].reset();
        },
        error: function(error) {
            console.error('Error:', error);
            alert('An error occurred while submitting the form.');
        }
    });
}