document.addEventListener('DOMContentLoaded', () => {
    // Game configuration
    const WORD_LENGTH = 7; // Length of the word QUECHUA
    const MAX_ATTEMPTS = 7; // Number of attempts allowed
    const TARGET_WORD = 'QUECHUA'; // The word to guess
    
    // DOM elements
    const landingPage = document.getElementById('landing-page');
    const startButton = document.getElementById('start-button');
    const gameContainer = document.getElementById('game-container');
    const gridContainer = document.getElementById('grid-container');
    const keyboardElement = document.getElementById('keyboard');
    const messageElement = document.getElementById('message');
    const winModal = document.getElementById('win-modal');
    const hintModal = document.getElementById('hint-modal');
    const hintButton = document.getElementById('hint-button');
    const hintCloseButton = document.getElementById('hint-close-button');
    const hintText = document.getElementById('hint-text');
    const winCloseButton = document.getElementById('win-close-button');
    const celebrationElement = document.getElementById('celebration');
    
    // Game state
    let currentRow = 0;
    let currentCol = 0;
    let gameOver = false;
    let currentGuess = [];
    let gameGrid = [];
    let keyboardState = {};
    
    // Initialize the game
    function initGame() {
        // Create the grid
        for (let row = 0; row < MAX_ATTEMPTS; row++) {
            const gridRow = document.createElement('div');
            gridRow.className = 'grid-row';
            
            const rowCells = [];
            
            for (let col = 0; col < WORD_LENGTH; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('aria-live', 'polite'); // Accessibility
                
                gridRow.appendChild(cell);
                rowCells.push(cell);
            }
            
            gridContainer.appendChild(gridRow);
            gameGrid.push(rowCells);
        }
        
        // Create the keyboard
        const keyboardLayout = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
        ];
        
        keyboardLayout.forEach(row => {
            const keyboardRow = document.createElement('div');
            keyboardRow.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyButton = document.createElement('button');
                keyButton.className = 'key';
                keyButton.textContent = key;
                keyButton.setAttribute('aria-label', key); // Accessibility
                
                if (key === 'ENTER' || key === 'BACKSPACE') {
                    keyButton.classList.add('wide');
                    // Use text instead of icons for better compatibility
                    if (key === 'BACKSPACE') {
                        keyButton.textContent = '←';
                        keyButton.setAttribute('aria-label', 'Backspace'); // Accessibility
                    }
                }
                
                keyButton.addEventListener('click', () => handleKeyPress(key));
                keyboardRow.appendChild(keyButton);
                
                // Initialize keyboard state
                if (key.length === 1) {
                    keyboardState[key] = 'unused';
                }
            });
            
            keyboardElement.appendChild(keyboardRow);
        });
        
        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (gameOver) return;
            
            const key = e.key.toUpperCase();
            
            if (key === 'ENTER') {
                handleKeyPress('ENTER');
            } else if (key === 'BACKSPACE' || key === 'DELETE') {
                handleKeyPress('BACKSPACE');
            } else if (/^[A-Z]$/.test(key)) {
                handleKeyPress(key);
            }
        });
        
        // Initialize touch events for better mobile experience
        initTouchEvents();
    }
    
    // Initialize touch events for mobile
    function initTouchEvents() {
        let xDown = null;
        let yDown = null;
        
        document.addEventListener('touchstart', handleTouchStart, false);
        document.addEventListener('touchmove', handleTouchMove, false);
        
        function handleTouchStart(evt) {
            xDown = evt.touches[0].clientX;
            yDown = evt.touches[0].clientY;
        }
        
        function handleTouchMove(evt) {
            if (!xDown || !yDown) {
                return;
            }
            
            const xUp = evt.touches[0].clientX;
            const yUp = evt.touches[0].clientY;
            
            const xDiff = xDown - xUp;
            const yDiff = yDown - yUp;
            
            // Only use swipe for backspace if we're in the game
            if (!gameOver && !landingPage.classList.contains('hidden')) {
                if (Math.abs(yDiff) > Math.abs(xDiff) && yDiff < -50) {
                    // Swipe down - use as backspace
                    deleteLetter();
                }
            }
            
            xDown = null;
            yDown = null;
        }
    }
    
    // Handle key presses
    function handleKeyPress(key) {
        if (gameOver) return;
        
        if (key === 'ENTER') {
            submitGuess();
        } else if (key === 'BACKSPACE' || key === '←') {
            deleteLetter();
        } else if (/^[A-Z]$/.test(key) && currentCol < WORD_LENGTH) {
            addLetter(key);
        }
    }
    
    // Add a letter to the current guess
    function addLetter(letter) {
        if (currentCol < WORD_LENGTH) {
            const cell = gameGrid[currentRow][currentCol];
            cell.textContent = letter;
            cell.classList.add('filled');
            currentGuess.push(letter);
            currentCol++;
            
            // Add a subtle animation
            cell.animate([
                { transform: 'scale(1.1)' },
                { transform: 'scale(1)' }
            ], {
                duration: 100,
                easing: 'ease-out'
            });
            
            // Vibration feedback for mobile if supported
            if (navigator.vibrate) {
                navigator.vibrate(20);
            }
        }
    }
    
    // Delete the last letter from the current guess
    function deleteLetter() {
        if (currentCol > 0) {
            currentCol--;
            const cell = gameGrid[currentRow][currentCol];
            cell.textContent = '';
            cell.classList.remove('filled');
            currentGuess.pop();
            
            // Vibration feedback for mobile if supported
            if (navigator.vibrate) {
                navigator.vibrate([10, 10, 10]);
            }
        }
    }
    
    // Submit the current guess for validation
    function submitGuess() {
        if (currentGuess.length !== WORD_LENGTH) {
            showMessage('Please enter all ' + WORD_LENGTH + ' letters', 'error');
            shakeRow();
            return;
        }
        
        const guess = currentGuess.join('');
        checkGuess(guess);
        
        // Check if game is over
        if (guess === TARGET_WORD) {
            setTimeout(() => {
                gameOver = true;
                showWinModal();
            }, WORD_LENGTH * 300 + 500); // Wait for flip animations to complete
        } else if (currentRow === MAX_ATTEMPTS - 1) {
            setTimeout(() => {
                gameOver = true;
                showHintModal();
            }, WORD_LENGTH * 300 + 500); // Wait for flip animations to complete
        } else {
            // Move to next row
            currentRow++;
            currentCol = 0;
            currentGuess = [];
        }
    }
    
    // Check the current guess against the target word
    function checkGuess(guess) {
        const result = Array(WORD_LENGTH).fill('absent');
        const targetLetters = TARGET_WORD.split('');
        
        // First pass: check for correct positions
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null; // Mark as used
            }
        }
        
        // Second pass: check for present letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (result[i] === 'absent') {
                const letterIndex = targetLetters.indexOf(guess[i]);
                if (letterIndex !== -1) {
                    result[i] = 'present';
                    targetLetters[letterIndex] = null; // Mark as used
                }
            }
        }
        
        // Reveal the results with animation
        for (let i = 0; i < WORD_LENGTH; i++) {
            const cell = gameGrid[currentRow][i];
            const status = result[i];
            
            // Update keyboard state
            if (keyboardState[guess[i]] !== 'correct') {
                keyboardState[guess[i]] = status;
            }
            
            // Animate with delay
            setTimeout(() => {
                cell.classList.add('reveal');
                
                // Apply color after half the animation
                setTimeout(() => {
                    cell.classList.add(status);
                    cell.setAttribute('aria-label', `${guess[i]} ${status}`); // Accessibility
                    updateKeyboard(guess[i], status);
                    
                    // Vibration pattern based on result
                    if (navigator.vibrate) {
                        if (status === 'correct') {
                            navigator.vibrate(100);
                        } else if (status === 'present') {
                            navigator.vibrate([40, 30, 40]);
                        } else {
                            navigator.vibrate(30);
                        }
                    }
                }, 150);
            }, i * 300);
        }
    }
    
    // Update the keyboard colors based on guesses
    function updateKeyboard(letter, status) {
        // Find the key button
        const keyButtons = document.querySelectorAll('.key');
        keyButtons.forEach(button => {
            if (button.textContent === letter) {
                // Only update if new status is "better"
                if (status === 'correct' || 
                    (status === 'present' && button.classList.contains('absent')) ||
                    (!button.classList.contains('correct') && !button.classList.contains('present'))) {
                    
                    // Remove existing status classes
                    button.classList.remove('correct', 'present', 'absent');
                    // Add new status class
                    button.classList.add(status);
                }
            }
        });
    }
    
    // Show a message to the user
    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = 'message ' + type;
        messageElement.classList.add('show');
        
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 2000);
    }
    
    // Shake the current row when there's an error
    function shakeRow() {
        const row = document.querySelector(`.grid-row:nth-child(${currentRow + 1})`);
        
        // Vibration feedback for mobile if supported
        if (navigator.vibrate) {
            navigator.vibrate([30, 30, 30, 30]);
        }
        
        row.animate([
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 300,
            easing: 'ease-in-out'
        });
    }
    
    // Show the win modal with celebration
    function showWinModal() {
        winModal.classList.remove('hidden');
        createConfetti();
    }
    
    // Show the hint modal when out of attempts
    function showHintModal() {
        hintModal.classList.remove('hidden');
    }
    
    // Create confetti animation
    function createConfetti() {
        const colors = ['#ff6b93', '#ffb6c1', '#ffde9e', '#a2d2ff', '#9bf6ff'];
        const confettiCount = 200;
        
        // Clear existing confetti first
        celebrationElement.innerHTML = '';
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -10 + 'px';
            confetti.style.transform = 'scale(' + (Math.random() * 0.5 + 0.5) + ')';
            
            celebrationElement.appendChild(confetti);
            
            // Animate the confetti
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;
            
            // Make this work in older browsers too
            try {
                confetti.animate([
                    { 
                        top: '-10px',
                        transform: 'rotate(0deg) scale(' + (Math.random() * 0.5 + 0.5) + ')',
                        opacity: 1
                    },
                    { 
                        top: '100vh',
                        transform: 'rotate(' + (Math.random() * 360) + 'deg) scale(' + (Math.random() * 0.5 + 0.5) + ')',
                        opacity: 0
                    }
                ], {
                    duration: duration * 1000,
                    delay: delay * 1000,
                    fill: 'forwards',
                    easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
                });
            } catch (e) {
                // Fallback for browsers that don't support animations
                confetti.style.animation = `fallAnimation ${duration}s ease-out ${delay}s forwards`;
            }
            
            // Remove confetti after animation to prevent memory leaks
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, (duration + delay) * 1000);
        }
    }
    
    // Handle browser prefixes for animations
    function prefixedEvent(element, type, callback) {
        const prefixes = ['webkit', 'moz', 'MS', 'o', ''];
        for (let p = 0; p < prefixes.length; p++) {
            if (!prefixes[p]) type = type.toLowerCase();
            element.addEventListener(prefixes[p] + type, callback, false);
        }
    }
    
    // Function to handle viewport resizing
    function handleResize() {
        // Adjust grid cells based on viewport size
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Adjust for very small screens or landscape mode
        if (viewportHeight < 600 && viewportWidth > viewportHeight) {
            // Landscape mode on small screens
            document.body.classList.add('landscape-mode');
        } else {
            document.body.classList.remove('landscape-mode');
        }
    }
    
    // Browser compatibility check and feature detection
    function checkCompatibility() {
        // Check if CSS animations are supported
        const animationSupport = typeof document.createElement('div').animate === 'function';
        
        if (!animationSupport) {
            // Add a fallback animation using CSS keyframes for older browsers
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fallAnimation {
                    from { top: -10px; opacity: 1; }
                    to { top: 100vh; opacity: 0; }
                }
                
                @-webkit-keyframes fallAnimation {
                    from { top: -10px; opacity: 1; }
                    to { top: 100vh; opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Event listeners
    startButton.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        // Focus on the game container for keyboard accessibility
        gameContainer.focus();
        
        // Tactile feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    });
    
    hintButton.addEventListener('click', () => {
        hintText.classList.remove('hidden');
        hintButton.classList.add('hidden');
        
        // Tactile feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([20, 20, 100]);
        }
    });

    hintCloseButton.addEventListener('click', () => {
        hintModal.classList.add('hidden');
        
        // Tactile feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    });
    
    winCloseButton.addEventListener('click', () => {
        winModal.classList.add('hidden');
        
        // Tactile feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    });
    
    // Check browser compatibility
    checkCompatibility();
    
    // Handle resize events for responsive layout
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial resize handling
    handleResize();
    
    // Start the game
    initGame();
});