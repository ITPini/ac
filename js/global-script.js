// global-script.js - Shared functionality between all lessons

// Global state management
let currentSection = 'church-turing'; // Default for lesson 2
const completedSections = new Set();
const totalSections = 9; // Update based on lesson

// Progress tracking
let progressFill, progressText;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    
    // Initialize the lesson
    initializeLesson();
    
    // Setup KaTeX rendering if available
    setupKaTeX();
});

/**
 * Initialize the lesson with default settings
 */
function initializeLesson() {
    // Show first section by default
    const firstSection = document.querySelector('.section');
    if (firstSection) {
        showSection(firstSection.id);
    }
    updateProgress();
}

/**
 * Navigate between lesson sections
 * @param {string} sectionId - The ID of the section to show
 */
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update sidebar navigation
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
    
    // Call section-specific initialization if needed
    onSectionChanged(sectionId);
}

/**
 * Hook for lesson-specific section change handling
 * Override this in lesson-specific scripts
 */
function onSectionChanged(sectionId) {
    // Override in lesson-specific scripts
}

/**
 * Update the progress bar display
 */
function updateProgress() {
    const percentage = Math.round((completedSections.size / totalSections) * 100);
    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = percentage + '%';
}

/**
 * Handle quiz option selection with visual feedback
 * @param {HTMLElement} element - The clicked quiz option
 * @param {boolean} isCorrect - Whether this option is correct
 */
function selectQuizOption(element, isCorrect) {
    const questionContainer = element.closest('.quiz-container');
    if (!questionContainer) return;
    
    const options = questionContainer.querySelectorAll('.quiz-option');
    
    // Remove previous styling and disable other options
    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        opt.onclick = null; // Disable further clicks
        
        // Check if this is the clicked option
        if (opt.contains(element) || opt === element) {
            if (isCorrect) {
                opt.classList.add('correct');
            } else {
                opt.classList.add('incorrect');
            }
        }
    });

    // Show appropriate feedback
    const feedbackCorrect = questionContainer.querySelector('.feedback.correct');
    const feedbackIncorrect = questionContainer.querySelector('.feedback.incorrect');

    // Hide all feedback first
    if (feedbackCorrect) feedbackCorrect.style.display = 'none';
    if (feedbackIncorrect) feedbackIncorrect.style.display = 'none';

    // Show appropriate feedback
    if (isCorrect) {
        if (feedbackCorrect) feedbackCorrect.style.display = 'block';
    } else {
        if (feedbackIncorrect) feedbackIncorrect.style.display = 'block';
    }
}

/**
 * Setup KaTeX mathematical rendering
 */
function setupKaTeX() {
    // Wait for KaTeX to load, then render math expressions
    const checkKaTeX = () => {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        } else {
            console.warn("KaTeX auto-render not loaded yet");
            // Try again after a short delay
            setTimeout(checkKaTeX, 100);
        }
    };
    
    // Start checking for KaTeX
    setTimeout(checkKaTeX, 100);
}

/**
 * Utility function to create animated elements
 * @param {string} text - Text content
 * @param {string} className - CSS class name
 * @returns {HTMLElement} Created element
 */
function createAnimatedElement(text, className = 'symbol') {
    const element = document.createElement('div');
    element.className = className;
    element.textContent = text;
    element.style.animation = 'popIn 0.5s ease';
    return element;
}

/**
 * Utility function to show/hide elements with animation
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} show - Whether to show or hide
 */
function toggleElementVisibility(element, show = null) {
    if (!element) return;
    
    if (show === null) {
        // Toggle current state
        show = element.style.display === 'none';
    }
    
    if (show) {
        element.style.display = 'block';
        element.style.animation = 'fadeIn 0.3s ease';
    } else {
        element.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    }
}

/**
 * Utility function to clear container and add loading state
 * @param {HTMLElement} container - Container to clear
 * @param {string} loadingText - Loading message
 */
function showLoading(container, loadingText = 'Loading...') {
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #ccc; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
            ${loadingText}
        </div>
    `;
}

/**
 * Add CSS animation for spinner if not already present
 */
if (!document.querySelector('#spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Export functions for global use
window.showSection = showSection;
window.selectQuizOption = selectQuizOption;
window.updateProgress = updateProgress;
window.toggleElementVisibility = toggleElementVisibility;
window.createAnimatedElement = createAnimatedElement;
window.showLoading = showLoading;