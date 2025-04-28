// Orders page functionality

// Global variable for current selected order ID
let currentOrderId = null;
let database;
let ordersRef;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAuth()) return;
    
    // Display admin name
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = localStorage.getItem('adminUsername') || sessionStorage.getItem('adminUsername');
    }
    
    // Initialize Firebase (only if not already initialized)
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
    ordersRef = database.ref('orders');
    
    // DOM elements
    const ordersTable = document.getElementById('ordersTable');
    const statusFilter = document.getElementById('statusFilter');
    const orderModal = document.getElementById('orderModal');
    const closeModal = document.getElementById('closeModal');
    const orderDetails = document.getElementById('orderDetails');
    const statusUpdate = document.getElementById('statusUpdate');
    const updateStatus = document.getElementById('updateStatus');
    const downloadLabelsBtn = document.getElementById('downloadLabelsBtn');
    
    // Load all orders initially
    loadOrders(ordersRef, 'all');
    
    // Filter orders by status
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadOrders(ordersRef, this.value);
        });
    }
    
    // Download processing order labels
    if (downloadLabelsBtn) {
        downloadLabelsBtn.addEventListener('click', function() {
            generateProcessingOrderLabels();
        });
    }
    
    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            orderModal.classList.add('hidden');
        });
    }
    
    // Update order status
    if (updateStatus) {
        // Remove any existing event listeners to prevent duplicates
        updateStatus.removeEventListener('click', updateOrderStatus);
        
        // Add event listener with named function for better debugging
        updateStatus.addEventListener('click', updateOrderStatus);
        
        function updateOrderStatus() {
            if (!currentOrderId) {
                console.error('No order ID selected');
                showToast('Error: No order selected');
                return;
            }
            
            const newStatus = statusUpdate.value;
            console.log('Updating order status:', currentOrderId, newStatus);
            
            // Update order status in Firebase
            // Make sure we're using the correct path to update the status
            const orderRef = database.ref('orders/' + currentOrderId);
            
            // First check if the order exists
            orderRef.once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        throw new Error('Order not found in database');
                    }
                    
                    // Update the status field
                    return orderRef.update({ status: newStatus });
                })
                .then(() => {
                    console.log('Status updated successfully in Firebase');
                    // Reload orders
                    loadOrders(ordersRef, statusFilter.value);
                    
                    // Close modal
                    orderModal.classList.add('hidden');
                    
                    // Show success message with toast
                    showToast('Order status updated successfully');
                })
                .catch(error => {
                    console.error('Error updating order status:', error);
                    showToast('Error updating order status: ' + error.message);
                });
        }
    }
});

/**
 * Load orders from Firebase
 * @param {Object} ordersRef - Firebase reference to orders
 * @param {string} statusFilter - Status to filter by
 */
function loadOrders(ordersRef, statusFilter) {
    const ordersTable = document.getElementById('ordersTable');
    if (!ordersTable) return;
    
    // Clear the table
    ordersTable.innerHTML = '<tr><td class="px-6 py-4 text-sm text-gray-500" colspan="7">Loading orders...</td></tr>';
    
    ordersRef.once('value')
        .then((snapshot) => {
            const orders = snapshot.val() || {};
            console.log('Orders data:', orders); // Debug log
            let ordersList = Object.entries(orders).map(([id, data]) => {
                return { id, ...data };
            });
            
            // Filter by status if not 'all'
            if (statusFilter !== 'all') {
                ordersList = ordersList.filter(order => order.status === statusFilter);
            }
            
            // Sort orders by date (newest first)
            ordersList.sort((a, b) => {
                const dateA = new Date(a.orderDate || a.timestamp);
                const dateB = new Date(b.orderDate || b.timestamp);
                return dateB - dateA;
            });
            
            // Clear the table
            ordersTable.innerHTML = '';
            
            if (ordersList.length === 0) {
                ordersTable.innerHTML = `
                    <tr>
                        <td class="px-6 py-4 text-sm text-gray-500" colspan="7">No orders found</td>
                    </tr>
                `;
                return;
            }
            
            // Add orders to the table
            ordersList.forEach(order => {
                const date = new Date(order.orderDate || order.timestamp);
                const formattedDate = date.toLocaleDateString();
                
                const statusClass = getStatusClass(order.status);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.id.substring(0, 8)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.customer.fullName || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.product.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳${order.product.price}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${order.status || 'pending'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-sage hover:text-green-700 view-order" data-id="${order.id}">View Details</button>
                    </td>
                `;
                
                ordersTable.appendChild(row);
                
                // Add event listener to view order button
                const viewButton = row.querySelector('.view-order');
                viewButton.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    currentOrderId = orderId; // Set the current order ID
                    showOrderDetails(order);
                });
            });
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersTable.innerHTML = `
                <tr>
                    <td class="px-6 py-4 text-sm text-red-500" colspan="7">Error loading orders: ${error.message}</td>
                </tr>
            `;
        });
}

/**
 * Show order details in modal
 * @param {Object} order - Order data
 */
function showOrderDetails(order) {
    const orderModal = document.getElementById('orderModal');
    const orderDetails = document.getElementById('orderDetails');
    const statusUpdate = document.getElementById('statusUpdate');
    
    if (!orderModal || !orderDetails) return;
    
    // Set current order ID
    currentOrderId = order.id;
    console.log('Setting currentOrderId:', currentOrderId, 'Full order:', order); // Enhanced debug log
    
    // Set current status in dropdown
    if (statusUpdate) {
        statusUpdate.value = order.status || 'pending';
    }
    
    // Format date
    const date = new Date(order.orderDate || order.timestamp);
    const formattedDate = date.toLocaleString();
    
    // Build order details HTML
    let detailsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 class="text-lg font-medium text-gray-800 mb-4">Customer Information</h4>
                <p><span class="font-medium">Name:</span> ${order.customer.fullName || 'Unknown'}</p>
                <p><span class="font-medium">Email:</span> ${order.customer.email || 'Not provided'}</p>
                <p><span class="font-medium">Phone:</span> ${order.customer.phone || 'Not provided'}</p>
                <p><span class="font-medium">Address:</span> ${order.customer.address || 'Not provided'}</p>
                <p><span class="font-medium">Payment Method:</span> ${order.customer.paymentMethod || 'Cash on Delivery'}</p>
            </div>
            <div>
                <h4 class="text-lg font-medium text-gray-800 mb-4">Order Information</h4>
                <p><span class="font-medium">Order ID:</span> ${order.id}</p>
                <p><span class="font-medium">Date:</span> ${formattedDate}</p>
                <p><span class="font-medium">Status:</span> 
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}">
                        ${order.status || 'pending'}
                    </span>
                </p>
                <p class="mt-2"><span class="font-medium">Total Price:</span> <span class="text-lg font-medium text-sage">৳${order.product.totalPrice || (order.product.price * order.product.quantity).toFixed(2)}</span></p>
            </div>
        </div>
        <div class="mt-6">
            <h4 class="text-lg font-medium text-gray-800 mb-4">Product Information</h4>
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex flex-col sm:flex-row items-start sm:items-center">
                    <div class="flex-shrink-0 h-20 w-20 bg-gray-200 rounded-md overflow-hidden">
                        <img src="${order.product.image || '../img/product-placeholder.jpg'}" alt="${order.product.name}" class="h-full w-full object-cover">
                    </div>
                    <div class="mt-4 sm:mt-0 sm:ml-4">
                        <h5 class="text-lg font-medium text-gray-800">${order.product.name}</h5>
                        <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                            <p class="text-sm text-gray-500">Size: ${order.product.size || 'Not specified'}</p>
                            <p class="text-sm text-gray-500">Color: ${order.product.color || 'Not specified'}</p>
                            <p class="text-sm text-gray-500">Quantity: ${order.product.quantity || 1}</p>
                            <p class="text-sm text-gray-500">Unit Price: ৳${order.product.price}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Set order details
    orderDetails.innerHTML = detailsHTML;
    
    // Show modal
    orderModal.classList.remove('hidden');
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

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
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

/**
 * Generate and download shipping labels for orders with 'processing' status
 */
function generateProcessingOrderLabels() {
    // Show loading toast
    showToast('Generating labels, please wait...', 2000);
    
    // Get all processing orders
    ordersRef.orderByChild('status').equalTo('processing').once('value')
        .then((snapshot) => {
            const orders = snapshot.val() || {};
            const processingOrders = Object.entries(orders).map(([id, data]) => {
                return { id, ...data };
            });
            
            if (processingOrders.length === 0) {
                showToast('No processing orders found');
                return;
            }
            
            // Create a canvas element for each label
            const zip = new JSZip();
            const labelPromises = [];
            
            processingOrders.forEach((order, index) => {
                labelPromises.push(createOrderLabel(order).then(blob => {
                    zip.file(`order_${order.id.substring(0, 8)}.png`, blob);
                }));
            });
            
            // When all labels are created, generate the zip file
            Promise.all(labelPromises)
                .then(() => {
                    return zip.generateAsync({ type: 'blob' });
                })
                .then(content => {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = 'processing_order_labels.zip';
                    link.click();
                    
                    // Show success message
                    showToast(`${processingOrders.length} label(s) downloaded successfully`);
                })
                .catch(error => {
                    console.error('Error generating labels:', error);
                    showToast('Error generating labels: ' + error.message);
                });
        })
        .catch(error => {
            console.error('Error fetching processing orders:', error);
            showToast('Error fetching orders: ' + error.message);
        });
}

/**
 * Create a shipping label for an order
 * @param {Object} order - Order data
 * @returns {Promise<Blob>} - Label image as blob
 */
function createOrderLabel(order) {
    return new Promise((resolve, reject) => {
        try {
            // Create canvas (4" x 6" at 96 DPI = 384 x 576 pixels)
            const canvas = document.createElement('canvas');
            canvas.width = 384;
            canvas.height = 576;
            const ctx = canvas.getContext('2d');
            
            // Fill background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            
            
            // Add shipping label title
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Poppins, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SHIPPING LABEL', canvas.width / 2, 90);
            
            // Add order information
            ctx.font = '12px Poppins, sans-serif';
            ctx.textAlign = 'left';
            const orderDate = new Date(order.orderDate || order.timestamp).toLocaleDateString();
            ctx.fillText(`Order ID: ${order.id.substring(0, 12)}...`, 20, 120);
            ctx.fillText(`Date: ${orderDate}`, 20, 140);
            
            // Add payment method and total price
            const totalPrice = order.product.totalPrice || (order.product.price * order.product.quantity).toFixed(2);
            ctx.fillText(`Payment Method: ${order.customer.paymentMethod || 'Cash on Delivery'}`, 20, 160);
            ctx.fillText(`Total Price: ৳${totalPrice}`, 20, 180);
            
            // Add product information
            ctx.font = 'bold 14px Poppins, sans-serif';
            ctx.fillText('Product:', 20, 210);
            ctx.font = '14px Poppins, sans-serif';
            ctx.fillText(order.product.name, 90, 210);
            
            if (order.product.size) {
                ctx.fillText(`Size: ${order.product.size}`, 20, 230);
            }
            
            if (order.product.color) {
                ctx.fillText(`Color: ${order.product.color}`, 20, 250);
            }
            
            ctx.fillText(`Quantity: ${order.product.quantity || 1}`, 20, 270);
            
            // Add customer information
            ctx.font = 'bold 14px Poppins, sans-serif';
            ctx.fillText('Ship To:', 20, 300);
            ctx.font = '14px Poppins, sans-serif';
            ctx.fillText(order.customer.fullName || 'Customer', 20, 320);
            ctx.fillText(order.customer.phone || 'No Phone', 20, 340);
            
            // Format address to fit on label
            const address = order.customer.address || 'No Address';
            const addressLines = formatAddress(address, 40); // 40 chars per line max
            addressLines.forEach((line, index) => {
                ctx.fillText(line, 20, 360 + (index * 20));
            });
            
            
            // Convert canvas to blob
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/png');
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Format address to fit on label
 * @param {string} address - Full address
 * @param {number} maxChars - Maximum characters per line
 * @returns {Array} - Array of address lines
 */
function formatAddress(address, maxChars) {
    const words = address.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        if ((currentLine + ' ' + word).length <= maxChars) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines;
}