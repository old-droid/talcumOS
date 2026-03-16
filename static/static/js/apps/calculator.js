// Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.calculator-buttons button');
    
    let currentInput = '0';
    let previousInput = null;
    let operator = null;
    let shouldResetDisplay = false;
    
    function updateDisplay() {
        // Limit display length to prevent overflow
        const displayText = currentInput.length > 11 ? 
            parseFloat(currentInput).toExponential(5) : 
            currentInput;
        display.textContent = displayText;
    }
    
    function inputDigit(digit) {
        if (shouldResetDisplay) {
            currentInput = digit;
            shouldResetDisplay = false;
        } else {
            // Prevent multiple decimal points
            if (digit === '.' && currentInput.includes('.')) return;
            // Prevent leading zeros except for 0.x
            if (currentInput === '0' && digit !== '.') {
                currentInput = digit;
            } else {
                currentInput += digit;
            }
        }
        updateDisplay();
    }
    
    function handleOperator(nextOperator) {
        const inputValue = parseFloat(currentInput);
        
        if (operator && previousInput !== null && !shouldResetDisplay) {
            const result = calculate(previousInput, inputValue, operator);
            currentInput = String(result);
            // Reset for chaining operations
            previousInput = result;
        } else {
            previousInput = inputValue;
        }
        
        operator = nextOperator;
        shouldResetDisplay = true;
        
        // Visual feedback for active operator
        document.querySelectorAll('.btn.operator').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }
    
    function calculate(firstNum, secondNum, operation) {
        switch (operation) {
            case '+':
                return firstNum + secondNum;
            case '-':
                return firstNum - secondNum;
            case '*':
                return firstNum * secondNum;
            case '/':
                return secondNum !== 0 ? firstNum / secondNum : 0;
            case '%':
                return firstNum % secondNum;
            default:
                return secondNum;
        }
    }
    
    function clearCalculator() {
        currentInput = '0';
        previousInput = null;
        operator = null;
        shouldResetDisplay = false;
        
        // Remove active state from all operator buttons
        document.querySelectorAll('.btn.operator').forEach(btn => {
            btn.classList.remove('active');
        });
        
        updateDisplay();
    }
    
    function toggleSign() {
        if (currentInput === '0') return;
        currentInput = String(parseFloat(currentInput) * -1);
        updateDisplay();
    }
    
    function calculateResult() {
        if (operator === null || shouldResetDisplay) return;
        
        const result = calculate(previousInput, parseFloat(currentInput), operator);
        currentInput = String(result);
        previousInput = null;
        operator = null;
        shouldResetDisplay = true;
        
        // Remove active state from all operator buttons
        document.querySelectorAll('.btn.operator').forEach(btn => {
            btn.classList.remove('active');
        });
        
        updateDisplay();
    }
    
    // Event listeners
    buttons.forEach(button => {
        button.addEventListener('click', function(event) {
            const value = button.textContent;
            
            if (button.classList.contains('digit')) {
                inputDigit(value);
            } else if (button.classList.contains('operator')) {
                switch (value) {
                    case 'AC':
                        clearCalculator();
                        break;
                    case '+/-':
                        toggleSign();
                        break;
                    case '%':
                        handleOperator('%');
                        break;
                    case '/':
                        handleOperator('/');
                        break;
                    case '*':
                        handleOperator('*');
                        break;
                    case '-':
                        handleOperator('-');
                        break;
                    case '+':
                        handleOperator('+');
                        break;
                    case '=':
                        calculateResult();
                        break;
                }
            }
        });
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        // Prevent scrolling with space/page up/down in calculator
        if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
            e.preventDefault();
        }
        
        if (e.key >= '0' && e.key <= '9') {
            inputDigit(e.key);
        } else if (e.key === '.') {
            inputDecimal();
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            calculateResult();
        } else if (e.key === 'Backspace') {
            // For backspace, remove last digit
            if (currentInput.length > 1) {
                currentInput = currentInput.slice(0, -1);
            } else {
                currentInput = '0';
            }
            updateDisplay();
        } else if (e.key === 'Escape') {
            clearCalculator();
        } else if (e.key === '+') {
            handleOperator('+');
        } else if (e.key === '-') {
            handleOperator('-');
        } else if (e.key === '*') {
            handleOperator('*');
        } else if (e.key === '/') {
            handleOperator('/');
        } else if (e.key === '%') {
            handleOperator('%');
        }
    });
    
    // Initial display update
    updateDisplay();
});