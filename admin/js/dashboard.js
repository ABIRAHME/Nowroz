// Dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) return;
    
    // Display admin name
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = localStorage.getItem('adminUsername') || sessionStorage.getItem('adminUsername');
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
    
    // Reference to orders in Firebase
    const ordersRef = database.ref('orders');
    
    // Load dashboard data
    loadDashboardData(ordersRef);
});

/**
 * Load dashboard data from Firebase
 * @param {Object} ordersRef - Firebase reference to orders
 */
function loadDashboardData(ordersRef) {
    ordersRef.once('value')
        .then((snapshot) => {
            const orders = snapshot.val() || {};
            console.log('Dashboard orders data:', orders); // Debug log
            const ordersList = Object.entries(orders).map(([id, data]) => {
                return { id, ...data };
            });
            
            // Update stats
            updateStats(ordersList);
            
            // Load recent orders (last 5)
            loadRecentOrders(ordersList);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            const recentOrdersTable = document.getElementById('recentOrdersTable');
            if (recentOrdersTable) {
                recentOrdersTable.innerHTML = `
                    <tr>
                        <td class="px-6 py-4 text-sm text-red-500" colspan="5">Error loading orders: ${error.message}</td>
                    </tr>
                `;
            }
        });
}

/**
 * Update dashboard statistics
 * @param {Array} ordersList - List of orders
 */
function updateStats(ordersList) {
    const totalOrdersElement = document.getElementById('totalOrders');
    const pendingOrdersElement = document.getElementById('pendingOrders');
    const completedOrdersElement = document.getElementById('completedOrders');
    
    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter(order => order.status === 'pending').length;
    const completedOrders = ordersList.filter(order => order.status === 'completed').length;
    
    if (totalOrdersElement) totalOrdersElement.textContent = totalOrders;
    if (pendingOrdersElement) pendingOrdersElement.textContent = pendingOrders;
    if (completedOrdersElement) completedOrdersElement.textContent = completedOrders;
}

/**
 * Load recent orders to the dashboard
 * @param {Array} ordersList - List of orders
 */
function loadRecentOrders(ordersList) {
    const recentOrdersTable = document.getElementById('recentOrdersTable');
    if (!recentOrdersTable) return;
    
    // Sort orders by date (newest first)
    ordersList.sort((a, b) => {
        const dateA = new Date(a.orderDate || a.timestamp);
        const dateB = new Date(b.orderDate || b.timestamp);
        return dateB - dateA;
    });
    
    // Get the 5 most recent orders
    const recentOrders = ordersList.slice(0, 5);
    
    // Clear the table
    recentOrdersTable.innerHTML = '';
    
    if (recentOrders.length === 0) {
        recentOrdersTable.innerHTML = `
            <tr>
                <td class="px-6 py-4 text-sm text-gray-500" colspan="5">No orders found</td>
            </tr>
        `;
        return;
    }
    
    // Add orders to the table
    recentOrders.forEach(order => {
        const date = new Date(order.orderDate || order.timestamp);
        const formattedDate = date.toLocaleDateString();
        
        const statusClass = getStatusClass(order.status);
        
        recentOrdersTable.innerHTML += `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.id.substring(0, 8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.customer.fullName || 'Unknown'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.product.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${order.status || 'pending'}
                    </span>
                </td>
            </tr>
        `;
    });
}

/**
 * Get CSS class for order status
 * @param {string} status - Order status
 * @returns {string} CSS class
 */
function getStatusClass(status) {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'processing':
            return 'bg-blue-100 text-blue-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        case 'pending':
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
}