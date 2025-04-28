// Firebase Admin User Setup Script
// This script helps to create the initial admin users in Firebase Authentication
// It should be run once by an administrator to set up the accounts

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
    }
    
    const setupStatus = document.getElementById('setupStatus');
    const setupForm = document.getElementById('setupForm');
    const setupBtn = document.getElementById('setupBtn');
    
    if (setupForm) {
        setupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (setupBtn) {
                setupBtn.disabled = true;
                setupBtn.textContent = 'Setting up users...';
            }
            
            if (setupStatus) {
                setupStatus.textContent = 'Creating admin users in Firebase...';
                setupStatus.className = 'text-blue-500';
            }
            
            // Admin users to create
            const adminUsers = [
                { username: 'ahmedabir', password: 'Ahmedabir2025', email: 'ahmedabir@example.com' },
                { username: 'hasibulhira', password: 'Hasibulhira2025', email: 'hasibulhira@example.com' },
                { username: 'muhammadsojib', password: 'Muhammadsojib2025', email: 'muhammadsojib@example.com' },
                { username: 'cofounder', password: 'Cofounder2025', email: 'cofounder@example.com' }
            ];
            
            // Create users one by one
            let createdCount = 0;
            let errorCount = 0;
            
            // Process each user sequentially using promises
            adminUsers.reduce((promise, user) => {
                return promise.then(() => {
                    return createUser(user.email, user.password, user.username);
                }).then(result => {
                    if (result.success) {
                        createdCount++;
                    } else {
                        errorCount++;
                    }
                    updateStatus();
                }).catch(error => {
                    errorCount++;
                    updateStatus();
                });
            }, Promise.resolve());
            
            function updateStatus() {
                if (setupStatus) {
                    setupStatus.textContent = `Created ${createdCount} users. Errors: ${errorCount}`;
                    
                    if (createdCount + errorCount === adminUsers.length) {
                        if (errorCount === 0) {
                            setupStatus.textContent = 'All admin users created successfully!';
                            setupStatus.className = 'text-green-500';
                            localStorage.setItem('adminSetupComplete', 'true');
                        } else {
                            setupStatus.textContent = `Created ${createdCount} users with ${errorCount} errors. Some users may already exist.`;
                            setupStatus.className = 'text-yellow-500';
                        }
                        
                        if (setupBtn) {
                            setupBtn.disabled = false;
                            setupBtn.textContent = 'Setup Complete';
                        }
                    }
                }
            }
        });
    }
    
    // Function to create a user in Firebase Auth
    function createUser(email, password, displayName) {
        return firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Update the user's display name
                return userCredential.user.updateProfile({
                    displayName: displayName
                }).then(() => {
                    return { success: true, user: userCredential.user };
                });
            })
            .catch(error => {
                // If user already exists, consider it a success for our purposes
                if (error.code === 'auth/email-already-in-use') {
                    return { success: true, message: 'User already exists' };
                }
                return { success: false, error: error.message };
            });
    }
});