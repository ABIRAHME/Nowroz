

// Import Firebase configuration
import { firebaseConfig } from './config.js';

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        setTimeout(() => {
            mobileMenu.classList.remove('opacity-0');
            mobileMenu.classList.remove('translate-y-[-10px]');
        }, 10);
    } else {
        mobileMenu.classList.add('opacity-0');
        mobileMenu.classList.add('translate-y-[-10px]');
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);
    }
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
        
        // Reference to the database
        const database = firebase.database();
        
        // Form validation function
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
        
        // Handle form submission
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Validate form fields
            if (!firstName || !lastName || !email || !subject || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Validate email format
            if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Show loading indicator
            document.getElementById('loading-indicator').style.display = 'block';
            
            // Disable submit button to prevent multiple submissions
            const submitButton = document.querySelector('#contactForm button[type="submit"]');
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            
            // Create a new contact entry with timestamp
            const newContactRef = database.ref('contact').push();
            
            // Set the data
            newContactRef.set({
                firstName: firstName,
                lastName: lastName,
                email: email,
                subject: subject,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            })
            .then(() => {
                // Hide loading indicator
                document.getElementById('loading-indicator').style.display = 'none';
                
                // Show success message
                document.getElementById('success-message').style.display = 'block';
                
                // Reset form
                document.getElementById('contactForm').reset();
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    document.getElementById('success-message').style.display = 'none';
                }, 5000);
            })
            .catch((error) => {
                // Hide loading indicator
                document.getElementById('loading-indicator').style.display = 'none';
                
                console.error('Error saving contact data:', error);
                alert('There was an error sending your message. Please try again.');
            });
        });
    