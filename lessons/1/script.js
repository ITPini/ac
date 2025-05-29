let currentSection = 'introduction';
const completedSections = new Set();
const totalSections = 9; // Update if more sections are added

// DOM Elements (cache them for performance)
let progressFill, progressText;

// --- Global State Variables ---
// Formal Languages
let currentAlphabetSet = new Set();
let generatedWordsCount = 0;
let sigmaStarWords = ['ε'];
let sigmaStarLimit = 10;

// DTM Operation Tracer
let traceTapeData = [];
let currentTraceStep = 0;
let traceInterval = null;
const BLANK_SYMBOL = '⊔';
let traceMachineLogic = { // Logic for "starts and ends with the same symbol"
    initialState: 'q0',
    tape: [],
    head: 0,
    states: {
        'q0': (symbol) => { // Read first symbol and remember it
            if (symbol === 'a') return { nextState: 'q_scan_a', write: symbol, move: 'R', action: "Read 'a', remember 'a', move right." };
            if (symbol === 'b') return { nextState: 'q_scan_b', write: symbol, move: 'R', action: "Read 'b', remember 'b', move right." };
            if (symbol === BLANK_SYMBOL) return { nextState: 'accept', write: BLANK_SYMBOL, move: 'S', action: "Empty string, accept." }; // Accept empty string
            return { nextState: 'reject', write: symbol, move: 'S', action: "Invalid start symbol, reject." };
        },
        'q_scan_a': (symbol) => { // Remembered 'a', scan to the end
            if (symbol === 'a' || symbol === 'b') return { nextState: 'q_scan_a', write: symbol, move: 'R', action: "Scanning right for end." };
            if (symbol === BLANK_SYMBOL) return { nextState: 'q_check_a_prev', write: BLANK_SYMBOL, move: 'L', action: "Found end, move left to check last symbol." };
            return { nextState: 'reject', write: symbol, move: 'S', action: "Invalid symbol, reject." };
        },
        'q_scan_b': (symbol) => { // Remembered 'b', scan to the end
            if (symbol === 'a' || symbol === 'b') return { nextState: 'q_scan_b', write: symbol, move: 'R', action: "Scanning right for end." };
            if (symbol === BLANK_SYMBOL) return { nextState: 'q_check_b_prev', write: BLANK_SYMBOL, move: 'L', action: "Found end, move left to check last symbol." };
            return { nextState: 'reject', write: symbol, move: 'S', action: "Invalid symbol, reject." };
        },
        'q_check_a_prev': (symbol) => { // At position before blank, checking for 'a'
             // If tape was "a", head is now at index 0. If "aa", head is at index 1.
            if (traceMachineLogic.head < 0) return { nextState: 'reject', write: symbol, move: 'S', action: "Moved off left of tape unexpectedly, reject." }; // Should not happen if input is valid
            if (symbol === 'a') return { nextState: 'accept', write: symbol, move: 'S', action: "Ends with 'a', accept." };
            return { nextState: 'reject', write: symbol, move: 'S', action: "Does not end with 'a', reject." };
        },
        'q_check_b_prev': (symbol) => { // At position before blank, checking for 'b'
            if (traceMachineLogic.head < 0) return { nextState: 'reject', write: symbol, move: 'S', action: "Moved off left of tape unexpectedly, reject." };
            if (symbol === 'b') return { nextState: 'accept', write: symbol, move: 'S', action: "Ends with 'b', accept." };
            return { nextState: 'reject', write: symbol, move: 'S', action: "Does not end with 'b', reject." };
        },
        'accept': (symbol) => ({ final: true, accepted: true, action: "Accepted." }),
        'reject': (symbol) => ({ final: true, accepted: false, action: "Rejected." })
    }
};


// Execution Tracer
let executionData = {
    tape: [],
    head: 0,
    state: 'q0',
    step: 0,
    history: [],
    inputString: ''
};
let execInterval = null;
// Simplified TM logic for {0^n 1^n} - This is a placeholder. A real one is more complex.
// This example TM will just check for "0011" specifically for simplicity in this context.
// A full 0^n1^n TM is complex and better suited for the interactive TM builder.
let execMachineLogic = {
    initialState: 'q0',
    acceptState: 'accept',
    rejectState: 'reject',
    transitions: {
        'q0': {
            '0': { nextState: 'q1', write: 'X', move: 'R' }, // Mark 0, move right
            'Y': { nextState: 'q3', write: 'Y', move: 'R' }, // Seen all 0s, look for end
            '⊔': { nextState: 'reject', write: '⊔', move: 'S' } // Empty or invalid
        },
        'q1': {
            '0': { nextState: 'q1', write: '0', move: 'R' }, // Scan right for 1
            'Y': { nextState: 'q1', write: 'Y', move: 'R' }, // Scan past marked 1s
            '1': { nextState: 'q2', write: 'Y', move: 'L' }  // Mark 1, move left
        },
        'q2': {
            'Y': { nextState: 'q2', write: 'Y', move: 'L' }, // Scan left for X
            '0': { nextState: 'q2', write: '0', move: 'L' },
            'X': { nextState: 'q0', write: 'X', move: 'R' }  // Found X, move right to find next 0
        },
        'q3': {
            'Y': { nextState: 'q3', write: 'Y', move: 'R' }, // Scan past all Ys
            '⊔': { nextState: 'accept', write: '⊔', move: 'S' } // All matched, accept
        }
    }
};


// Language Classes
const languageExampleData = {
    halting: { title: "Halting Problem (L_H)", content: "L_H = {⟨M,w⟩ | DTM M halts on input w}. This language is Computably Enumerable (CE) but NOT Computable. Its undecidability is proven by diagonalization." },
    prime: { title: "Prime Numbers (L_PRIME)", content: "L_PRIME = {w | w is the binary representation of a prime number}. This language is Computable. The AKS algorithm decides primality in polynomial time." },
    balanced: { title: "Balanced Parentheses (L_BAL)", content: "L_BAL = {w ∈ {(,)}* | w has balanced parentheses}. Example: (()), (()()). This language is Context-Free, recognized by a Pushdown Automaton. It's also Computable." },
    binary: { title: "Binary strings ending in 01 (L_01)", content: "L_01 = {w ∈ {0,1}* | w ends with 01}. Example: 101, 001. This language is Regular, recognized by a Finite Automaton. It's also Computable." }
};

// Interactive TM
let currentTM = null;
let interactiveTape = [];
let interactiveHead = 0;
let interactiveState = 'q0';
let interactiveSteps = 0;
let interactiveStatus = 'Ready';
let interactiveInterval = null;
const TAPE_SIZE = 15; // Number of cells to display
const TM_BLANK = '⊔';

const tmExamples = {
    'binary-increment': {
        description: "Adds 1 to a binary number (e.g., 1011 -> 1100). Input is LSB first (e.g. 1101 for 13).",
        initialState: 'q0',
        acceptState: 'halt_accept',
        blank: TM_BLANK,
        delta: {
            'q0': { // Scan right to find the end of the number (first blank or start of tape if empty)
                '0': { nextState: 'q0', write: '0', move: 'R' },
                '1': { nextState: 'q0', write: '1', move: 'R' },
                [TM_BLANK]: { nextState: 'q1', write: TM_BLANK, move: 'L' } // Found end, move left
            },
            'q1': { // Move left, flipping 1s to 0s until a 0 or blank is found
                '1': { nextState: 'q1', write: '0', move: 'L' },
                '0': { nextState: 'halt_accept', write: '1', move: 'S' }, // Flip 0 to 1, halt
                [TM_BLANK]: { nextState: 'halt_accept', write: '1', move: 'S' } // Tape was all 1s or empty, write 1 at start
            },
            'halt_accept': {} // Terminal state
        }
    },
    'palindrome': {
        description: "Accepts palindromes over {a,b} (e.g., aba, abba).",
        initialState: 'q0',
        acceptState: 'accept',
        rejectState: 'reject',
        blank: TM_BLANK,
        delta: {
            'q0': { // Start: check first char or if empty
                'a': { nextState: 'q_goto_end_a', write: TM_BLANK, move: 'R' }, // Mark 'a', go to end
                'b': { nextState: 'q_goto_end_b', write: TM_BLANK, move: 'R' }, // Mark 'b', go to end
                [TM_BLANK]: { nextState: 'accept' } // Empty string is a palindrome
            },
            'q_goto_end_a': { // Searching for end, remembered 'a'
                'a': { nextState: 'q_goto_end_a', write: 'a', move: 'R' },
                'b': { nextState: 'q_goto_end_a', write: 'b', move: 'R' },
                [TM_BLANK]: { nextState: 'q_check_end_a', write: TM_BLANK, move: 'L' }
            },
            'q_goto_end_b': { // Searching for end, remembered 'b'
                'a': { nextState: 'q_goto_end_b', write: 'a', move: 'R' },
                'b': { nextState: 'q_goto_end_b', write: 'b', move: 'R' },
                [TM_BLANK]: { nextState: 'q_check_end_b', write: TM_BLANK, move: 'L' }
            },
            'q_check_end_a': { // At rightmost char (or blank if was single char), expect 'a'
                'a': { nextState: 'q_return_start', write: TM_BLANK, move: 'L' }, // Match! Mark and return
                'b': { nextState: 'reject' },
                [TM_BLANK]: { nextState: 'accept' } // e.g. input "a" or "" after processing
            },
            'q_check_end_b': { // Expect 'b'
                'b': { nextState: 'q_return_start', write: TM_BLANK, move: 'L' },
                'a': { nextState: 'reject' },
                [TM_BLANK]: { nextState: 'accept' }
            },
            'q_return_start': { // Move left to first non-blank
                'a': { nextState: 'q_return_start', write: 'a', move: 'L' },
                'b': { nextState: 'q_return_start', write: 'b', move: 'L' },
                [TM_BLANK]: { nextState: 'q0', write: TM_BLANK, move: 'R' } // Back at start (or what's left of it)
            },
            'accept': {},
            'reject': {}
        }
    },
     'equal-count': { // L = {w | w has equal number of 0s and 1s} - Simplified from typical a^n b^n
        description: "Accepts strings with an equal number of 0s and 1s (e.g., 01, 10, 0011, 0101). Uses X for marked 0, Y for marked 1.",
        initialState: 'q0',
        acceptState: 'accept',
        rejectState: 'reject',
        blank: TM_BLANK,
        delta: {
            'q0': { // Find a 0 to mark
                '0': { nextState: 'q1', write: 'X', move: 'R' },
                '1': { nextState: 'reject' }, // Start with 0 for this strategy
                'X': { nextState: 'q0', write: 'X', move: 'R' }, // Skip marked 0s
                'Y': { nextState: 'q0', write: 'Y', move: 'R' }, // Skip marked 1s
                [TM_BLANK]: { nextState: 'q_check_all_marked' } // No more 0s, check if all are marked
            },
            'q1': { // Found a 0 (now X), find a 1 to mark
                '0': { nextState: 'q1', write: '0', move: 'R' },
                '1': { nextState: 'q2', write: 'Y', move: 'L' },
                'X': { nextState: 'q1', write: 'X', move: 'R' },
                'Y': { nextState: 'q1', write: 'Y', move: 'R' },
                [TM_BLANK]: { nextState: 'reject' } // Found 0 but no matching 1
            },
            'q2': { // Found a 1 (now Y), return to left of Xs
                '0': { nextState: 'q2', write: '0', move: 'L' },
                '1': { nextState: 'q2', write: '1', move: 'L' }, // Should not happen if logic is right
                'X': { nextState: 'q0', write: 'X', move: 'R' }, // Found start of current segment
                'Y': { nextState: 'q2', write: 'Y', move: 'L' },
                [TM_BLANK]: { nextState: 'q0', write: TM_BLANK, move: 'R'} // Should hit X first
            },
            'q_check_all_marked': { // Scanned right, found blank. Now scan left for any unmarked 0s or 1s.
                '0': { nextState: 'reject' }, // Unmatched 0
                '1': { nextState: 'reject' }, // Unmatched 1
                'X': { nextState: 'q_check_all_marked', write: 'X', move: 'L' },
                'Y': { nextState: 'q_check_all_marked', write: 'Y', move: 'L' },
                [TM_BLANK]: { nextState: 'accept' } // All marked, accept
            },
            'accept': {},
            'reject': {}
        }
    },
    'copy': { // w -> w#w
        description: "Copies input string w to w#w (e.g., ab -> ab#ab). Uses temp symbols A for a, B for b.",
        initialState: 'q_start_copy',
        acceptState: 'halt',
        blank: TM_BLANK,
        delta: {
            // Phase 1: Mark input and copy to end
            'q_start_copy': { // Find first symbol to copy
                'a': { nextState: 'q_goto_end_A', write: 'A', move: 'R' }, // Mark 'a' as 'A'
                'b': { nextState: 'q_goto_end_B', write: 'B', move: 'R' }, // Mark 'b' as 'B'
                '#': { nextState: 'q_cleanup', write: '#', move: 'L' }, // All original copied, go to cleanup
                [TM_BLANK]: { nextState: 'q_add_hash', write: TM_BLANK, move: 'S' } // Empty input, add # and halt
            },
            'q_add_hash': { [TM_BLANK]: { nextState: 'halt', write: '#', move: 'S' }},

            'q_goto_end_A': { // Go to end to write 'a'
                'a': { nextState: 'q_goto_end_A', write: 'a', move: 'R' },
                'b': { nextState: 'q_goto_end_A', write: 'b', move: 'R' },
                'A': { nextState: 'q_goto_end_A', write: 'A', move: 'R' },
                'B': { nextState: 'q_goto_end_A', write: 'B', move: 'R' },
                '#': { nextState: 'q_goto_end_A', write: '#', move: 'R' },
                [TM_BLANK]: { nextState: 'q_return_A', write: 'a', move: 'L' } // Write 'a', return
            },
            'q_goto_end_B': { // Go to end to write 'b'
                'a': { nextState: 'q_goto_end_B', write: 'a', move: 'R' },
                'b': { nextState: 'q_goto_end_B', write: 'b', move: 'R' },
                'A': { nextState: 'q_goto_end_B', write: 'A', move: 'R' },
                'B': { nextState: 'q_goto_end_B', write: 'B', move: 'R' },
                '#': { nextState: 'q_goto_end_B', write: '#', move: 'R' },
                [TM_BLANK]: { nextState: 'q_return_B', write: 'b', move: 'L' } // Write 'b', return
            },
            'q_return_A': { // Return to marked 'A'
                'a': { nextState: 'q_return_A', write: 'a', move: 'L' },
                'b': { nextState: 'q_return_A', write: 'b', move: 'L' },
                'B': { nextState: 'q_return_A', write: 'B', move: 'L' },
                '#': { nextState: 'q_return_A', write: '#', move: 'L' },
                'A': { nextState: 'q_start_copy', write: 'A', move: 'R' } // Found 'A', move right to find next
            },
            'q_return_B': { // Return to marked 'B'
                'a': { nextState: 'q_return_B', write: 'a', move: 'L' },
                'b': { nextState: 'q_return_B', write: 'b', move: 'L' },
                'A': { nextState: 'q_return_B', write: 'A', move: 'L' },
                '#': { nextState: 'q_return_B', write: '#', move: 'L' },
                'B': { nextState: 'q_start_copy', write: 'B', move: 'R' } // Found 'B', move right to find next
            },
            // Phase 2: Cleanup (A->a, B->b)
            'q_cleanup': {
                'A': { nextState: 'q_cleanup', write: 'a', move: 'L' },
                'B': { nextState: 'q_cleanup', write: 'b', move: 'L' },
                '#': { nextState: 'q_cleanup', write: '#', move: 'L' }, // Should only be one #
                [TM_BLANK]: { nextState: 'halt', write: TM_BLANK, move: 'R' } // Finished cleanup
            },
            'halt': {}
        }
    },
    'anbn': { // For user to design a^n b^n
        description: "Accepts strings of the form a^n b^n (e.g., aabb). User designs this.",
        initialState: 'q0',
        acceptState: 'accept',
        rejectState: 'reject',
        blank: TM_BLANK,
        delta: {} // User will populate this
    }
};
let userTMTransitions = {};


// Self-Test
let selfTestState = {
    currentQuestion: 1,
    score: 0,
    answers: {},
    totalQuestions: 5 // Adjust if more questions are added
};

// Exam Simulation
let examTimerInterval = null;
let examTimeLeft = 15 * 60; // 15 minutes in seconds


document.addEventListener('DOMContentLoaded', function() {
    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');

    initializeLesson();

    // KaTeX rendering
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ]
        });
    } else {
        console.warn("KaTeX auto-render not loaded.");
    }
});

function initializeLesson() {
    showSection('introduction'); // Show the first section by default
    updateProgress();
    populateSigmaStar();
    setupTrace(); // Setup DTM operation tracer
    setupExecutionTracer('0011'); // Setup execution tracer with default
    updateInteractiveTapeVisual(); // Initialize interactive TM tape
    resetSelfTest(); // Initialize self-test
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
            completedSections.add(sectionId);
        }
        if (completedSections.has(link.dataset.section)) {
            link.classList.add('completed');
        }
    });

    currentSection = sectionId;
    updateProgress();

    // Special initializations for sections if needed when they are shown
    if (sectionId === 'dtm-operation') {
        resetTrace();
    }
    if (sectionId === 'interactive-tm') {
        if (!currentTM) loadTMExample('binary-increment'); // Load a default if none selected
        else resetInteractiveTM(); // Reset current if one is loaded
    }
}

function updateProgress() {
    const percentage = Math.round((completedSections.size / totalSections) * 100);
    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = percentage + '%';
}

function selectQuizOption(element, isCorrect) {
    const questionContainer = element.closest('.quiz-container');
    const options = questionContainer.querySelectorAll('.quiz-option');
    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        opt.onclick = null; // Disable further clicks after one selection
        if (opt.contains(element) || opt === element) { // Handle click on label or input
             if (isCorrect) {
                opt.classList.add('correct');
            } else {
                opt.classList.add('incorrect');
            }
        }
    });

    const feedbackCorrect = questionContainer.querySelector('.feedback.correct');
    const feedbackIncorrect = questionContainer.querySelector('.feedback.incorrect');

    if (feedbackCorrect) feedbackCorrect.style.display = 'none';
    if (feedbackIncorrect) feedbackIncorrect.style.display = 'none';

    if (isCorrect) {
        if (feedbackCorrect) feedbackCorrect.style.display = 'block';
    } else {
        if (feedbackIncorrect) feedbackIncorrect.style.display = 'block';
    }
}

// --- Introduction Section ---
function calculateCollatz() {
    const input = document.getElementById('collatzInput').value;
    const resultDiv = document.getElementById('collatzResult');
    resultDiv.innerHTML = '';
    if (!input || input < 1) {
        resultDiv.textContent = 'Please enter a positive integer.';
        return;
    }
    let n = parseInt(input);
    let sequence = [n];
    let steps = 0;
    while (n !== 1 && steps < 1000) { // Safety break for very long sequences
        if (n % 2 === 0) {
            n = n / 2;
        } else {
            n = 3 * n + 1;
        }
        sequence.push(n);
        steps++;
    }
    if (steps === 1000) {
         resultDiv.textContent = `Sequence (first 1000 steps): ${sequence.join(' → ')} ... (too long to display fully)`;
    } else {
         resultDiv.textContent = `Sequence: ${sequence.join(' → ')} (${steps} steps)`;
    }
}

// --- Formal Languages Section ---
function addSymbol(symbol) {
    currentAlphabetSet.add(symbol);
    displayCurrentAlphabet();
}

function clearAlphabet() {
    currentAlphabetSet.clear();
    displayCurrentAlphabet();
}

function displayCurrentAlphabet() {
    const display = document.getElementById('alphabetDisplay');
    const currentAlphabetSpan = document.getElementById('currentAlphabet');
    display.innerHTML = '';
    if (currentAlphabetSet.size === 0) {
        currentAlphabetSpan.textContent = '∅';
    } else {
        currentAlphabetSpan.textContent = `{${Array.from(currentAlphabetSet).join(', ')}}`;
        currentAlphabetSet.forEach(sym => {
            const symbolDiv = document.createElement('div');
            symbolDiv.className = 'symbol';
            symbolDiv.textContent = sym;
            display.appendChild(symbolDiv);
        });
    }
}

function updateWordLength() {
    const length = document.getElementById('wordLength').value;
    document.getElementById('lengthDisplay').textContent = length;
}

function generateRandomWord() {
    const length = parseInt(document.getElementById('wordLength').value);
    const alphabet = ['0', '1']; // Fixed binary alphabet for this generator
    let word = '';
    for (let i = 0; i < length; i++) {
        word += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const generatedWordsDiv = document.getElementById('generatedWords');
    const wordP = document.createElement('p');
    wordP.textContent = word || 'ε (empty string)';
    generatedWordsDiv.insertBefore(wordP, generatedWordsDiv.firstChild); // Add to top
    generatedWordsCount++;
    if (generatedWordsCount > 5) { // Keep only last 5 words
        generatedWordsDiv.removeChild(generatedWordsDiv.lastChild);
        generatedWordsCount--;
    }
    document.getElementById('wordLengthDisplay').textContent = length;
}

function populateSigmaStar() {
    const display = document.getElementById('sigmaStarDisplay');
    display.innerHTML = '';
    const wordsToShow = sigmaStarWords.slice(0, sigmaStarLimit);
    wordsToShow.forEach(word => {
        const symbolDiv = document.createElement('div');
        symbolDiv.className = 'symbol';
        symbolDiv.style.background = '#9b59b6'; // Different color for distinction
        symbolDiv.textContent = word;
        display.appendChild(symbolDiv);
    });
}

function expandSigmaStar() {
    const B = ['0', '1'];
    let currentLength = sigmaStarWords[sigmaStarWords.length - 1].length;
    if (sigmaStarWords[sigmaStarWords.length - 1] === 'ε') currentLength = 0;

    let newWordsFound = false;
    while(sigmaStarWords.length < sigmaStarLimit + 10) { // Generate more words
        currentLength++;
        const wordsOfLength = [];
        function generate(currentWord) {
            if (currentWord.length === currentLength) {
                wordsOfLength.push(currentWord);
                return;
            }
            for (let char of B) {
                generate(currentWord + char);
            }
        }
        generate("");
        if (wordsOfLength.length === 0 && currentLength > 0) break; // Should not happen for non-empty alphabet

        wordsOfLength.sort(); // Canonical order
        sigmaStarWords.push(...wordsOfLength);
        newWordsFound = true;
        if (wordsOfLength.length > 0) break; // Add one length at a time for "Show More"
    }

    sigmaStarLimit += 10;
    if (!newWordsFound && sigmaStarLimit > sigmaStarWords.length) {
        // If no new words were truly added (e.g. already at max for short lengths)
        // but limit increased, just re-populate.
    }
    populateSigmaStar();
}


function selectLanguageQuiz(element, isCorrect) {
    // For checkbox style quiz, toggle classes
    const input = element.querySelector('input[type="checkbox"]');
    if (input.checked) {
        if (isCorrect) {
            element.classList.add('correct');
            element.classList.remove('incorrect');
        } else {
            element.classList.add('incorrect');
            element.classList.remove('correct');
        }
    } else {
        element.classList.remove('correct', 'incorrect');
    }
}

// --- Language Operations Section ---
function demonstrateOperation(operation) {
    const demoDiv = document.getElementById('operationDemo');
    const title = document.getElementById('operationTitle');
    const content = document.getElementById('operationContent');
    demoDiv.style.display = 'block';

    let L1 = "{a, aa}";
    let L2 = "{b, bb}";
    let L = "{0, 1}";
    let Sigma = "{0, 1}";

    switch (operation) {
        case 'union':
            title.textContent = 'Union: L₁ ∪ L₂';
            content.innerHTML = `<p>L₁ = ${L1}, L₂ = ${L2}</p>
                               <p>L₁ ∪ L₂ = {w | w ∈ L₁ or w ∈ L₂}</p>
                               <p><strong>Result:</strong> {a, aa, b, bb}</p>`;
            break;
        case 'intersection':
            title.textContent = 'Intersection: L₁ ∩ L₂';
            let L3 = "{aa, c}";
            content.innerHTML = `<p>L₁ = ${L1}, L₃ = ${L3}</p>
                               <p>L₁ ∩ L₃ = {w | w ∈ L₁ and w ∈ L₃}</p>
                               <p><strong>Result:</strong> {aa}</p>`;
            break;
        case 'complement':
            title.textContent = 'Complement: L̄';
            content.innerHTML = `<p>Σ = ${Sigma}, L = {0, 00} (finite example for simplicity)</p>
                               <p>L̄ = {w ∈ Σ* | w ∉ L}</p>
                               <p><strong>Result (first few):</strong> {ε, 1, 01, 10, 11, 000, ...}</p>`;
            break;
        case 'concatenation':
            title.textContent = 'Concatenation: L₁ · L₂';
            content.innerHTML = `<p>L₁ = ${L1}, L₂ = ${L2}</p>
                               <p>L₁ · L₂ = {w₁w₂ | w₁ ∈ L₁, w₂ ∈ L₂}</p>
                               <p><strong>Result:</strong> {ab, abb, aab, aabb}</p>`;
            break;
        case 'kleene':
            title.textContent = 'Kleene Star: L*';
            content.innerHTML = `<p>L = ${L}</p>
                               <p>L* = {w₁w₂...wₖ | k ≥ 0, each wᵢ ∈ L}</p>
                               <p><strong>Result (first few):</strong> {ε, 0, 1, 00, 01, 10, 11, 000, ...} (i.e., Σ* if L contains all single chars)</p>
                               <p>If L = {a}: L* = {ε, a, aa, aaa, ...}</p>`;
            break;
    }
}

function showOperationResult(operationType) {
    const L1 = ['a', 'b'];
    const L2 = ['0', '1'];
    const resultDiv = document.getElementById('operationResult');
    const resultTitle = document.getElementById('resultTitle');
    const resultContent = document.getElementById('resultContent');
    resultDiv.style.display = 'block';

    let result = [];
    switch (operationType) {
        case 'union':
            resultTitle.textContent = 'Result: L₁ ∪ L₂';
            result = [...new Set([...L1, ...L2])]; // Union using Set
            break;
        case 'concat':
            resultTitle.textContent = 'Result: L₁ · L₂';
            L1.forEach(w1 => {
                L2.forEach(w2 => {
                    result.push(w1 + w2);
                });
            });
            break;
        case 'kleene':
            resultTitle.textContent = 'Result: L₁* (first few elements)';
            result = ['ε']; // ε is always in L*
            // Generate L^1
            L1.forEach(w => result.push(w));
            // Generate L^2 (approx)
            L1.forEach(w1 => {
                L1.forEach(w2 => {
                    if (result.length < 10) result.push(w1 + w2);
                });
            });
            result = [...new Set(result)].slice(0,10); // Unique and limit
            result.push("...");
            break;
    }
    resultContent.textContent = `{${result.join(', ')}}`;
}


// --- Turing Machines Section ---
function simulateBitFlip() {
    const input = "1011";
    let tape = input.split('');
    let output = "";
    tape.forEach(bit => {
        output += (bit === '0' ? '1' : '0');
    });
    document.getElementById('bitFlipResult').innerHTML = `
        Input: ${input}<br>
        Applying rules: δ(q₀,'0')=(q₀,'1',R), δ(q₀,'1')=(q₀,'0',R), δ(q₀,'⊔')=(accept,'⊔',R)<br>
        Output: ${output} (Machine accepts)
    `;
}

// --- DTM Operation Section ---
function setupTrace(inputString = "abb") {
    traceMachineLogic.tape = inputString.split('');
    // Ensure tape has enough blanks for visualization
    for (let i = 0; i < 5; i++) traceMachineLogic.tape.push(BLANK_SYMBOL);
    traceMachineLogic.head = 0; // Start at the beginning of the input string part
    traceMachineLogic.currentState = traceMachineLogic.initialState;
    currentTraceStep = 0;
    updateTraceVisual();
    document.getElementById('nextAction').textContent = "Ready to start.";
    document.getElementById('traceInfo').querySelector('p strong:last-of-type').nextSibling.textContent = ` "${inputString}"`;

}

function resetTrace() {
    clearInterval(traceInterval);
    setupTrace(); // Reset to default "abb" or could take an input
    document.getElementById('nextAction').textContent = "Trace reset.";
}

function stepTrace() {
    if (traceMachineLogic.currentState === 'accept' || traceMachineLogic.currentState === 'reject') {
        document.getElementById('nextAction').textContent = `Machine has halted: ${traceMachineLogic.currentState}. Reset to run again.`;
        return;
    }

    const currentSymbol = traceMachineLogic.tape[traceMachineLogic.head] || BLANK_SYMBOL;
    const transition = traceMachineLogic.states[traceMachineLogic.currentState](currentSymbol);

    if (transition.final) { // accept or reject state
        traceMachineLogic.currentState = transition.accepted ? 'accept' : 'reject';
        document.getElementById('nextAction').textContent = transition.action + ` Final state: ${traceMachineLogic.currentState}`;
    } else {
        traceMachineLogic.tape[traceMachineLogic.head] = transition.write;
        if (transition.move === 'R') traceMachineLogic.head++;
        else if (transition.move === 'L') traceMachineLogic.head--;

        // Extend tape if head moves to a new blank cell
        if (traceMachineLogic.head === traceMachineLogic.tape.length) {
            traceMachineLogic.tape.push(BLANK_SYMBOL);
        } else if (traceMachineLogic.head < 0) {
            // For this visualizer, we won't prepend. If it needs to go left of 0, it's often a reject or specific design.
            // Or, we can treat it as an infinite tape conceptually and shift view, but that's complex for this simple viz.
            // For now, let's assume it shouldn't go < 0 unless it's part of reject logic for simple TMs.
            // If it goes off left and it's not a reject, then the TM design might be flawed for this simple tape.
            // Let's assume head stays >= 0 for simplicity here or gets rejected by TM logic.
            // If it's a valid move off left, the visualizer needs to handle shifting.
            // For now, if head < 0, we'll show it but it might look odd.
            // A better tape model would use an array and an offset.
             traceMachineLogic.currentState = 'reject'; // Simplistic: going off left means reject for this demo
             document.getElementById('nextAction').textContent = "Moved off left of tape, rejecting.";
             updateTraceVisual();
             return;
        }
        traceMachineLogic.currentState = transition.nextState;
        document.getElementById('nextAction').textContent = transition.action || `Transitioned to ${transition.nextState}`;
    }
    currentTraceStep++;
    updateTraceVisual();
}


function runTrace() {
    clearInterval(traceInterval);
    if (traceMachineLogic.currentState === 'accept' || traceMachineLogic.currentState === 'reject') {
        document.getElementById('nextAction').textContent = "Machine already halted. Reset to run again.";
        return;
    }
    traceInterval = setInterval(() => {
        stepTrace();
        if (traceMachineLogic.currentState === 'accept' || traceMachineLogic.currentState === 'reject') {
            clearInterval(traceInterval);
        }
    }, 700);
}

function updateTraceVisual() {
    const tapeContainer = document.getElementById('traceTape');
    tapeContainer.innerHTML = '';

    // Determine visible part of the tape
    const displayWidth = 7; // Number of cells to display
    let startIndex = Math.max(0, traceMachineLogic.head - Math.floor(displayWidth / 2));
    let endIndex = startIndex + displayWidth;

    if (endIndex > traceMachineLogic.tape.length) {
        endIndex = traceMachineLogic.tape.length;
        // Adjust startIndex if tape is shorter than displayWidth
        startIndex = Math.max(0, endIndex - displayWidth);
    }


    if (startIndex > 0) {
        const dots = document.createElement('div');
        dots.className = 'tape-cell';
        dots.textContent = '...';
        tapeContainer.appendChild(dots);
    }

    for (let i = startIndex; i < endIndex; i++) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = traceMachineLogic.tape[i] || BLANK_SYMBOL;
        if (i === traceMachineLogic.head) {
            cell.classList.add('head');
        }
        tapeContainer.appendChild(cell);
    }
     if (endIndex < traceMachineLogic.tape.length) {
        const dots = document.createElement('div');
        dots.className = 'tape-cell';
        dots.textContent = '...';
        tapeContainer.appendChild(dots);
    }


    document.getElementById('traceConfig').textContent = `[${traceMachineLogic.currentState}, ${traceMachineLogic.tape.join('').replace(/⊔+$/, '')}... , Head at ${traceMachineLogic.head}] (Step ${currentTraceStep})`;
}


function selectConfigTransition(element, isCorrect) {
    const feedbackDiv = document.getElementById('transitionFeedback');
    const options = element.parentElement.querySelectorAll('.quiz-option');
    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        opt.onclick = null; // Disable after selection
    });

    if (isCorrect) {
        element.classList.add('correct');
        feedbackDiv.textContent = '✅ Correct! The machine writes \'0\', moves to state q1, and the head moves Right to position 2.';
        feedbackDiv.className = 'feedback correct';
    } else {
        element.classList.add('incorrect');
        feedbackDiv.textContent = '❌ Incorrect. Remember: δ(state, read) = (new_state, write, move). Apply this to the tape and head position.';
        feedbackDiv.className = 'feedback incorrect';
    }
    feedbackDiv.style.display = 'block';
}

// --- Execution Tracer (for 0^n 1^n like TM) ---
function setupExecutionTracer(input) {
    executionData.inputString = input;
    executionData.tape = input.split('');
    // Pad with blanks for visualization
    for (let i = 0; i < 10; i++) executionData.tape.push(BLANK_SYMBOL);
    executionData.head = 0;
    executionData.state = execMachineLogic.initialState;
    executionData.step = 0;
    executionData.history = [`Initial: [${executionData.state}, ${input}${BLANK_SYMBOL}..., Head: 0]`];

    document.getElementById('executionTracer').style.display = 'block';
    document.getElementById('stepBtn').disabled = false;
    document.getElementById('runBtn').disabled = false;
    updateExecutionVisual();
    document.getElementById('historyList').innerHTML = executionData.history.map(h => `<div>${h}</div>`).join('');
}


function startExecution() {
    const input = document.getElementById('executionInput').value.trim();
    if (!/^[01]*$/.test(input)) {
        alert("Please enter a binary string (only 0s and 1s).");
        return;
    }
    clearInterval(execInterval);
    setupExecutionTracer(input);
}

function stepExecution() {
    if (executionData.state === execMachineLogic.acceptState || executionData.state === execMachineLogic.rejectState) {
        addExecutionHistory(`Halted: ${executionData.state}`);
        document.getElementById('stepBtn').disabled = true;
        document.getElementById('runBtn').disabled = true;
        return;
    }

    const currentSymbol = executionData.tape[executionData.head] || BLANK_SYMBOL;
    const stateTransitions = execMachineLogic.transitions[executionData.state];
    let transition;

    if (stateTransitions && stateTransitions[currentSymbol]) {
        transition = stateTransitions[currentSymbol];
    } else {
        // No explicit transition for current symbol, assume reject or implicit transition to reject
        executionData.state = execMachineLogic.rejectState;
        addExecutionHistory(`No transition for (${executionData.state}, ${currentSymbol}). Moving to ${execMachineLogic.rejectState}.`);
        updateExecutionVisual();
        document.getElementById('stepBtn').disabled = true;
        document.getElementById('runBtn').disabled = true;
        return;
    }


    executionData.tape[executionData.head] = transition.write;
    executionData.state = transition.nextState;

    if (transition.move === 'R') {
        executionData.head++;
        if (executionData.head === executionData.tape.length) {
            executionData.tape.push(BLANK_SYMBOL); // Extend tape if needed
        }
    } else if (transition.move === 'L') {
        executionData.head--;
        if (executionData.head < 0) {
            // This TM for 0^n1^n shouldn't go off left if input is valid and TM is correct
            // but if it does, we can add a blank at the beginning and shift everything.
            // For simplicity here, we'll assume it stays >= 0 or a specific TM handles it.
            // If it needs to go left of 0, it might be an error or specific design.
            // For this example, let's assume it means reject if it tries to go < 0.
            executionData.state = execMachineLogic.rejectState;
            addExecutionHistory(`Error: Head tried to move left of tape start. Rejecting.`);
            updateExecutionVisual();
            document.getElementById('stepBtn').disabled = true;
            document.getElementById('runBtn').disabled = true;
            return;
        }
    }
    // If move is 'S' (Stay), head position doesn't change.

    executionData.step++;
    addExecutionHistory(`Step ${executionData.step}: Read '${currentSymbol}', Write '${transition.write}', Move ${transition.move}, New State: ${executionData.state}`);
    updateExecutionVisual();

    if (executionData.state === execMachineLogic.acceptState || executionData.state === execMachineLogic.rejectState) {
        addExecutionHistory(`Halted: ${executionData.state}`);
        document.getElementById('stepBtn').disabled = true;
        document.getElementById('runBtn').disabled = true;
    }
}


function runExecution() {
    clearInterval(execInterval);
    if (executionData.state === execMachineLogic.acceptState || executionData.state === execMachineLogic.rejectState) return;

    execInterval = setInterval(() => {
        stepExecution();
        if (executionData.state === execMachineLogic.acceptState || executionData.state === execMachineLogic.rejectState) {
            clearInterval(execInterval);
        }
    }, 500);
}

function resetExecution() {
    clearInterval(execInterval);
    const input = document.getElementById('executionInput').value.trim() || "0011";
    setupExecutionTracer(input);
}

function updateExecutionVisual() {
    const tapeContainer = document.getElementById('execTape');
    tapeContainer.innerHTML = '';

    const displayWidth = 11; // Number of cells to display
    let startIndex = Math.max(0, executionData.head - Math.floor(displayWidth / 2));
    let endIndex = startIndex + displayWidth;

    if (endIndex > executionData.tape.length) {
        endIndex = executionData.tape.length;
        startIndex = Math.max(0, endIndex - displayWidth);
    }

    if (startIndex > 0) {
        const dots = document.createElement('div');
        dots.className = 'tape-cell';
        dots.textContent = '...';
        tapeContainer.appendChild(dots);
    }

    for (let i = startIndex; i < endIndex; i++) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = executionData.tape[i] || BLANK_SYMBOL;
        if (i === executionData.head) {
            cell.classList.add('head');
        }
        tapeContainer.appendChild(cell);
    }
     if (endIndex < executionData.tape.length) {
        const dots = document.createElement('div');
        dots.className = 'tape-cell';
        dots.textContent = '...';
        tapeContainer.appendChild(dots);
    }

    document.getElementById('execStep').textContent = executionData.step;
    document.getElementById('execState').textContent = executionData.state;
    document.getElementById('execHead').textContent = executionData.head;
}

function addExecutionHistory(log) {
    executionData.history.push(log);
    const historyListDiv = document.getElementById('historyList');
    const logEntry = document.createElement('div');
    logEntry.textContent = log;
    historyListDiv.appendChild(logEntry);
    historyListDiv.scrollTop = historyListDiv.scrollHeight; // Auto-scroll
}

// --- Language Classes Section ---
function showLanguageExample(exampleType) {
    const exampleDiv = document.getElementById('languageExample');
    const title = document.getElementById('exampleTitle');
    const content = document.getElementById('exampleContent');
    const data = languageExampleData[exampleType];

    if (data) {
        title.textContent = data.title;
        content.innerHTML = `<p>${data.content}</p>`;
        exampleDiv.style.display = 'block';
    }
}

function showHaltingProof() {
    const proofDiv = document.getElementById('haltingProof');
    proofDiv.style.display = proofDiv.style.display === 'none' ? 'block' : 'none';
}

// --- Interactive TM Section ---
function loadTMExample(exampleKey) {
    currentTM = tmExamples[exampleKey];
    if (!currentTM) {
        console.error("TM example not found:", exampleKey);
        document.getElementById('tmTitle').textContent = "Error: TM not found";
        document.getElementById('tmDescription').textContent = "";
        return;
    }
    userTMTransitions = {}; // Clear user TM if loading example
    document.getElementById('tmTitle').textContent = currentTM.description.split('.')[0]; // First sentence as title
    document.getElementById('tmDescription').textContent = currentTM.description;
    document.getElementById('tmInput').value = ''; // Clear input field
    resetInteractiveTM(); // This will also display rules
    showTransitionTable(true); // Ensure rules are shown
}

function loadTape() {
    const inputString = document.getElementById('tmInput').value;
    interactiveTape = inputString.split('');
    if (interactiveTape.length === 0) interactiveTape.push(currentTM ? currentTM.blank : TM_BLANK); // Handle empty input

    // Pad with blanks
    const requiredPadding = TAPE_SIZE - interactiveTape.length;
    for (let i = 0; i < Math.max(5, requiredPadding); i++) { // Add at least 5 blanks, or more if needed for TAPE_SIZE
        interactiveTape.push(currentTM ? currentTM.blank : TM_BLANK);
    }
    resetInteractiveTMState();
}

function resetInteractiveTMState() {
    interactiveHead = 0;
    interactiveState = currentTM ? currentTM.initialState : 'q0';
    interactiveSteps = 0;
    interactiveStatus = 'Ready';
    clearInterval(interactiveInterval);
    updateInteractiveTapeVisual();
    document.getElementById('interactiveStepBtn').disabled = false;
    document.getElementById('interactiveRunBtn').disabled = false;
}


function resetInteractiveTM() {
    if (!currentTM) { // If no TM is loaded (e.g. user design mode without loaded example)
        currentTM = { // Basic structure for user TM
            initialState: 'q0',
            acceptState: 'accept',
            rejectState: 'reject',
            blank: TM_BLANK,
            delta: userTMTransitions // Use user-defined transitions
        };
        document.getElementById('tmTitle').textContent = "User-Designed TM";
        document.getElementById('tmDescription').textContent = "Testing your custom TM rules.";
    }
    loadTape(); // This calls resetInteractiveTMState
    displayCurrentTMRules();
}


function stepInteractiveTM() {
    if (!currentTM) {
        interactiveStatus = "No TM loaded.";
        updateInteractiveTapeVisual();
        return;
    }
    if (interactiveState === currentTM.acceptState || interactiveState === currentTM.rejectState || interactiveState === 'halt' || interactiveState === 'halt_accept') {
        interactiveStatus = `Halted (${interactiveState})`;
        updateInteractiveTapeVisual();
        document.getElementById('interactiveStepBtn').disabled = true;
        document.getElementById('interactiveRunBtn').disabled = true;
        return;
    }

    const currentSymbol = interactiveTape[interactiveHead] || currentTM.blank;
    const transitionsForState = currentTM.delta[interactiveState];
    let transition;

    if (transitionsForState) {
        transition = transitionsForState[currentSymbol];
    }

    if (!transition) {
        // No explicit transition, check for wildcard or default to reject/error
        if (transitionsForState && transitionsForState['*']) { // Wildcard symbol
            transition = transitionsForState['*'];
        } else {
            interactiveStatus = `No transition for (${interactiveState}, ${currentSymbol})`;
            interactiveState = currentTM.rejectState || 'error'; // Go to reject or an error state
            updateInteractiveTapeVisual();
            document.getElementById('interactiveStepBtn').disabled = true;
            document.getElementById('interactiveRunBtn').disabled = true;
            return;
        }
    }
    
    // If transition is just a state name (shorthand for write same, move stay, next state)
    if (typeof transition === 'string') {
        transition = { nextState: transition, write: currentSymbol, move: 'S' };
    }
    
    if (!transition.write && transition.write !== "") transition.write = currentSymbol; // Default to writing the same symbol
    if (!transition.move) transition.move = 'S'; // Default to stay

    interactiveTape[interactiveHead] = transition.write;
    interactiveState = transition.nextState;

    if (transition.move === 'R') {
        interactiveHead++;
        if (interactiveHead === interactiveTape.length) {
            interactiveTape.push(currentTM.blank);
        }
    } else if (transition.move === 'L') {
        interactiveHead--;
        if (interactiveHead < 0) {
            interactiveTape.unshift(currentTM.blank);
            interactiveHead = 0; // Adjust head after unshift
        }
    }

    interactiveSteps++;
    interactiveStatus = 'Running';
    updateInteractiveTapeVisual();

    if (interactiveState === currentTM.acceptState || interactiveState === currentTM.rejectState || interactiveState === 'halt' || interactiveState === 'halt_accept') {
        interactiveStatus = `Halted (${interactiveState})`;
        updateInteractiveTapeVisual();
        document.getElementById('interactiveStepBtn').disabled = true;
        document.getElementById('interactiveRunBtn').disabled = true;
    }
}

function runInteractiveTM() {
    if (!currentTM || interactiveStatus.startsWith("Halted")) return;
    clearInterval(interactiveInterval);
    document.getElementById('interactiveStepBtn').disabled = true; // Disable step while auto-running
    document.getElementById('interactiveRunBtn').disabled = true; // Prevent multiple runs

    interactiveInterval = setInterval(() => {
        stepInteractiveTM();
        if (interactiveStatus.startsWith("Halted") || interactiveState === currentTM.acceptState || interactiveState === currentTM.rejectState) {
            clearInterval(interactiveInterval);
            // Re-enable buttons if not halted, or keep disabled if halted
            if (!interactiveStatus.startsWith("Halted")) {
                 document.getElementById('interactiveStepBtn').disabled = false;
                 document.getElementById('interactiveRunBtn').disabled = false;
            }
        }
    }, 300); // Adjust speed as needed
}


function updateInteractiveTapeVisual() {
    const tapeContainer = document.getElementById('interactiveTape');
    const stateSpan = document.getElementById('interactiveState');
    const headSpan = document.getElementById('interactiveHead');
    const stepsSpan = document.getElementById('interactiveSteps');
    const statusSpan = document.getElementById('interactiveStatus');

    tapeContainer.innerHTML = '';
    stateSpan.textContent = interactiveState;
    headSpan.textContent = interactiveHead;
    stepsSpan.textContent = interactiveSteps;
    statusSpan.textContent = interactiveStatus;

    const displayWidth = TAPE_SIZE;
    let viewStart = Math.max(0, interactiveHead - Math.floor(displayWidth / 2));
    let viewEnd = viewStart + displayWidth;

    // Adjust view if tape is shorter than displayWidth or head is near ends
    if (interactiveTape.length < displayWidth) {
        viewStart = 0;
        viewEnd = interactiveTape.length;
    } else if (viewEnd > interactiveTape.length) {
        viewEnd = interactiveTape.length;
        viewStart = viewEnd - displayWidth;
    }


    if (viewStart > 0) {
        const dots = document.createElement('div');
        dots.className = 'tape-cell';
        dots.textContent = '...';
        tapeContainer.appendChild(dots);
    }

    for (let i = viewStart; i < viewEnd; i++) {
        if (i < 0 || i >= interactiveTape.length) continue; // Should not happen with current logic but good guard
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = interactiveTape[i];
        if (i === interactiveHead) {
            cell.classList.add('head');
        }
        tapeContainer.appendChild(cell);
    }

    if (viewEnd < interactiveTape.length) {
         const dots = document.createElement('div');
        dots.className = 'tape-cell';
        dots.textContent = '...';
        tapeContainer.appendChild(dots);
    }
}

function showTransitionTable(forceShow = false) {
    const tableDiv = document.getElementById('transitionTable');
    if (forceShow) {
        tableDiv.style.display = 'block';
    } else {
        tableDiv.style.display = tableDiv.style.display === 'none' ? 'block' : 'none';
    }
    displayCurrentTMRules();
}

function displayCurrentTMRules() {
    const rulesListDiv = document.getElementById('rulesList');
    rulesListDiv.innerHTML = '';
    const tmToDisplay = (Object.keys(userTMTransitions).length > 0 && currentTM && currentTM.description.startsWith("User")) ? { delta: userTMTransitions } : currentTM;


    if (tmToDisplay && tmToDisplay.delta) {
        for (const state in tmToDisplay.delta) {
            if (Object.keys(tmToDisplay.delta[state]).length === 0 && (state === tmToDisplay.acceptState || state === tmToDisplay.rejectState || state === 'halt' || state === 'halt_accept')) {
                 rulesListDiv.innerHTML += `<div><strong>${state}</strong>: (Halting State)</div>`;
                continue;
            }
            for (const readSymbol in tmToDisplay.delta[state]) {
                const transition = tmToDisplay.delta[state][readSymbol];
                let ruleString = `δ(${state}, ${readSymbol === TM_BLANK ? '⊔' : readSymbol}) = `;
                if (typeof transition === 'string') { // Shorthand: only next state
                    ruleString += `(${transition}, ${readSymbol === TM_BLANK ? '⊔' : readSymbol}, S)`;
                } else {
                    ruleString += `(${transition.nextState}, ${transition.write === TM_BLANK ? '⊔' : transition.write}, ${transition.move})`;
                }
                rulesListDiv.innerHTML += `<div>${ruleString}</div>`;
            }
        }
         if (Object.keys(tmToDisplay.delta).length === 0) {
            rulesListDiv.textContent = "No rules defined yet for this TM.";
        }
    } else {
        rulesListDiv.textContent = "Load an example or design your TM to see rules.";
    }
}


// TM Designer
function addTransitionRule() {
    const state = document.getElementById('designerState').value.trim() || 'q0';
    const read = document.getElementById('designerRead').value.trim() || TM_BLANK;
    const write = document.getElementById('designerWrite').value.trim() || read; // Default write same symbol
    const move = document.getElementById('designerMove').value;
    const next = document.getElementById('designerNext').value.trim() || state; // Default next state same

    if (!userTMTransitions[state]) {
        userTMTransitions[state] = {};
    }
    userTMTransitions[state][read] = { nextState: next, write: write, move: move };

    // Update currentTM if it's the user TM
    if (currentTM && currentTM.description && currentTM.description.startsWith("User")) {
        currentTM.delta = userTMTransitions;
    }


    displayUserRules();
    // Clear inputs
    document.getElementById('designerState').value = state; // Keep current state for easier multi-rule entry
    document.getElementById('designerRead').value = '';
    document.getElementById('designerWrite').value = '';
    // document.getElementById('designerMove').value = 'R';
    document.getElementById('designerNext').value = '';
    document.getElementById('designerRead').focus();
}

function displayUserRules() {
    const listDiv = document.getElementById('userRulesList');
    listDiv.innerHTML = '';
    if (Object.keys(userTMTransitions).length === 0) {
        listDiv.textContent = "No rules added yet.";
        return;
    }
    for (const state in userTMTransitions) {
        for (const readSymbol in userTMTransitions[state]) {
            const rule = userTMTransitions[state][readSymbol];
            const ruleDiv = document.createElement('div');
            ruleDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin: 5px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px;';
            
            const ruleText = document.createElement('span');
            ruleText.textContent = `δ(${state}, ${readSymbol === TM_BLANK ? '⊔' : readSymbol}) = (${rule.nextState}, ${rule.write === TM_BLANK ? '⊔' : rule.write}, ${rule.move})`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.cssText = 'background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 16px; margin-left: 10px;';
            deleteBtn.title = 'Remove this rule';
            deleteBtn.onclick = () => removeTransitionRule(state, readSymbol);
            
            ruleDiv.appendChild(ruleText);
            ruleDiv.appendChild(deleteBtn);
            listDiv.appendChild(ruleDiv);
        }
    }
}

function removeTransitionRule(state, readSymbol) {
    // Remove the specific transition rule
    if (userTMTransitions[state] && userTMTransitions[state][readSymbol]) {
        delete userTMTransitions[state][readSymbol];
        
        // If this state has no more transitions, remove the state entirely
        if (Object.keys(userTMTransitions[state]).length === 0) {
            delete userTMTransitions[state];
        }
        
        // Update currentTM if it's the user TM
        if (currentTM && currentTM.description && currentTM.description.startsWith("User")) {
            currentTM.delta = userTMTransitions;
        }
        
        // Refresh display
        displayUserRules();
        
        // Also refresh the main TM rules display if currently showing user TM
        if (currentTM && currentTM.description && currentTM.description.startsWith("User")) {
            displayCurrentTMRules();
        }
    }
}

function clearDesigner() {
    userTMTransitions = {};
    if (currentTM && currentTM.description && currentTM.description.startsWith("User")) {
         currentTM.delta = {}; // Clear rules from active user TM
    }
    displayUserRules();
    document.getElementById('designerResult').textContent = '';
}

function testUserTM() {
    const testInput = document.getElementById('designerTestInput').value;
    if (Object.keys(userTMTransitions).length === 0) {
        document.getElementById('designerResult').textContent = "Please add some transition rules first.";
        return;
    }

    // Setup currentTM as the user's TM
    currentTM = {
        description: "User-Designed TM",
        initialState: document.getElementById('designerState').value.trim().split(',')[0] || 'q0', // Use first state from input or q0
        acceptState: 'accept', // Common accept state, user can define transitions to it
        rejectState: 'reject', // Common reject state
        blank: TM_BLANK,
        delta: userTMTransitions
    };
    // Find initial state from rules if not specified, or default
    const ruleStates = Object.keys(userTMTransitions);
    if (ruleStates.length > 0) {
        currentTM.initialState = ruleStates[0]; // Default to the first state defined in rules
        // A better way would be to have an explicit "start state" input in designer
    }


    document.getElementById('tmInput').value = testInput; // Load test input to main TM input
    loadTape(); // This sets up the interactiveTape and resets state for currentTM
    document.getElementById('designerResult').textContent = `Testing TM with input "${testInput}". Use the main TM controls to step/run.`;

    // Update main TM display
    document.getElementById('tmTitle').textContent = currentTM.description;
    document.getElementById('tmDescription').textContent = "Testing your custom TM rules.";
    showTransitionTable(true); // Show the user's rules
}


// --- Self-Test Section ---
const totalSelfTestQuestions = 5; // Number of questions in this version

function answerSelfTest(questionNum, answer, isCorrect) {
    selfTestState.answers[questionNum] = { answer: answer, correct: isCorrect };
    const feedbackEl = document.getElementById(`feedback${questionNum}`);
    const questionContainer = document.getElementById(`question${questionNum}`);
    const options = questionContainer.querySelectorAll('.quiz-option');

    options.forEach(opt => {
        opt.onclick = null; // Disable further clicks
        const radio = opt.querySelector('input[type="radio"]');
        if (radio && radio.checked) { // Check which option was selected
            if (isCorrect) {
                opt.classList.add('correct');
                if(selfTestState.score < totalSelfTestQuestions) selfTestState.score++;
            } else {
                opt.classList.add('incorrect');
            }
        }
    });


    if (isCorrect) {
        feedbackEl.textContent = '✅ Correct!';
        feedbackEl.className = 'feedback correct';
    } else {
        // Find the correct option and highlight it too if you want
        options.forEach(opt => {
            // This assumes the onclick attribute's second param (isCorrect) is available or stored.
            // For this quiz, the `isCorrect` is passed to this function.
            // We need to identify the correct label.
            // A bit hacky: we assume the `onclick` string contains `true` for the correct one.
            const onclickAttr = opt.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(', true)')) { // Check if this option was the correct one
                 // opt.classList.add('correct'); // Optionally highlight the actual correct answer
            }
        });
        feedbackEl.textContent = '❌ Incorrect.';
        feedbackEl.className = 'feedback incorrect';
    }
    feedbackEl.style.display = 'block';

    // Enable next question button or show results
    setTimeout(() => {
        nextQuestion(questionNum);
    }, 1000); // Delay before moving to next question
}

function nextQuestion(currentQuestionNum) {
    document.getElementById(`question${currentQuestionNum}`).style.display = 'none';
    updateTestProgress();

    if (currentQuestionNum < selfTestState.totalQuestions) {
        document.getElementById(`question${currentQuestionNum + 1}`).style.display = 'block';
        selfTestState.currentQuestion = currentQuestionNum + 1;
    } else {
        // Test complete
        document.getElementById('testComplete').style.display = 'block';
        const finalScoreEl = document.getElementById('finalScore');
        const recommendationsEl = document.getElementById('recommendations');
        const percentage = (selfTestState.score / selfTestState.totalQuestions) * 100;
        finalScoreEl.textContent = `Your Score: ${selfTestState.score}/${selfTestState.totalQuestions} (${percentage.toFixed(1)}%)`;

        if (percentage >= 80) {
            recommendationsEl.innerHTML = "<p style='color: green;'>Excellent! You have a strong grasp of the material.</p>";
        } else if (percentage >= 60) {
            recommendationsEl.innerHTML = "<p style='color: orange;'>Good effort! Review the sections where you made mistakes.</p>";
        } else {
            recommendationsEl.innerHTML = "<p style='color: red;'>You may need to revisit several topics. Don't hesitate to go through the lesson again.</p>";
        }
    }
}

function updateTestProgress() {
    const answeredCount = Object.keys(selfTestState.answers).length;
    document.getElementById('testProgress').textContent = `${answeredCount}/${selfTestState.totalQuestions}`;
    document.getElementById('testProgressBar').style.width = `${(answeredCount / selfTestState.totalQuestions) * 100}%`;
    document.getElementById('testScore').textContent = `${selfTestState.score} points`;
}


function resetSelfTest() {
    selfTestState = {
        currentQuestion: 1,
        score: 0,
        answers: {},
        totalQuestions: totalSelfTestQuestions
    };

    document.querySelectorAll('.question-container').forEach((qc, index) => {
        qc.style.display = (index === 0) ? 'block' : 'none'; // Show only first question
        qc.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('correct', 'incorrect');
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
            // Re-attach onclick, ensuring it refers to the correct parameters
            // This is tricky as original onclicks are in HTML.
            // For simplicity, we'll rely on the HTML's onclick. If they were dynamically set, we'd re-add them here.
            // The quiz option onclicks are set in the HTML, so they should still work.
            // We might need to re-enable them if they were set to null.
            // This is a simplification. A more robust quiz would manage event listeners better.
             const originalOnclick = opt.getAttribute('data-original-onclick'); // Assume we stored it
             if (originalOnclick) opt.setAttribute('onclick', originalOnclick);
             else { // If not stored, re-parse from a known structure (less ideal)
                // This part requires knowing the exact structure of the onclick string
                // For now, we assume the HTML onclicks are sufficient upon reset if not nulled out.
                // If selectQuizOption or answerSelfTest sets opt.onclick = null, they need to be restored.
                // Let's ensure answerSelfTest does NOT null out the onclick for other options.
             }


        });
        qc.querySelector('.feedback').style.display = 'none';
        qc.querySelector('.feedback').textContent = '';
    });

    document.getElementById('testComplete').style.display = 'none';
    updateTestProgress();
}


// --- Exam Preparation Section ---
function showDTMStrategy() {
    const div = document.getElementById('dtmStrategy');
    div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

function showReductionStrategy() {
    const div = document.getElementById('reductionStrategy');
    div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

function startExamSimulation() {
    examTimeLeft = 15 * 60;
    document.getElementById('examQuestions').style.display = 'block';
    document.getElementById('startExamBtn').style.display = 'none';
    document.getElementById('stopExamBtn').style.display = 'inline-block';
    document.getElementById('examResults').style.display = 'none';
    document.getElementById('examFeedback').innerHTML = '';
    ['examAnswer1', 'examAnswer2', 'examAnswer3'].forEach(id => document.getElementById(id).value = '');


    updateExamTimer(); // Initial display
    examTimerInterval = setInterval(updateExamTimer, 1000);
}

function stopExamSimulation() {
    clearInterval(examTimerInterval);
    document.getElementById('examQuestions').style.display = 'none';
    document.getElementById('startExamBtn').style.display = 'inline-block';
    document.getElementById('stopExamBtn').style.display = 'none';
    document.getElementById('examResults').style.display = 'block';
    document.getElementById('examFeedback').innerHTML = '<p>Simulation stopped. Answers not submitted.</p>';
}

function updateExamTimer() {
    const minutes = Math.floor(examTimeLeft / 60);
    const seconds = examTimeLeft % 60;
    document.getElementById('examTimer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (examTimeLeft <= 0) {
        clearInterval(examTimerInterval);
        submitExamSimulation(true); // Auto-submit when time is up
    }
    examTimeLeft--;
}

function submitExamSimulation(timeUp = false) {
    clearInterval(examTimerInterval);
    document.getElementById('examQuestions').style.display = 'none';
    document.getElementById('startExamBtn').style.display = 'inline-block';
    document.getElementById('stopExamBtn').style.display = 'none';
    document.getElementById('examResults').style.display = 'block';

    const feedback = document.getElementById('examFeedback');
    feedback.innerHTML = `<h3>${timeUp ? "Time's Up! " : ""}Answers Submitted:</h3>`;
    // Basic feedback - in a real scenario, this would be graded
    const ans1 = document.getElementById('examAnswer1').value.trim();
    const ans2 = document.getElementById('examAnswer2').value.trim();
    const ans3 = document.getElementById('examAnswer3').value.trim();

    feedback.innerHTML += `<p><strong>Problem 1 (w#w DTM):</strong> ${ans1 ? "Answered." : "Not answered."} <small>(Self-review: Does it handle marking, finding #, comparing, and checking ends?)</small></p>`;
    feedback.innerHTML += `<p><strong>Problem 2 (L(M)=∅ computable?):</strong> ${ans2 ? "Answered." : "Not answered."} <small>(Self-review: This is undecidable, Rice's Theorem or reduction from HP.)</small></p>`;
    feedback.innerHTML += `<p><strong>Problem 3 (Configurations for 0011):</strong> ${ans3 ? "Answered." : "Not answered."} <small>(Self-review: Trace step-by-step: [q0, 0011...], [q_mark0, X011...], etc.)</small></p>`;
    feedback.innerHTML += "<p>This is a mock simulation. Review your answers against course materials.</p>";
}

// Make sure all functions called by onclick are globally available
window.showSection = showSection;
window.selectQuizOption = selectQuizOption;
window.calculateCollatz = calculateCollatz;
window.addSymbol = addSymbol;
window.clearAlphabet = clearAlphabet;
window.updateWordLength = updateWordLength;
window.generateRandomWord = generateRandomWord;
window.expandSigmaStar = expandSigmaStar;
window.selectLanguageQuiz = selectLanguageQuiz;
window.demonstrateOperation = demonstrateOperation;
window.showOperationResult = showOperationResult;
window.simulateBitFlip = simulateBitFlip;
window.resetTrace = resetTrace;
window.stepTrace = stepTrace;
window.runTrace = runTrace;
window.selectConfigTransition = selectConfigTransition;
window.startExecution = startExecution;
window.stepExecution = stepExecution;
window.runExecution = runExecution;
window.resetExecution = resetExecution;
window.showLanguageExample = showLanguageExample;
window.showHaltingProof = showHaltingProof;
window.loadTMExample = loadTMExample;
window.loadTape = loadTape;
window.stepInteractiveTM = stepInteractiveTM;
window.runInteractiveTM = runInteractiveTM;
window.resetInteractiveTM = resetInteractiveTM;
window.showTransitionTable = showTransitionTable;
window.addTransitionRule = addTransitionRule;
window.removeTransitionRule = removeTransitionRule;
window.clearDesigner = clearDesigner;
window.testUserTM = testUserTM;
window.answerSelfTest = answerSelfTest;
window.resetSelfTest = resetSelfTest;
window.showDTMStrategy = showDTMStrategy;
window.showReductionStrategy = showReductionStrategy;
window.startExamSimulation = startExamSimulation;
window.stopExamSimulation = stopExamSimulation;
window.submitExamSimulation = submitExamSimulation;