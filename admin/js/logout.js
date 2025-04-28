// Common logout functionality for all admin pages

document.addEventListener('DOMContentLoaded', function() {
    // Set up logout functionality for desktop and mobile buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    function handleLogout() {
        if (window.firebaseAuth && typeof window.firebaseAuth.logout === 'function') {
            window.firebaseAuth.logout()
                .then(() => {
                    // Redirect happens automatically via auth state change
                    console.log('Logout successful');
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    // Fallback logout method if Firebase logout fails
                    localStorage.removeItem('adminLoggedIn');
                    localStorage.removeItem('adminUsername');
                    localStorage.removeItem('adminEmail');
                    localStorage.removeItem('adminUid');
                    window.location.href = 'index.html';
                });
        } else {
            // Fallback for cases where firebaseAuth is not available
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminUid');
            window.location.href = 'index.html';
        }
    }
    
    // Attach event listeners if buttons exist
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', handleLogout);
    }
});

