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


function positionSuggestionsList(inputElement, suggestionList) {
    const inputRect = inputElement.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();

    suggestionList.style.top = `${inputRect.bottom - bodyRect.top + 5}px`;    
    //suggestionList.style.top = inputRect.bottom + 'px';
    suggestionList.style.left = `${inputRect.left}px`;
    suggestionList.style.width = `${inputRect.width}px`; // Set width to match the input box
}

function setupSuggestionBox(inputElement, suggestionList, data, idInput, urlInput, uri) {
    let selectedIndex = -1;

    inputElement.addEventListener('input', function () {
        const user_input = inputElement.value.toLowerCase();
        fetch(`${uri}?keywordInput=${user_input}`)
            .then(response => response.json())
            .then(dataResponse => {
                data = dataResponse;
                suggestionList.innerHTML = '';
                selectedIndex = -1;

                data.forEach((keyword, index) => {
                    const suggestion = document.createElement('li');
                    suggestion.textContent = keyword[0];
                    suggestion.addEventListener('click', function () {
                        inputElement.value = keyword[0];
                        idInput.value = keyword[1];
                        urlInput.value = keyword[2];
                        suggestionList.style.display = 'none';
                    });
                    suggestion.addEventListener('mouseenter', function () {
                        selectSuggestion(index);
                    });
                    suggestionList.appendChild(suggestion);
                });

                if (data.length > 0) {
                    suggestionList.style.display = 'block';
                    positionSuggestionsList(inputElement, suggestionList);
                } else {
                    suggestionList.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    inputElement.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            scrollSuggestions('up');
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            scrollSuggestions('down');
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const selectedSuggestion = suggestionList.children[selectedIndex];
            if (selectedSuggestion) {
                const keyword = data[selectedIndex];
                inputElement.value = keyword[0];
                idInput.value = keyword[1];
                urlInput.value = keyword[2];
                suggestionList.style.display = 'none';
            }
        }
    });

    suggestionList.addEventListener('mouseover', function (event) {
        if (event.target.tagName === 'LI') {
            selectSuggestion(Array.from(event.target.parentNode.children).indexOf(event.target));
        }
    });

    suggestionList.addEventListener('mouseout', function () {
        selectedIndex = -1;
        selectSuggestion(selectedIndex);
    });

    inputElement.addEventListener('focus', function () {
        if (selectedIndex !== -1) {
            selectSuggestion(selectedIndex);
        }
    });

    inputElement.addEventListener('blur', function () {
        selectedIndex = -1;
        selectSuggestion(selectedIndex);
    });

    function scrollSuggestions(direction) {
        const suggestions = suggestionList.children;
    
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
                const scrollPosition = suggestionList.scrollTop;
                const scrollHeight = suggestionList.scrollHeight;
    
                if (offsetTop < scrollPosition) {
                    suggestionList.scrollTop = offsetTop;
                } else if (offsetTop + selectedSuggestion.clientHeight > scrollPosition + suggestionList.clientHeight) {
                    suggestionList.scrollTop = offsetTop + selectedSuggestion.clientHeight - suggestionList.clientHeight;
                }
            }
        }
    }
    

    function selectSuggestion(index) {
        selectedIndex = index;
        const suggestions = suggestionList.children;

        for (let i = 0; i < suggestions.length; i++) {
            suggestions[i].classList.remove('selected');
        }

        suggestions[selectedIndex].classList.add('selected');
    }
}

// Setup for Wikidata
const keywordInput = document.getElementById('keyword');
const keywordIDInput = document.getElementById('keywordID');
const controlledVocabularyURLInput = document.getElementById('controlledVocabularyURL');
const suggestionsList = document.getElementById('suggestions');
let selectedIndex = -1;
let keyword_data = [];

setupSuggestionBox(
    keywordInput, 
    suggestionsList, 
    keyword_data, 
    keywordIDInput, 
    controlledVocabularyURLInput,
    '/search' 
);

// Setup for TEMA
// For TEMA keywords
const temaKeywordInput = document.getElementById('temaKeyword');
const temaKeywordIDInput = document.getElementById('temaKeywordID');
const temaControlledVocabularyURLInput = document.getElementById('temaControlledVocabularyURL');
const temaSuggestionsList = document.getElementById('temaSuggestions');
let temaSelectedIndex = -1;
let temaKeywordData = [];

setupSuggestionBox(
    temaKeywordInput, 
    temaSuggestionsList, 
    temaKeywordData, 
    temaKeywordIDInput, 
    temaControlledVocabularyURLInput,
    '/tema-search'
);



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
        case 'userKeywordContainer':
            return 'user_keyword[]';
        case 'chooseKeywordContainer':
            return 'choose_keyword[]', 'choose_keywordid[]', 'choose_cvoc_url[]';
        case 'temaKeywordContainer':
            return 'choose_tema_keyword[]', 'choose_tema_keywordid[]', 'choose_tema_cvoc_url[]';
        case 'vocabRecoContainer':
            return 'vocab_reco[]';
        default:
            return '';
    }
}

function getContainerClass(containerId) {
    switch (containerId) {
        case 'userKeywordContainer':
            return 'user-keyword-container';
        case 'chooseKeywordContainer':
            return 'choose-keyword-container';
        case 'temaKeywordContainer':
            return 'tema-keyword-container';
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
    
    var data = { 
        name: name,
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
        choose_tema_keyword: $('input[name="choose_tema_keyword[]"]').map(function () {
            return this.value
        }).get(),
        choose_tema_keywordid: $('input[name="choose_tema_keywordid[]"]').map(function () {
            return this.value
        }).get(),
        choose_tema_cvoc_url: $('input[name="choose_tema_cvoc_url[]"]').map(function () {
            return this.value
        }).get(),
        vocab_reco: $('input[name="vocab_reco[]"]').map(function () {
            return this.value;
        }).get(),  
        keyword_match: $('input[name="likert_scale_keyword"]:checked').val() ,
        index_suggestion: index_suggestion
    };

    $.ajax({
        type: 'POST',
        url: '/submit',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(data),
        success: function(response) {
            alert('Data submitted successfully!');
            //$('#dataForm')[0].reset();
        },
        error: function(error) {
            console.error('Error:', error);
            alert('An error occurred while submitting the form.');
        }
    });
}