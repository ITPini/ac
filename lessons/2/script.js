// script.js - Lesson 2: Church-Turing Thesis & Advanced TM Variants

// === GLOBAL STATE VARIABLES ===

// Multi-tape DTM state
let multiTapeState = {
    tape1: [],
    tape2: [], 
    head1: 0,
    head2: 0,
    state: 'q0',
    step: 0,
    status: 'Ready',
    inputString: '',
    isRunning: false
};

// NTM computation tree state
let ntmTreeState = {
    input: '',
    currentLevel: 0,
    tree: [],
    maxLevel: 0,
    canvas: null,
    ctx: null
};

// NTM simulation state
let ntmSimState = {
    input: '',
    configurations: [],
    generation: 0,
    status: 'Ready'
};

// Practice problems state
let practiceState = {
    ntmTransitions: {},
    userAnswers: {}
};

// Exam simulation state
let examState = {
    timeLeft: 12 * 60, // 12 minutes in seconds
    isRunning: false,
    interval: null
};

// === INITIALIZATION ===

/**
 * Override the global onSectionChanged to handle lesson-specific initialization
 */
function onSectionChanged(sectionId) {
    switch(sectionId) {
        case 'multi-tape':
            initializeMultiTape();
            break;
        case 'nondeterministic':
            initializeNTMTree();
            break;
        case 'ntm-simulation':
            initializeNTMSimulation();
            break;
        case 'practice-problems':
            initializePracticeProblems();
            break;
        case 'exam-connection':
            initializeExamPreparation();
            break;
    }
}

// === CHURCH-TURING THESIS SECTION ===

/**
 * Show information about different computational models
 * @param {string} modelType - Type of computational model to explain
 */
function showComputationalModel(modelType) {
    const explanationDiv = document.getElementById('modelExplanation');
    const titleEl = document.getElementById('modelTitle');
    const contentEl = document.getElementById('modelContent');
    
    if (!explanationDiv || !titleEl || !contentEl) return;
    
    const models = {
        'modern': {
            title: '🖥️ Modern Computers vs Turing Machines',
            content: `
                <p><strong>Key Insight:</strong> Despite having multiple cores, gigabytes of RAM, and sophisticated architectures, modern computers are fundamentally equivalent to Turing machines in computational power.</p>
                <p><strong>Why?</strong> Any algorithm that runs on a modern computer can be simulated by a Turing machine (though much more slowly). The Church-Turing thesis tells us that this computational equivalence holds regardless of physical implementation.</p>
                <p><strong>Limitations:</strong> Modern computers are actually <em>finite automata</em> due to limited memory, while Turing machines have infinite tape. But for any specific computation, we can imagine a TM with sufficient tape.</p>
            `
        },
        'quantum': {
            title: '⚛️ Quantum Computers vs Turing Machines',
            content: `
                <p><strong>Key Insight:</strong> Quantum computers can solve certain problems exponentially faster than classical computers, but they don't solve fundamentally uncomputable problems.</p>
                <p><strong>Examples:</strong> Shor's algorithm (factoring) and Grover's search show quantum speedup, but the Halting Problem remains undecidable even for quantum computers.</p>
                <p><strong>Church-Turing Thesis:</strong> The <em>quantum</em> Church-Turing thesis suggests quantum computers capture all physically computable functions, but still within the same decidability boundaries.</p>
            `
        },
        'neural': {
            title: '🧠 Neural Networks vs Turing Machines',
            content: `
                <p><strong>Key Insight:</strong> Neural networks, even with billions of parameters, are ultimately discrete computational systems that can be simulated by Turing machines.</p>
                <p><strong>Computational Power:</strong> Recurrent neural networks are Turing-complete in theory, but practical implementations are finite and thus equivalent to finite automata.</p>
                <p><strong>Learning vs Computing:</strong> Neural networks excel at learning patterns, but their fundamental computational capabilities don't exceed Turing machines.</p>
            `
        },
        'dna': {
            title: '🧬 DNA Computing vs Turing Machines',
            content: `
                <p><strong>Key Insight:</strong> DNA computing uses biological molecules to perform calculations, but follows the same logical principles as electronic computers.</p>
                <p><strong>Advantages:</strong> Massive parallelism and biological compatibility, but still bounded by the same decidability limits.</p>
                <p><strong>Equivalence:</strong> Any DNA algorithm can be simulated by a Turing machine, confirming the universality of the TM model.</p>
            `
        }
    };
    
    const model = models[modelType];
    if (model) {
        titleEl.textContent = model.title;
        contentEl.innerHTML = model.content;
        explanationDiv.style.display = 'block';
    }
}

// === HISTORICAL CONTEXT SECTION ===

/**
 * Demonstrate the equivalence between different computational models
 */
function demonstrateEquivalence() {
    const demoDiv = document.getElementById('equivalenceDemo');
    if (!demoDiv) return;
    
    demoDiv.style.display = 'block';
    demoDiv.innerHTML = `
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
            <h5>🔧 Equivalence Demonstration: Computing f(x) = x + 1</h5>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
                <div>
                    <h6>Turing Machine Approach:</h6>
                    <div style="font-family: monospace; background: #2c3e50; color: white; padding: 10px; border-radius: 5px; font-size: 0.9em;">
                        Input: 101 (binary 5)<br>
                        1. Scan right to end<br>
                        2. Move left, flip 1s to 0s<br>
                        3. Flip first 0 to 1, halt<br>
                        Output: 110 (binary 6)
                    </div>
                </div>
                
                <div>
                    <h6>λ-calculus Approach:</h6>
                    <div style="font-family: monospace; background: #8e44ad; color: white; padding: 10px; border-radius: 5px; font-size: 0.9em;">
                        λn. λf. λx. f ((n f) x)<br>
                        <small>// Successor function</small><br>
                        Apply to Church numeral 5<br>
                        Result: Church numeral 6
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 15px 0; padding: 10px; background: rgba(46, 204, 113, 0.2); border-radius: 8px;">
                <strong>🎯 Both methods compute the same function: x ↦ x + 1</strong><br>
                <small>This equivalence across different models supports the Church-Turing Thesis</small>
            </div>
        </div>
    `;
}

// === MULTI-TAPE DTM SECTION ===

/**
 * Initialize the multi-tape DTM visualization
 */
function initializeMultiTape() {
    resetMultiTape();
}

/**
 * Load input string into the multi-tape DTM
 */
function loadMultiTape() {
    const input = document.getElementById('multiTapeInput');
    if (!input) return;
    
    const inputString = input.value.trim() || '0101';
    
    // Initialize multi-tape state for L = {ww | w ∈ {0,1}*}
    multiTapeState = {
        tape1: inputString.split(''),
        tape2: Array(inputString.length + 5).fill('⊔'), // Start with blanks
        head1: 0,
        head2: 0,
        state: 'q_copy',
        step: 0,
        status: 'Ready',
        inputString: inputString,
        isRunning: false
    };
    
    // Pad tape1 with blanks for visualization
    multiTapeState.tape1.push(...Array(5).fill('⊔'));
    
    updateMultiTapeDisplay();
    logMultiTapeStep('Loaded input: ' + inputString);
}

/**
 * Execute one step of the multi-tape DTM
 */
function stepMultiTape() {
    if (multiTapeState.isRunning) return;
    
    const currentSymbol1 = multiTapeState.tape1[multiTapeState.head1] || '⊔';
    const currentSymbol2 = multiTapeState.tape2[multiTapeState.head2] || '⊔';
    
    let action = '';
    let nextState = multiTapeState.state;
    
    // Simple 2-tape DTM for string duplication checking
    switch(multiTapeState.state) {
        case 'q_copy':
            // Copy first half to tape 2, assuming we know the midpoint
            if (currentSymbol1 !== '⊔' && multiTapeState.head1 < Math.floor(multiTapeState.inputString.length / 2)) {
                multiTapeState.tape2[multiTapeState.head2] = currentSymbol1;
                multiTapeState.head1++;
                multiTapeState.head2++;
                action = `Copy '${currentSymbol1}' from tape 1 to tape 2`;
            } else {
                nextState = 'q_compare';
                multiTapeState.head2 = 0; // Reset tape 2 head to start
                action = 'Finished copying, start comparison';
            }
            break;
            
        case 'q_compare':
            if (currentSymbol1 === '⊔' && currentSymbol2 === '⊔') {
                nextState = 'accept';
                action = 'Both halves match - ACCEPT';
            } else if (currentSymbol1 === currentSymbol2 && currentSymbol1 !== '⊔') {
                multiTapeState.head1++;
                multiTapeState.head2++;
                action = `Symbols match: '${currentSymbol1}'`;
            } else {
                nextState = 'reject';
                action = `Symbols don't match: '${currentSymbol1}' ≠ '${currentSymbol2}' - REJECT`;
            }
            break;
            
        case 'accept':
        case 'reject':
            action = 'Machine has halted';
            document.getElementById('multiStepBtn').disabled = true;
            document.getElementById('multiRunBtn').disabled = true;
            return;
    }
    
    multiTapeState.state = nextState;
    multiTapeState.step++;
    
    updateMultiTapeDisplay();
    logMultiTapeStep(`Step ${multiTapeState.step}: ${action}`);
    
    if (multiTapeState.state === 'accept' || multiTapeState.state === 'reject') {
        multiTapeState.status = multiTapeState.state.toUpperCase();
        document.getElementById('multiStepBtn').disabled = true;
        document.getElementById('multiRunBtn').disabled = true;
    }
}

/**
 * Run the multi-tape DTM automatically
 */
function runMultiTape() {
    if (multiTapeState.isRunning) return;
    
    multiTapeState.isRunning = true;
    document.getElementById('multiStepBtn').disabled = true;
    document.getElementById('multiRunBtn').disabled = true;
    
    const runInterval = setInterval(() => {
        stepMultiTape();
        
        if (multiTapeState.state === 'accept' || multiTapeState.state === 'reject') {
            clearInterval(runInterval);
            multiTapeState.isRunning = false;
        }
    }, 800);
}

/**
 * Reset the multi-tape DTM to initial state
 */
function resetMultiTape() {
    multiTapeState = {
        tape1: ['0', '1', '0', '1', '⊔', '⊔', '⊔'],
        tape2: Array(7).fill('⊔'),
        head1: 0,
        head2: 0,
        state: 'q_copy',
        step: 0,
        status: 'Ready',
        inputString: '0101',
        isRunning: false
    };
    
    const stepBtn = document.getElementById('multiStepBtn');
    const runBtn = document.getElementById('multiRunBtn');
    if (stepBtn) stepBtn.disabled = false;
    if (runBtn) runBtn.disabled = false;
    
    updateMultiTapeDisplay();
    
    const logContent = document.getElementById('multiTapeLogContent');
    if (logContent) {
        logContent.innerHTML = 'Ready to trace 2-tape DTM for L = {ww | w ∈ {0,1}*}';
    }
}

/**
 * Update the multi-tape DTM visual display
 */
function updateMultiTapeDisplay() {
    updateTapeDisplay('tape1', multiTapeState.tape1, multiTapeState.head1);
    updateTapeDisplay('tape2', multiTapeState.tape2, multiTapeState.head2);
    
    const stateEl = document.getElementById('multiTapeState');
    const stepEl = document.getElementById('multiTapeStep');
    const statusEl = document.getElementById('multiTapeStatus');
    
    if (stateEl) stateEl.textContent = multiTapeState.state;
    if (stepEl) stepEl.textContent = multiTapeState.step;
    if (statusEl) statusEl.textContent = multiTapeState.status;
}

/**
 * Update individual tape display
 */
function updateTapeDisplay(tapeId, tape, headPos) {
    const container = document.getElementById(tapeId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Show a window of cells around the head
    const windowSize = 7;
    const start = Math.max(0, headPos - Math.floor(windowSize / 2));
    const end = Math.min(tape.length, start + windowSize);
    
    for (let i = start; i < end; i++) {
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = tape[i] || '⊔';
        
        if (i === headPos) {
            cell.classList.add('head');
        }
        
        container.appendChild(cell);
    }
}

/**
 * Log a step in the multi-tape execution
 */
function logMultiTapeStep(message) {
    const logContent = document.getElementById('multiTapeLogContent');
    if (!logContent) return;
    
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logEntry.style.marginBottom = '3px';
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// === SIMULATION PROOF SECTION ===

/**
 * Show different steps of the simulation proof visualization
 * @param {number} step - Which step to show (1-4)
 */
function showSimulationStep(step) {
    const vizContainer = document.getElementById('simulationVisualization');
    const titleEl = document.getElementById('simStepTitle');
    const contentEl = document.getElementById('simStepContent');
    const tapeDisplay = document.getElementById('simTapeDisplay');
    const explanationEl = document.getElementById('simExplanation');
    
    if (!vizContainer || !titleEl || !contentEl) return;
    
    vizContainer.style.display = 'block';
    
    const steps = {
        1: {
            title: 'Step 1: Tape Layout Design',
            content: `
                <p>To simulate a k-tape DTM with a single tape, we need to store all k tapes on one tape using a special encoding.</p>
                <p><strong>Strategy:</strong> Interleave the contents of multiple tapes and use special symbols to mark head positions.</p>
            `,
            tape: '# a b̂ c # x ŷ z #',
            explanation: `
                <strong>Encoding Explanation:</strong><br>
                • # symbols separate different virtual tapes<br>
                • Hat symbols (â, b̂, ŷ) mark the current head positions<br>
                • Original 2-tape config: Tape1=[a,b,c] with head at pos 1, Tape2=[x,y,z] with head at pos 1<br>
                • Single-tape encoding: All information preserved in linear format
            `
        },
        2: {
            title: 'Step 2: Head Position Tracking',
            content: `
                <p>The single-tape DTM must keep track of where each original head was positioned.</p>
                <p><strong>Method:</strong> Use hat notation (^) to mark current positions, scan tape to find all marked positions.</p>
            `,
            tape: '# a b̂ c # x ŷ z # → # a b ĉ # x ŷ z #',
            explanation: `
                <strong>Head Movement Simulation:</strong><br>
                • To move head on virtual tape 1 right: find b̂, remove hat, add hat to next symbol (ĉ)<br>  
                • Each head movement requires scanning the entire tape to locate and update markers<br>
                • This scanning is what causes the quadratic time overhead
            `
        },
        3: {
            title: 'Step 3: Simulation Loop Algorithm',
            content: `
                <p>Each step of the k-tape machine requires multiple phases in the single-tape simulation:</p>
                <ol>
                    <li><strong>Read Phase:</strong> Scan tape to find all head positions and read current symbols</li>
                    <li><strong>Compute Phase:</strong> Apply the k-tape transition function</li>
                    <li><strong>Write Phase:</strong> Scan tape again to update symbols and move head markers</li>
                </ol>
            `,
            tape: 'Reading: # â b c # → Computing: δ(q,a,x) → Writing: # A b̂ c #',
            explanation: `
                <strong>Why Multiple Scans?</strong><br>
                • Must find all k head positions (requires full tape scan)<br>
                • Must update all k positions after transition (requires another full tape scan)<br>
                • Each k-tape step becomes O(tape length) single-tape steps<br>
                • Over T(n) steps, this gives O(T(n)²) total time
            `
        },
        4: {
            title: 'Step 4: Time Complexity Analysis',
            content: `
                <p><strong>Time Complexity Trade-off:</strong></p>
                <p>• <strong>k-tape DTM:</strong> T(n) time</p>
                <p>• <strong>Simulating single-tape DTM:</strong> O(T(n)²) time</p>
                <p>The quadratic blow-up comes from the need to scan the entire tape for each simulated step.</p>
            `,
            tape: 'Simulation overhead visualization: 1 k-tape step = O(tape length) 1-tape steps',
            explanation: `
                <strong>The Big Picture:</strong><br>
                • <span style="color: green;">✓ Same computational power</span> - All computable languages remain computable<br>
                • <span style="color: orange;">⚠ Quadratic slowdown</span> - Time complexity increases from T(n) to O(T(n)²)<br>
                • <span style="color: blue;">🎯 Theoretical significance</span> - Proves multi-tape is just convenience, not extra power<br>
                • This is why we distinguish between language recognition and time complexity
            `
        }
    };
    
    const stepData = steps[step];
    if (stepData) {
        titleEl.textContent = stepData.title;
        contentEl.innerHTML = stepData.content;
        
        if (tapeDisplay) {
            tapeDisplay.innerHTML = `
                <div style="text-align: center; font-family: monospace; font-size: 1.2em; padding: 15px; background: rgba(52, 152, 219, 0.2); border-radius: 8px;">
                    ${stepData.tape}
                </div>
            `;
        }
        
        if (explanationEl) {
            explanationEl.innerHTML = stepData.explanation;
        }
    }
}

// === NONDETERMINISTIC TM SECTION ===

/**
 * Initialize the NTM computation tree visualization
 */
function initializeNTMTree() {
    const canvas = document.getElementById('ntmTreeCanvas');
    if (canvas) {
        ntmTreeState.canvas = canvas;
        ntmTreeState.ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 400;
    }
    resetNTMTree();
}

/**
 * Build the NTM computation tree for pattern "101"
 */
function buildNTMTree() {
    const input = document.getElementById('ntmInput');
    if (!input) return;
    
    const inputString = input.value.trim() || '1011';
    
    // Initialize NTM tree state
    ntmTreeState.input = inputString;
    ntmTreeState.currentLevel = 0;
    ntmTreeState.tree = [];
    ntmTreeState.maxLevel = Math.min(inputString.length + 2, 6); // Limit depth for visualization
    
    // Create initial configuration
    const initialConfig = {
        state: 'q0',
        position: 0,
        remaining: inputString,
        path: 'start',
        level: 0,
        accepted: false,
        rejected: false
    };
    
    ntmTreeState.tree = [
        [initialConfig] // Level 0
    ];
    
    document.getElementById('ntmStepBtn').disabled = false;
    drawNTMTree();
    
    const explanationDiv = document.getElementById('ntmExplanation');
    if (explanationDiv) {
        explanationDiv.style.display = 'block';
        updateNTMTransitions();
    }
}

/**
 * Step through one level of the NTM tree
 */
function stepNTMTree() {
    if (ntmTreeState.currentLevel >= ntmTreeState.maxLevel - 1) {
        document.getElementById('ntmStepBtn').disabled = true;
        return;
    }
    
    const currentLevelConfigs = ntmTreeState.tree[ntmTreeState.currentLevel];
    const nextLevelConfigs = [];
    
    // Generate next level configurations
    currentLevelConfigs.forEach(config => {
        if (config.accepted || config.rejected) {
            nextLevelConfigs.push(config); // Terminal states carry forward
            return;
        }
        
        const currentChar = config.position < ntmTreeState.input.length ? 
                          ntmTreeState.input[config.position] : null;
        
        // NTM transitions for pattern "101"
        const transitions = generateNTMTransitions(config.state, currentChar, config.position);
        
        transitions.forEach(transition => {
            nextLevelConfigs.push({
                state: transition.nextState,
                position: transition.position,
                remaining: transition.remaining,
                path: config.path + ' → ' + transition.action,
                level: ntmTreeState.currentLevel + 1,
                accepted: transition.accepted,
                rejected: transition.rejected
            });
        });
    });
    
    ntmTreeState.currentLevel++;
    ntmTreeState.tree.push(nextLevelConfigs);
    
    drawNTMTree();
    updateNTMTransitions();
}

/**
 * Generate NTM transitions for the "101" pattern recognizer
 */
function generateNTMTransitions(state, char, position) {
    const transitions = [];
    
    switch(state) {
        case 'q0': // Initial/scanning state
            if (char === '1') {
                // Two choices: stay in q0 (ignore) or go to q1 (guess pattern starts)
                transitions.push({
                    nextState: 'q0',
                    position: position + 1,
                    action: 'scan',
                    accepted: false,
                    rejected: false
                });
                transitions.push({
                    nextState: 'q1',
                    position: position + 1,
                    action: 'guess start',
                    accepted: false,
                    rejected: false
                });
            } else if (char === '0') {
                // Only choice: stay in q0
                transitions.push({
                    nextState: 'q0',
                    position: position + 1,
                    action: 'scan',
                    accepted: false,
                    rejected: false
                });
            } else {
                // End of input without finding pattern
                transitions.push({
                    nextState: 'reject',
                    position: position,
                    action: 'reject',
                    accepted: false,
                    rejected: true
                });
            }
            break;
            
        case 'q1': // Expecting '0' after '1'
            if (char === '0') {
                transitions.push({
                    nextState: 'q2',
                    position: position + 1,
                    action: 'found 0',
                    accepted: false,
                    rejected: false
                });
            } else {
                transitions.push({
                    nextState: 'reject',
                    position: position,
                    action: 'reject',
                    accepted: false,
                    rejected: true
                });
            }
            break;
            
        case 'q2': // Expecting final '1'
            if (char === '1') {
                transitions.push({
                    nextState: 'accept',
                    position: position + 1,
                    action: 'found 101!',
                    accepted: true,
                    rejected: false
                });
            } else {
                transitions.push({
                    nextState: 'reject',
                    position: position,
                    action: 'reject',
                    accepted: false,
                    rejected: true
                });
            }
            break;
    }
    
    return transitions;
}

/**
 * Draw the NTM computation tree on canvas  
 */
function drawNTMTree() {
    if (!ntmTreeState.ctx) return;
    
    const ctx = ntmTreeState.ctx;
    const canvas = ntmTreeState.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set drawing styles
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    const levelHeight = 60;
    const nodeWidth = 80;
    const startY = 30;
    
    // Draw tree levels
    ntmTreeState.tree.forEach((level, levelIndex) => {
        if (levelIndex > ntmTreeState.currentLevel) return;
        
        const y = startY + levelIndex * levelHeight;
        const nodeSpacing = Math.min(nodeWidth, canvas.width / (level.length + 1));
        
        level.forEach((config, nodeIndex) => {
            const x = (nodeIndex + 1) * nodeSpacing;
            
            // Choose color based on state
            let color = '#3498db'; // Default blue
            if (config.accepted) color = '#27ae60'; // Green for accept
            else if (config.rejected) color = '#e74c3c'; // Red for reject
            else if (config.state === 'q1') color = '#f39c12'; // Orange for q1
            else if (config.state === 'q2') color = '#9b59b6'; // Purple for q2
            
            // Draw node
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw state label
            ctx.fillStyle = 'white';
            ctx.fillText(config.state, x, y + 4);
            
            // Draw position info below node
            ctx.fillStyle = 'black';
            ctx.font = '10px monospace';
            ctx.fillText(`pos:${config.position}`, x, y + 35);
            ctx.font = '12px monospace';
            
            // Draw connections to parent (if not first level)
            if (levelIndex > 0) {
                const parentLevel = ntmTreeState.tree[levelIndex - 1];
                const parentY = startY + (levelIndex - 1) * levelHeight;
                
                // Simple connection to previous level (approximate)
                const parentX = nodeSpacing * Math.floor(nodeIndex / 2 + 1);
                
                ctx.strokeStyle = '#bdc3c7';
                ctx.beginPath();
                ctx.moveTo(parentX, parentY + 20);
                ctx.lineTo(x, y - 20);
                ctx.stroke();
            }
        });
    });
    
    // Draw level labels
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Input: "${ntmTreeState.input}"`, 10, 20);
    ctx.fillText(`Level: ${ntmTreeState.currentLevel}`, 10, canvas.height - 10);
}

/**
 * Update the NTM transitions display
 */
function updateNTMTransitions() {
    const transitionsDiv = document.getElementById('ntmTransitions');
    if (!transitionsDiv) return;
    
    transitionsDiv.innerHTML = `
        <strong>NTM Transitions for pattern "101":</strong><br>
        δ(q₀, '1') = {(q₀, '1', R), (q₁, '1', R)} // Nondeterministic choice<br>
        δ(q₀, '0') = {(q₀, '0', R)} // Continue scanning<br>
        δ(q₁, '0') = {(q₂, '0', R)} // Must see '0' after '1'<br>
        δ(q₂, '1') = {(accept, '1', R)} // Complete pattern "101"<br>
        <br>
        <small>Current tree shows all possible computation paths simultaneously.</small>
    `;
}

/**
 * Reset the NTM tree visualization
 */
function resetNTMTree() {
    ntmTreeState = {
        input: '',
        currentLevel: 0,
        tree: [],
        maxLevel: 0,
        canvas: ntmTreeState.canvas,
        ctx: ntmTreeState.ctx
    };
    
    if (ntmTreeState.ctx) {
        ntmTreeState.ctx.clearRect(0, 0, ntmTreeState.canvas.width, ntmTreeState.canvas.height);
    }
    
    const explanationDiv = document.getElementById('ntmExplanation');
    if (explanationDiv) {
        explanationDiv.style.display = 'none';
    }
    
    const stepBtn = document.getElementById('ntmStepBtn');
    if (stepBtn) stepBtn.disabled = true;
}

// === NTM SIMULATION SECTION ===

/**
 * Initialize the NTM simulation visualization
 */
function initializeNTMSimulation() {
    resetNTMSimulation();
}

/**
 * Start the breadth-first search simulation of NTM by DTM
 */
function startNTMSimulation() {
    const input = document.getElementById('ntmSimInput');
    if (!input) return;
    
    const inputString = input.value.trim() || '101';
    
    // Initialize simulation state
    ntmSimState = {
        input: inputString,
        configurations: [
            { state: 'q0', position: 0, id: 'config-0' }
        ],
        generation: 0,
        status: 'Running'
    };
    
    document.getElementById('ntmSimStepBtn').disabled = false;
    document.getElementById('ntmSimVisualization').style.display = 'block';
    
    updateNTMSimDisplay();
}

/**
 * Step through one generation of the NTM simulation
 */
function stepNTMSimulation() {
    if (ntmSimState.status !== 'Running') return;
    
    const currentConfigs = ntmSimState.configurations;
    const nextConfigs = [];
    let foundAccept = false;
    
    // Generate next generation of configurations
    currentConfigs.forEach((config, index) => {
        if (config.state === 'accept' || config.state === 'reject') {
            if (config.state === 'accept') foundAccept = true;
            return; // Skip terminal states
        }
        
        const currentChar = config.position < ntmSimState.input.length ? 
                          ntmSimState.input[config.position] : null;
        
        // Generate successor configurations based on NTM transitions
        const successors = generateNTMTransitions(config.state, currentChar, config.position);
        
        successors.forEach((successor, succIndex) => {
            nextConfigs.push({
                state: successor.nextState,
                position: successor.position,
                id: `config-${ntmSimState.generation + 1}-${nextConfigs.length}`,
                parent: config.id,
                action: successor.action
            });
            
            if (successor.accepted) foundAccept = true;
        });
    });
    
    // Update state  
    ntmSimState.generation++;
    ntmSimState.configurations = nextConfigs;
    
    // Check termination conditions
    if (foundAccept) {
        ntmSimState.status = 'ACCEPTED';
        document.getElementById('ntmSimStepBtn').disabled = true;
    } else if (nextConfigs.length === 0) {
        ntmSimState.status = 'REJECTED';
        document.getElementById('ntmSimStepBtn').disabled = true;
    }
    
    updateNTMSimDisplay();
}

/**
 * Update the NTM simulation display
 */
function updateNTMSimDisplay() {
    const levelEl = document.getElementById('generationLevel');
    const configListEl = document.getElementById('configurationsList');
    const configCountEl = document.getElementById('configCount');
    const depthEl = document.getElementById('searchDepth');
    const statusEl = document.getElementById('simStatus');
    
    if (levelEl) levelEl.textContent = ntmSimState.generation;
    if (configCountEl) configCountEl.textContent = ntmSimState.configurations.length;
    if (depthEl) depthEl.textContent = ntmSimState.generation;
    if (statusEl) statusEl.textContent = ntmSimState.status;
    
    if (configListEl) {
        configListEl.innerHTML = '';
        
        if (ntmSimState.configurations.length === 0) {
            configListEl.textContent = 'No active configurations (all paths terminated)';
        } else {
            ntmSimState.configurations.forEach(config => {
                const configDiv = document.createElement('div');
                configDiv.style.marginBottom = '5px';
                configDiv.style.padding = '5px';
                configDiv.style.borderRadius = '3px';
                
                let bgColor = '#f8f9fa';
                if (config.state === 'accept') bgColor = '#d5f4e6';
                else if (config.state === 'reject') bgColor = '#fdf2f2';
                
                configDiv.style.background = bgColor;
                configDiv.textContent = `[${config.state}, pos:${config.position}]`;
                
                configListEl.appendChild(configDiv);
            });
        }
    }
}

/**
 * Reset the NTM simulation
 */
function resetNTMSimulation() {
    ntmSimState = {
        input: '',
        configurations: [],
        generation: 0,
        status: 'Ready'
    };
    
    const vizDiv = document.getElementById('ntmSimVisualization');
    if (vizDiv) vizDiv.style.display = 'none';
    
    const stepBtn = document.getElementById('ntmSimStepBtn');
    if (stepBtn) stepBtn.disabled = true;
}

// === ROBUSTNESS SECTION ===

/**
 * Show examples of TM robustness
 * @param {string} type - Type of robustness example
 */
function showRobustnessExample(type) {
    const demoDiv = document.getElementById('robustnessDemo');
    const titleEl = document.getElementById('robustnessTitle');
    const contentEl = document.getElementById('robustnessContent');
    const proofEl = document.getElementById('robustnessProof');
    
    if (!demoDiv || !titleEl || !contentEl || !proofEl) return;
    
    const examples = {
        'stay': {
            title: 'Adding "Stay" Direction (δ(q,a) = (q\',b,0))',
            content: `
                <p><strong>Extension:</strong> Allow transitions where the head doesn't move: δ(q,a) = (q',b,0)</p>
                <p><strong>Question:</strong> Does this increase computational power?</p>
                <p><strong>Answer:</strong> No! We can simulate "stay" moves using only left and right.</p>
            `,
            proof: `
                <strong>Construction:</strong> For each "stay" transition δ(q,a) = (q',b,0), create auxiliary state q'_L and replace with:<br>
                • δ'(q,a) = (q'_L, b, +1) — Write b, move right<br>
                • δ'(q'_L, c) = (q', c, -1) for all symbols c — Move back left<br><br>
                <strong>Result:</strong> The net effect is writing b and staying in place, using only L/R moves.
            `
        },
        'doubly-infinite': {
            title: 'Doubly-Infinite Tape (extends in both directions)',
            content: `
                <p><strong>Extension:</strong> Tape extends infinitely in both directions: ...□□□□□...</p>
                <p><strong>Question:</strong> Does this increase computational power?</p>
                <p><strong>Answer:</strong> No! We can simulate doubly-infinite tape on singly-infinite tape.</p>
            `,
            proof: `
                <strong>Encoding Strategy:</strong> Map doubly-infinite positions to singly-infinite positions:<br>
                • Position 0 → Address 1<br>
                • Position +n → Address 2n+1 (odd addresses)<br>
                • Position -n → Address 2n (even addresses)<br><br>
                <strong>Example:</strong> ...-2,-1,0,+1,+2,... maps to 1,2,3,4,5,6,...<br>
                The single-tape DTM can simulate any doubly-infinite computation.
            `
        },
        'multi-tape': {
            title: 'Multiple Tapes (k independent tapes)',
            content: `
                <p><strong>Extension:</strong> k tapes with k independent heads</p>
                <p><strong>Question:</strong> Does this increase computational power?</p>
                <p><strong>Answer:</strong> No! We proved this with our simulation construction.</p>
            `,
            proof: `
                <strong>Already Proven:</strong> We showed how to simulate k-tape DTM with single-tape DTM:<br>
                • Interleave tape contents with head markers<br>
                • Each k-tape step requires scanning single tape<br>
                • Time complexity: O(T(n)²) but same languages<br><br>
                <strong>Significance:</strong> Multi-tape is convenience, not additional power.
            `
        },
        'nondeterministic': {
            title: 'Nondeterminism (multiple possible transitions)',
            content: `
                <p><strong>Extension:</strong> δ: Q×Γ → 2^(Q×Γ×{L,R,S})</p>
                <p><strong>Question:</strong> Does this increase computational power?</p>
                <p><strong>Answer:</strong> No! We proved NTM ≡ DTM using breadth-first simulation.</p>
            `,
            proof: `
                <strong>Already Proven:</strong> DTM can simulate NTM using breadth-first search:<br>
                • Maintain sets of configurations Γᵢ<br>
                • Generate Γᵢ₊₁ from all possible transitions from Γᵢ<br>
                • Accept if any configuration is accepting<br><br>
                <strong>Time Complexity:</strong> Exponential slowdown but same decidable languages.
            `
        }
    };
    
    const example = examples[type];
    if (example) {
        titleEl.textContent = example.title;
        contentEl.innerHTML = example.content;
        proofEl.innerHTML = example.proof;
        demoDiv.style.display = 'block';
    }
}

/**
 * Show detailed simulation of "stay" direction
 */
function showStaySimulation() {
    const simDiv = document.getElementById('staySimulation');
    if (simDiv) {
        toggleElementVisibility(simDiv);
    }
}

/**
 * Show detailed simulation of doubly-infinite tape
 */
function showDoublyInfiniteSimulation() {
    const simDiv = document.getElementById('doublyInfiniteSimulation');
    if (simDiv) {
        toggleElementVisibility(simDiv);
    }
}

// === PRACTICE PROBLEMS SECTION ===

/**
 * Initialize practice problems section
 */
function initializePracticeProblems() {
    practiceState.ntmTransitions = {};
    practiceState.userAnswers = {};
}

/**
 * Add a transition to the NTM being built
 */
function addNTMTransition() {
    const fromState = document.getElementById('fromState').value;
    const readSymbol = document.getElementById('readSymbol').value;
    const toState = document.getElementById('toState').value;
    
    if (!practiceState.ntmTransitions[fromState]) {
        practiceState.ntmTransitions[fromState] = {};
    }
    
    if (!practiceState.ntmTransitions[fromState][readSymbol]) {
        practiceState.ntmTransitions[fromState][readSymbol] = [];
    }
    
    practiceState.ntmTransitions[fromState][readSymbol].push(toState);
    
    updateNTMTransitionsList();
}

/**
 * Update the display of NTM transitions
 */
function updateNTMTransitionsList() {
    const listDiv = document.getElementById('transitionEntries');
    if (!listDiv) return;
    
    listDiv.innerHTML = '';
    
    for (const state in practiceState.ntmTransitions) {
        for (const symbol in practiceState.ntmTransitions[state]) {
            const transitions = practiceState.ntmTransitions[state][symbol];
            const transitionStr = `δ(${state}, ${symbol}) = {${transitions.join(', ')}}`;
            
            const entryDiv = document.createElement('div');
            entryDiv.textContent = transitionStr;
            entryDiv.style.marginBottom = '3px';
            listDiv.appendChild(entryDiv);
        }
    }
    
    if (Object.keys(practiceState.ntmTransitions).length === 0) {
        listDiv.textContent = 'None added yet';
    }
}

/**
 * Test the user's NTM design
 */
function testNTMDesign() {
    const resultsDiv = document.getElementById('ntmTestResults');
    const outputDiv = document.getElementById('ntmTestOutput');
    
    if (!resultsDiv || !outputDiv) return;
    
    // Simple test cases for "110" pattern
    const testCases = ['110', '1110', '0110', '101', '111'];
    const results = [];
    
    testCases.forEach(testInput => {
        const result = simulateUserNTM(testInput);
        results.push(`Input "${testInput}": ${result ? 'ACCEPT' : 'REJECT'}`);
    });
    
    outputDiv.innerHTML = results.join('<br>');
    resultsDiv.style.display = 'block';
}

/**
 * Simulate the user's NTM on a test input
 */
function simulateUserNTM(input) {
    // Simplified simulation - just check if transitions exist for a basic path
    // In a full implementation, this would do breadth-first search
    
    let state = 'q0';
    let position = 0;
    const maxSteps = input.length + 5;
    
    for (let step = 0; step < maxSteps && position <= input.length; step++) {
        const currentChar = position < input.length ? input[position] : '⊔';
        
        if (state === 'accept') return true;
        if (state === 'reject') return false;
        
        const transitions = practiceState.ntmTransitions[state];
        if (!transitions || !transitions[currentChar]) {
            return false; // Stuck, assume reject
        }
        
        // Take first available transition (simplified)
        state = transitions[currentChar][0];
        position++;
    }
    
    return state === 'accept';
}

/**
 * Show the solution for the NTM problem
 */
function showNTMSolution() {
    const solutionDiv = document.getElementById('ntmSolution');
    if (solutionDiv) {
        toggleElementVisibility(solutionDiv);
    }
}

/**
 * Show enumerator to TM construction
 */
function showEnumeratorToTM() {
    const div = document.getElementById('enumToTM');
    if (div) {
        toggleElementVisibility(div);
    }
}

/**
 * Show TM to enumerator construction
 */
function showTMToEnumerator() {
    const div = document.getElementById('tmToEnum');
    if (div) {
        toggleElementVisibility(div);
    }
}

/**
 * Check the user's multi-tape design
 */
function checkMultiTapeDesign() {
    const phase1 = document.getElementById('phase1Strategy').value.trim();
    const phase2 = document.getElementById('phase2Strategy').value.trim();
    const phase3 = document.getElementById('phase3Strategy').value.trim();
    
    const feedbackDiv = document.getElementById('designFeedback');
    if (!feedbackDiv) return;
    
    let feedback = '<h5>Design Feedback:</h5>';
    let score = 0;
    
    // Check Phase 1
    if (phase1.toLowerCase().includes('copy') || phase1.toLowerCase().includes('tape 2')) {
        feedback += '<p>✅ Phase 1: Good! Copying a\'s to tape 2 is the right approach.</p>';
        score++;
    } else {
        feedback += '<p>❌ Phase 1: Consider how tape 2 can store the count of a\'s.</p>';
    }
    
    // Check Phase 2  
    if (phase2.toLowerCase().includes('match') || phase2.toLowerCase().includes('compare')) {
        feedback += '<p>✅ Phase 2: Correct! Matching b\'s against tape 2 content.</p>';
        score++;
    } else {
        feedback += '<p>❌ Phase 2: Think about how to verify n b\'s using tape 2.</p>';
    }
    
    // Check Phase 3
    if (phase3.toLowerCase().includes('2n') || phase3.toLowerCase().includes('twice')) {
        feedback += '<p>✅ Phase 3: Excellent! You need to check for exactly 2n final a\'s.</p>';
        score++;
    } else {
        feedback += '<p>❌ Phase 3: Remember the final block should have twice as many a\'s.</p>';
    }
    
    feedback += `<p><strong>Score: ${score}/3</strong></p>`;
    feedbackDiv.innerHTML = feedback;
    feedbackDiv.style.display = 'block';
}

/**
 * Show the multi-tape solution
 */
function showMultiTapeSolution() {
    const solutionDiv = document.getElementById('multiTapeSolution');
    if (solutionDiv) {
        toggleElementVisibility(solutionDiv);
    }
}

// === EXAM PREPARATION SECTION ===

/**
 * Initialize exam preparation section
 */
function initializeExamPreparation() {
    examState = {
        timeLeft: 12 * 60,
        isRunning: false,
        interval: null
    };
}

/**
 * Show master strategy for exam
 */
function showMasterStrategy() {
    const div = document.getElementById('masterStrategy');
    if (div) {
        toggleElementVisibility(div);
    }
}

/**
 * Show model answer for NTM equivalence
 */
function showNTMEquivalenceAnswer() {
    const div = document.getElementById('ntmEquivalenceAnswer');
    if (div) {
        toggleElementVisibility(div);
    }
}

/**
 * Start the lesson 2 exam simulation
 */
function startLesson2Exam() {
    examState.timeLeft = 12 * 60; // 12 minutes
    examState.isRunning = true;
    
    document.getElementById('startExamBtn').style.display = 'none';
    document.getElementById('stopExamBtn').style.display = 'inline-block';
    document.getElementById('examQuestions').style.display = 'block';
    document.getElementById('examResults').style.display = 'none';
    
    // Clear previous answers
    ['exam2Answer1', 'exam2Answer2', 'exam2Answer3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    updateExamTimer();
    examState.interval = setInterval(updateExamTimer, 1000);
}

/**
 * Stop the lesson 2 exam simulation
 */
function stopLesson2Exam() {
    if (examState.interval) {
        clearInterval(examState.interval);
    }
    
    examState.isRunning = false;
    
    document.getElementById('startExamBtn').style.display = 'inline-block';
    document.getElementById('stopExamBtn').style.display = 'none';
    document.getElementById('examQuestions').style.display = 'none';
    document.getElementById('examResults').style.display = 'block';
    
    const feedbackDiv = document.getElementById('examFeedback');
    if (feedbackDiv) {
        feedbackDiv.innerHTML = '<p style="color: orange;">⏰ Exam stopped manually. Answers not submitted for grading.</p>';
    }
}

/**
 * Update the exam timer display
 */
function updateExamTimer() {
    const minutes = Math.floor(examState.timeLeft / 60);
    const seconds = examState.timeLeft % 60;
    
    const timerEl = document.getElementById('examTimer');
    if (timerEl) {
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (examState.timeLeft <= 0) {
        submitLesson2Exam(true); // Auto-submit when time runs out
        return;
    }
    
    examState.timeLeft--;
}

/**
 * Submit the lesson 2 exam answers
 */
function submitLesson2Exam(timeUp = false) {
    if (examState.interval) {
        clearInterval(examState.interval);
    }
    
    examState.isRunning = false;
    
    document.getElementById('startExamBtn').style.display = 'inline-block';
    document.getElementById('stopExamBtn').style.display = 'none';
    document.getElementById('examQuestions').style.display = 'none';
    document.getElementById('examResults').style.display = 'block';
    
    const answer1 = document.getElementById('exam2Answer1')?.value.trim() || '';
    const answer2 = document.getElementById('exam2Answer2')?.value.trim() || '';
    const answer3 = document.getElementById('exam2Answer3')?.value.trim() || '';
    
    const feedbackDiv = document.getElementById('examFeedback');
    if (feedbackDiv) {
        let feedback = timeUp ? '<h3>⏰ Time\'s Up! Exam Auto-Submitted</h3>' : '<h3>📝 Exam Submitted Successfully</h3>';
        
        feedback += '<div style="margin: 20px 0;">';
        
        // Question 1 feedback
        feedback += '<div style="margin: 15px 0; padding: 15px; border-radius: 8px; background: #f8f9fa;">';
        feedback += '<strong>Question 1 - 2-tape DTM for L = {w^R w | w ∈ {a,b}*}:</strong><br>';
        if (answer1) {
            feedback += '✅ Answer provided<br>';
            feedback += '<small>Self-check: Does your solution copy w to tape 2, reverse it, then compare with second half of input?</small>';
        } else {
            feedback += '❌ No answer provided<br>';
            feedback += '<small>Key insight: Use tape 2 to store reverse of first half, then compare.</small>';
        }
        feedback += '</div>';
        
        // Question 2 feedback  
        feedback += '<div style="margin: 15px 0; padding: 15px; border-radius: 8px; background: #f8f9fa;">';
        feedback += '<strong>Question 2 - "Stay" direction simulation:</strong><br>';
        if (answer2) {
            feedback += '✅ Answer provided<br>';
            feedback += '<small>Self-check: Did you mention using auxiliary states and right-then-left moves?</small>';
        } else {
            feedback += '❌ No answer provided<br>';
            feedback += '<small>Key insight: δ(q,a) = (q\',b,0) becomes δ(q,a) = (q\'_R,b,+1) then δ(q\'_R,x) = (q\',x,-1)</small>';
        }
        feedback += '</div>';
        
        // Question 3 feedback
        feedback += '<div style="margin: 15px 0; padding: 15px; border-radius: 8px; background: #f8f9fa;">';
        feedback += '<strong>Question 3 - NTM for consecutive 1s:</strong><br>';
        if (answer3) {
            feedback += '✅ Answer provided<br>';
            feedback += '<small>Self-check: Does your NTM nondeterministically guess where "11" starts?</small>';
        } else {
            feedback += '❌ No answer provided<br>';
            feedback += '<small>Key insight: δ(q0,1) = {(q0,1,R), (q1,1,R)} allows guessing start of pattern.</small>';
        }
        feedback += '</div>';
        
        feedback += '</div>';
        
        const score = [answer1, answer2, answer3].filter(a => a.length > 10).length;
        feedback += `<div style="text-align: center; padding: 20px; background: ${score >= 2 ? '#d5f4e6' : '#fff3cd'}; border-radius: 10px; margin: 20px 0;">`;
        feedback += `<h4>Completion Rate: ${score}/3 questions answered</h4>`;
        if (score >= 2) {
            feedback += '<p style="color: #27ae60;">🎉 Well done! Review any missed concepts.</p>';
        } else {
            feedback += '<p style="color: #f39c12;">📚 Consider reviewing the lesson materials for concepts you missed.</p>';
        }
        feedback += '</div>';
        
        feedbackDiv.innerHTML = feedback;
    }
}

// === EXPORT FUNCTIONS FOR GLOBAL ACCESS ===

// Export all functions to global scope so HTML onclick handlers can access them
window.showComputationalModel = showComputationalModel;
window.demonstrateEquivalence = demonstrateEquivalence;
window.loadMultiTape = loadMultiTape;
window.stepMultiTape = stepMultiTape;
window.runMultiTape = runMultiTape;
window.resetMultiTape = resetMultiTape;
window.showSimulationStep = showSimulationStep;
window.buildNTMTree = buildNTMTree;  
window.stepNTMTree = stepNTMTree;
window.resetNTMTree = resetNTMTree;
window.startNTMSimulation = startNTMSimulation;
window.stepNTMSimulation = stepNTMSimulation;
window.resetNTMSimulation = resetNTMSimulation;
window.showRobustnessExample = showRobustnessExample;
window.showStaySimulation = showStaySimulation;
window.showDoublyInfiniteSimulation = showDoublyInfiniteSimulation;
window.addNTMTransition = addNTMTransition;
window.testNTMDesign = testNTMDesign;
window.showNTMSolution = showNTMSolution;
window.showEnumeratorToTM = showEnumeratorToTM;
window.showTMToEnumerator = showTMToEnumerator;
window.checkMultiTapeDesign = checkMultiTapeDesign;
window.showMultiTapeSolution = showMultiTapeSolution;
window.showMasterStrategy = showMasterStrategy;
window.showNTMEquivalenceAnswer = showNTMEquivalenceAnswer;
window.startLesson2Exam = startLesson2Exam;
window.stopLesson2Exam = stopLesson2Exam;
window.submitLesson2Exam = submitLesson2Exam;

// Override the global onSectionChanged function
window.onSectionChanged = onSectionChanged;