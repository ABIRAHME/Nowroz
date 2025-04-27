// Admin authentication logic

// Define admin users
const adminUsers = [
    { username: 'ahmedabir', password: 'Ahmedabir2025' },
    { username: 'hasibulhira', password: 'Hasibulhira2025' },
    { username: 'muhammadsojib', password: 'Muhammadsojib2025' },
    { username: 'cofounder', password: 'Cofounder2025' }
];

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const currentUser = sessionStorage.getItem('adminUsername');
    
    // If not logged in and not on login page, redirect to login
    if (!isLoggedIn && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
        return false;
    }
    
    // If logged in and on login page, redirect to dashboard
    if (isLoggedIn && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
        return true;
    }
    
    return isLoggedIn;
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuth();
    
    // Get login form if it exists on the page
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');
            
            // Find user
            const user = adminUsers.find(user => 
                user.username === username && user.password === password
            );
            
            if (user) {
                // Set session storage
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminUsername', username);
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Show error message
                errorMessage.textContent = 'Invalid username or password';
                errorMessage.classList.remove('hidden');
            }
        });
    }
    
    // Handle logout if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear session storage
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminUsername');
            
            // Redirect to login page
            window.location.href = 'index.html';
        });
    }
});