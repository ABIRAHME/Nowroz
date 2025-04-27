// Contact messages page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) return;
    
    // Display admin name
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = sessionStorage.getItem('adminUsername');
    }
    
    // Initialize Firebase (only if not already initialized)
    let database;
    try {
        // Check if Firebase is already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(window.firebaseConfig);
        }
        database = firebase.database();
    } catch (e) {
        console.error('Firebase initialization error:', e);
        return;
    }
    
    // Reference to contact messages in Firebase
    const contactRef = database.ref('contact');
    
    // DOM elements
    const contactTable = document.getElementById('contactTable');
    const searchInput = document.getElementById('searchInput');
    const messageModal = document.getElementById('messageModal');
    const closeModal = document.getElementById('closeModal');
    const messageDetails = document.getElementById('messageDetails');
    
    // Load all contact messages initially
    loadContactMessages(contactRef);
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterMessages(searchTerm);
        });
    }
    
    // Close modal when clicking the close button
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            messageModal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside the modal content
    if (messageModal) {
        messageModal.addEventListener('click', function(e) {
            if (e.target === messageModal) {
                messageModal.classList.add('hidden');
            }
        });
    }
});

/**
 * Load contact messages from Firebase
 * @param {Object} contactRef - Firebase reference to contact messages
 */
function loadContactMessages(contactRef) {
    const contactTable = document.getElementById('contactTable');
    
    contactRef.once('value')
        .then((snapshot) => {
            const messages = snapshot.val() || {};
            console.log('Contact messages data:', messages); // Debug log
            
            // Clear the table
            contactTable.innerHTML = '';
            
            // Check if there are any messages
            if (Object.keys(messages).length === 0) {
                contactTable.innerHTML = `
                    <tr>
                        <td class="px-6 py-4 text-sm text-gray-500" colspan="5">No contact messages found</td>
                    </tr>
                `;
                return;
            }
            
            // Convert object to array and sort by timestamp (newest first)
            const messagesList = Object.entries(messages).map(([id, data]) => {
                return { id, ...data };
            }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            // Store messages in a global variable for filtering
            window.allMessages = messagesList;
            
            // Render messages
            renderMessages(messagesList);
        })
        .catch((error) => {
            console.error('Error loading contact messages:', error);
            contactTable.innerHTML = `
                <tr>
                    <td class="px-6 py-4 text-sm text-red-500" colspan="5">Error loading messages: ${error.message}</td>
                </tr>
            `;
        });
}

/**
 * Render messages to the table
 * @param {Array} messagesList - Array of contact messages
 */
function renderMessages(messagesList) {
    const contactTable = document.getElementById('contactTable');
    contactTable.innerHTML = '';
    
    messagesList.forEach(message => {
        const fullName = `${message.firstName || ''} ${message.lastName || ''}`.trim();
        const date = message.timestamp ? new Date(message.timestamp) : new Date();
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${fullName || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${message.email || 'N/A'}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${message.subject || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${formattedDate}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-sage hover:text-opacity-70 view-message" data-id="${message.id}">View Details</button>
            </td>
        `;
        
        contactTable.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-message').forEach(button => {
        button.addEventListener('click', function() {
            const messageId = this.getAttribute('data-id');
            showMessageDetails(messageId);
        });
    });
}

/**
 * Filter messages based on search term
 * @param {string} searchTerm - Search term
 */
function filterMessages(searchTerm) {
    if (!window.allMessages) return;
    
    if (!searchTerm) {
        renderMessages(window.allMessages);
        return;
    }
    
    const filtered = window.allMessages.filter(message => {
        const fullName = `${message.firstName || ''} ${message.lastName || ''}`.trim().toLowerCase();
        const email = (message.email || '').toLowerCase();
        const subject = (message.subject || '').toLowerCase();
        const messageText = (message.message || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               subject.includes(searchTerm) || 
               messageText.includes(searchTerm);
    });
    
    renderMessages(filtered);
}

/**
 * Show message details in modal
 * @param {string} messageId - Message ID
 */
function showMessageDetails(messageId) {
    if (!window.allMessages) return;
    
    const message = window.allMessages.find(msg => msg.id === messageId);
    if (!message) return;
    
    const messageModal = document.getElementById('messageModal');
    const messageDetails = document.getElementById('messageDetails');
    
    const fullName = `${message.firstName || ''} ${message.lastName || ''}`.trim();
    const date = message.timestamp ? new Date(message.timestamp) : new Date();
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    messageDetails.innerHTML = `
        <div class="space-y-4">
            <div>
                <h4 class="text-sm font-medium text-gray-500">From</h4>
                <p class="mt-1 text-sm text-gray-900">${fullName || 'N/A'}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Email</h4>
                <p class="mt-1 text-sm text-gray-900">${message.email || 'N/A'}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Subject</h4>
                <p class="mt-1 text-sm text-gray-900">${message.subject || 'N/A'}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Date</h4>
                <p class="mt-1 text-sm text-gray-900">${formattedDate}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Message</h4>
                <div class="mt-1 p-4 bg-gray-50 rounded-md">
                    <p class="text-sm text-gray-900 whitespace-pre-wrap">${message.message || 'N/A'}</p>
                </div>
            </div>
        </div>
    `;
    
    messageModal.classList.remove('hidden');
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Show toast
        toast.classList.remove('translate-y-full', 'opacity-0');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
        }, 3000);
    }
}