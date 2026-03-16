// Lockscreen JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Update time and date
    function updateTimeDate() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const dateString = now.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
        document.getElementById('time').textContent = timeString;
        document.getElementById('date').textContent = dateString;
    }
    
    // Update every second
    setInterval(updateTimeDate, 1000);
    updateTimeDate(); // Initial call
    
    // Handle passcode input
    const inputs = document.querySelectorAll('.passcode-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            // Limit to one character
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1);
            }
            
            // Move to next input if current is filled
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            
            // Move to previous input if deleted and empty
            if (e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            // Handle backspace
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
                inputs[index - 1].value = '';
            }
        });
    });
    
    // Focus first input on load
    inputs[0].focus();
    
    // Handle form submission
    const form = document.querySelector('.passcode-form');
    form.addEventListener('submit', function(e) {
        // Prevent actual form submission, we'll handle via AJAX or let it submit normally
        // For now, let it submit normally to our Flask route
    });
});