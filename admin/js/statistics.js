document.addEventListener('DOMContentLoaded', function() {
    // Make sure auth-fix.js has loaded and checkAuth is available
    if (typeof checkAuth !== 'function') {
        console.error('Authentication function not found');
        return;
    }
    
    // Check if user is authenticated
    if (!checkAuth()) return;
    
    // Display admin name
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = sessionStorage.getItem('adminUsername');
    }
    
    // Initialize Firebase
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
    
    // References to Firebase data
    const ordersRef = database.ref('orders');
    const inventoryRef = database.ref('inventory');
    
    // DOM Elements for stats
    const completedOrdersElement = document.getElementById('completedOrders');
    const totalSalesElement = document.getElementById('totalSales');
    const cancelledOrdersElement = document.getElementById('cancelledOrders');
    const totalStockValueElement = document.getElementById('totalStockValue');
    
    // Chart contexts
    const orderStatusChartCtx = document.getElementById('orderStatusChart').getContext('2d');
    const inventoryValueChartCtx = document.getElementById('inventoryValueChart').getContext('2d');
    const productCategoryChartCtx = document.getElementById('productCategoryChart').getContext('2d');
    const monthlySalesChartCtx = document.getElementById('monthlySalesChart').getContext('2d');
    
    // Chart instances
    let orderStatusChart;
    let inventoryValueChart;
    let productCategoryChart;
    let monthlySalesChart;
    
    // Load data and initialize charts
    Promise.all([
        fetchOrdersData(),
        fetchInventoryData()
    ])
    .then(([ordersData, inventoryData]) => {
        updateStatistics(ordersData, inventoryData);
        createCharts(ordersData, inventoryData);
    })
    .catch(error => {
        console.error('Error loading data:', error);
        showToast('Error loading data. Please try again.', 'error');
    });
    
    /**
     * Fetch orders data from Firebase
     * @returns {Promise} Promise that resolves with orders data
     */
    function fetchOrdersData() {
        return ordersRef.once('value')
            .then(snapshot => {
                const orders = snapshot.val() || {};
                return Object.entries(orders).map(([id, data]) => {
                    return { id, ...data };
                });
            });
    }
    
    /**
     * Fetch inventory data from Firebase
     * @returns {Promise} Promise that resolves with inventory data
     */
    function fetchInventoryData() {
        return inventoryRef.once('value')
            .then(snapshot => {
                const inventory = snapshot.val() || {};
                return Object.entries(inventory).map(([id, data]) => {
                    return { id, ...data };
                });
            });
    }
    
    /**
     * Update statistics based on orders and inventory data
     * @param {Array} ordersData - Array of order objects
     * @param {Array} inventoryData - Array of inventory objects
     */
    function updateStatistics(ordersData, inventoryData) {
        // Calculate completed orders count
        const completedOrders = ordersData.filter(order => order.status === 'completed').length;
        completedOrdersElement.textContent = completedOrders;
        
        // Calculate total sales amount from completed orders
        const totalSales = ordersData
            .filter(order => order.status === 'completed')
            .reduce((total, order) => {
                const orderAmount = order.totalAmount || 
                                  (order.product && order.product.price ? parseFloat(order.product.price) : 0);
                return total + orderAmount;
            }, 0);
        totalSalesElement.textContent = `${totalSales.toFixed(2)}Tk`;
        
        // Calculate cancelled orders count
        const cancelledOrders = ordersData.filter(order => order.status === 'cancelled').length;
        cancelledOrdersElement.textContent = cancelledOrders;
        
        // Calculate total stock value (sum of selling price * stock for each product)
        const totalStockValue = inventoryData.reduce((total, product) => {
            const price = parseFloat(product.sellingPrice || 0);
            const stock = parseInt(product.totalStock || 0);
            return total + (price * stock);
        }, 0);
        totalStockValueElement.textContent = `${totalStockValue.toFixed(2)}Tk`;
    }
    
    /**
     * Create charts based on orders and inventory data
     * @param {Array} ordersData - Array of order objects
     * @param {Array} inventoryData - Array of inventory objects
     */
    function createCharts(ordersData, inventoryData) {
        createOrderStatusChart(ordersData);
        createInventoryValueChart(inventoryData);
        createProductCategoryChart(inventoryData);
        createMonthlySalesChart(ordersData);
    }
    
    /**
     * Create order status distribution chart
     * @param {Array} ordersData - Array of order objects
     */
    function createOrderStatusChart(ordersData) {
        // Count orders by status
        const statusCounts = {
            'pending': 0,
            'processing': 0,
            'completed': 0,
            'cancelled': 0
        };
        
        ordersData.forEach(order => {
            const status = order.status || 'pending';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            }
        });
        
        // Create chart
        orderStatusChart = new Chart(orderStatusChartCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#FFCD56', // pending - yellow
                        '#36A2EB', // processing - blue
                        '#4BC0C0', // completed - teal
                        '#FF6384'  // cancelled - red
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    /**
     * Create inventory value by category chart
     * @param {Array} inventoryData - Array of inventory objects
     */
    function createInventoryValueChart(inventoryData) {
        // Calculate inventory value by category
        const categoryValues = {};
        
        inventoryData.forEach(product => {
            if (!product.categories || !Array.isArray(product.categories)) return;
            
            const price = parseFloat(product.sellingPrice || 0);
            const stock = parseInt(product.totalStock || 0);
            const value = price * stock;
            
            product.categories.forEach(category => {
                if (!categoryValues[category]) {
                    categoryValues[category] = 0;
                }
                categoryValues[category] += value / product.categories.length; // Distribute value across categories
            });
        });
        
        // Create chart
        inventoryValueChart = new Chart(inventoryValueChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(categoryValues),
                datasets: [{
                    label: 'Inventory Value (Tk)',
                    data: Object.values(categoryValues).map(value => value.toFixed(2)),
                    backgroundColor: '#99BC85', // sage color
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Tk ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create products by category chart
     * @param {Array} inventoryData - Array of inventory objects
     */
    function createProductCategoryChart(inventoryData) {
        // Count products by category
        const categoryCounts = {};
        
        inventoryData.forEach(product => {
            if (!product.categories || !Array.isArray(product.categories)) return;
            
            product.categories.forEach(category => {
                if (!categoryCounts[category]) {
                    categoryCounts[category] = 0;
                }
                categoryCounts[category]++;
            });
        });
        
        // Create chart
        productCategoryChart = new Chart(productCategoryChartCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    data: Object.values(categoryCounts),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCD56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    /**
     * Create monthly sales chart
     * @param {Array} ordersData - Array of order objects
     */
    function createMonthlySalesChart(ordersData) {
        // Get completed orders only
        const completedOrders = ordersData.filter(order => order.status === 'completed');
        
        // Group sales by month
        const monthlySales = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize all months with zero
        months.forEach(month => {
            monthlySales[month] = 0;
        });
        
        // Calculate sales for each month
        completedOrders.forEach(order => {
            const orderDate = new Date(order.orderDate || order.timestamp);
            const month = months[orderDate.getMonth()];
            const amount = order.totalAmount || 
                          (order.product && order.product.price ? parseFloat(order.product.price) : 0);
            
            monthlySales[month] += amount;
        });
        
        // Create chart
        monthlySalesChart = new Chart(monthlySalesChartCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Sales (Tk)',
                    data: Object.values(monthlySales).map(value => value.toFixed(2)),
                    borderColor: '#99BC85',
                    backgroundColor: 'rgba(153, 188, 133, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Tk ' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success or error)
     * @param {number} duration - Duration in milliseconds
     */
    function showToast(message, type = 'success', duration = 3000) {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'fixed bottom-4 right-4 py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-full opacity-0 z-50';
            
            const toastMessage = document.createElement('span');
            toastMessage.id = 'toastMessage';
            toast.appendChild(toastMessage);
            
            document.body.appendChild(toast);
        }
        
        // Get toast message element
        const toastMessage = document.getElementById('toastMessage');
        
        // Set toast type (success or error)
        if (type === 'error') {
            toast.classList.remove('bg-sage');
            toast.classList.add('bg-red-500');
        } else {
            toast.classList.remove('bg-red-500');
            toast.classList.add('bg-sage');
        }
        
        // Set message
        toastMessage.textContent = message;
        
        // Show toast
        toast.classList.remove('translate-y-full', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
        
        // Hide toast after duration
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-full', 'opacity-0');
        }, duration);
    }
});