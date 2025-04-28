// Firebase Authentication for Nowroz Admin Panel
// This system uses localStorage instead of sessionStorage for better persistence in serverless environments

// Initialize Firebase Authentication
function initFirebaseAuth() {
    // Initialize Firebase with the config from config.js
    if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
    }
    
    // Add authentication module
    if (!firebase.auth) {
        // Load the auth script if not already loaded
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js';
        script.onload = setupAuthListeners;
        document.head.appendChild(script);
    } else {
        setupAuthListeners();
    }
}

// Set up authentication state listeners
function setupAuthListeners() {
    // Define admin users (these will be migrated to Firebase Auth)
    const adminUsers = [
        { username: 'ahmedabir', password: 'Ahmedabir2025', email: 'ahmedabir@example.com' },
        { username: 'hasibulhira', password: 'Hasibulhira2025', email: 'hasibulhira@example.com' },
        { username: 'muhammadsojib', password: 'Muhammadsojib2025', email: 'muhammadsojib@example.com' },
        { username: 'cofounder', password: 'Cofounder2025', email: 'cofounder@example.com' }
    ];
    
    // Check if we need to create admin users in Firebase
    // This would typically be done once through a secure admin setup process
    // For this implementation, we'll check if the user exists and create if not
    function createAdminUsersIfNeeded() {
        // This is a simplified version - in production, you would use Firebase Admin SDK
        // or a secure backend to create these users
        const setupComplete = localStorage.getItem('adminSetupComplete');
        
        if (!setupComplete) {
            // For demo purposes only - in production, user creation should be done securely
            console.log('Setting up admin users in Firebase Auth');
            // We'll just simulate this process for now
            localStorage.setItem('adminSetupComplete', 'true');
        }
    }
    
    // Monitor auth state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', user.displayName || user.email.split('@')[0]);
            localStorage.setItem('adminEmail', user.email);
            localStorage.setItem('adminUid', user.uid);
            
            // Update UI if needed
            updateAdminUI();
            
            // If on login page, redirect to dashboard
            redirectIfNeeded(true);
        } else {
            // User is signed out
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminUid');
            
            // If not on login page, redirect to login
            redirectIfNeeded(false);
        }
    });
    
    // Initial setup check
    createAdminUsersIfNeeded();
}

// Update UI elements with admin info
function updateAdminUI() {
    const currentUser = localStorage.getItem('adminUsername');
    
    // Set admin name if element exists
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement && currentUser) {
        adminNameElement.textContent = currentUser;
    }
    
    const mobileAdminNameElement = document.getElementById('mobileAdminName');
    if (mobileAdminNameElement && currentUser) {
        mobileAdminNameElement.textContent = currentUser;
    }
}

// Handle redirects based on auth state
function redirectIfNeeded(isLoggedIn) {
    // Get the current path
    const currentPath = window.location.pathname;
    // More robust login page detection for various deployment environments
    const isLoginPage = currentPath.endsWith('index.html') || 
                       currentPath.endsWith('/admin/') || 
                       currentPath === '/admin' || 
                       currentPath.includes('/admin') && currentPath.split('/').pop() === '';
    
    // If not logged in and not on login page, redirect to login
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = currentPath.includes('/admin/') ? 'index.html' : '/admin/index.html';
        return;
    }
    
    // If logged in and on login page, redirect to dashboard
    if (isLoggedIn && isLoginPage) {
        window.location.href = 'dashboard.html';
        return;
    }
}

// Login with email and password
function loginWithEmailPassword(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            return { success: true, user: userCredential.user };
        })
        .catch((error) => {
            // Handle errors
            return { success: false, error: error.message };
        });
}

// Login with username and password (maps to email)
function loginWithUsername(username, password) {
    // Map username to email format
    // This is a simple implementation - in production you might want a more robust solution
    const adminUsers = [
        { username: 'ahmedabir', email: 'ahmedabir@example.com' },
        { username: 'hasibulhira', email: 'hasibulhira@example.com' },
        { username: 'muhammadsojib', email: 'muhammadsojib@example.com' },
        { username: 'cofounder', email: 'cofounder@example.com' }
    ];
    
    const user = adminUsers.find(user => user.username === username);
    
    if (user) {
        return loginWithEmailPassword(user.email, password);
    } else {
        return Promise.resolve({ success: false, error: 'User not found' });
    }
}

// Logout function
function logout() {
    return firebase.auth().signOut()
        .then(() => {
            // Sign-out successful
            return { success: true };
        })
        .catch((error) => {
            // An error happened
            return { success: false, error: error.message };
        });
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// Get current user info
function getCurrentUser() {
    return {
        username: localStorage.getItem('adminUsername'),
        email: localStorage.getItem('adminEmail'),
        uid: localStorage.getItem('adminUid')
    };
}

// Initialize auth when the script loads
document.addEventListener('DOMContentLoaded', initFirebaseAuth);

// Export functions for use in other scripts
window.firebaseAuth = {
    login: loginWithUsername,
    loginWithEmail: loginWithEmailPassword,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getCurrentUser: getCurrentUser
};