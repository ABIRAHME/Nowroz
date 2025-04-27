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
    
    // Reference to inventory in Firebase
    const inventoryRef = database.ref('inventory');
    
    // DOM Elements
    const inventoryForm = document.getElementById('inventoryForm');
    const formTitle = document.getElementById('formTitle');
    const productIdInput = document.getElementById('productId');
    const resetBtn = document.getElementById('resetBtn');
    
    // Initialize DataTable
    const table = $('#inventoryTable').DataTable({
        responsive: true,
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'categories' },
            { data: 'sizes' },
            { data: 'colors' },
            { data: 'cost' },
            { data: 'price' },
            { data: 'stock' },
            { 
                data: null,
                defaultContent: '<button class="edit-btn bg-blue-500 text-white px-2 py-1 rounded mr-1 text-xs">Edit</button>' +
                               '<button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>',
                orderable: false
            }
        ],
        columnDefs: [
            { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500', targets: '_all' }
        ]
    });
    
    // Load inventory data
    loadInventoryData();
    
    // Form submission handler
    inventoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });
    
    // Reset button handler
    resetBtn.addEventListener('click', function() {
        resetForm();
    });
    
    // Edit and Delete button handlers
    $('#inventoryTable tbody').on('click', '.edit-btn', function() {
        const data = table.row($(this).parents('tr')).data();
        editProduct(data);
    });
    
    $('#inventoryTable tbody').on('click', '.delete-btn', function() {
        const data = table.row($(this).parents('tr')).data();
        if (confirm(`Are you sure you want to delete ${data.name}?`)) {
            deleteProduct(data.id);
        }
    });
    
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
    
    /**
     * Load inventory data from Firebase
     */
    function loadInventoryData() {
        inventoryRef.on('value', (snapshot) => {
            const inventory = snapshot.val() || {};
            
            // Clear existing table data
            table.clear();
            
            // Add data to table
            Object.entries(inventory).forEach(([id, product]) => {
                table.row.add({
                    id: id,
                    name: product.name,
                    categories: Array.isArray(product.categories) ? product.categories.join(', ') : product.categories,
                    sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes,
                    colors: Array.isArray(product.colors) ? product.colors.join(', ') : product.colors,
                    cost: `${parseFloat(product.costPerUnit).toFixed(2)}`,
                    price: `${parseFloat(product.sellingPrice).toFixed(2)}`,
                    stock: product.totalStock,
                    raw: product // Store raw data for editing
                });
            });
            
            // Draw the table
            table.draw();
        });
    }
    
    /**
     * Save product to Firebase
     */
    function saveProduct() {
        // Get form values
        const productId = productIdInput.value;
        const productName = document.getElementById('productName').value;
        const costPerUnit = parseFloat(document.getElementById('costPerUnit').value);
        const sellingPrice = parseFloat(document.getElementById('sellingPrice').value);
        const totalStock = parseInt(document.getElementById('totalStock').value);
        
        // Get selected categories
        const categories = [];
        document.querySelectorAll('input[name="category"]:checked').forEach(checkbox => {
            categories.push(checkbox.value);
        });
        
        // Get selected sizes
        const sizes = [];
        document.querySelectorAll('input[name="size"]:checked').forEach(checkbox => {
            sizes.push(checkbox.value);
        });
        
        // Get selected colors
        const colors = [];
        document.querySelectorAll('input[name="color"]:checked').forEach(checkbox => {
            colors.push(checkbox.value);
        });
        
        // Create product object
        const product = {
            name: productName,
            categories: categories,
            sizes: sizes,
            colors: colors,
            costPerUnit: costPerUnit,
            sellingPrice: sellingPrice,
            totalStock: totalStock,
            lastUpdated: new Date().toISOString()
        };
        
        // Save to Firebase
        if (productId) {
            // Update existing product
            inventoryRef.child(productId).update(product)
                .then(() => {
                    showToast('Product updated successfully!');
                    resetForm();
                })
                .catch(error => {
                    console.error('Error updating product:', error);
                    showToast('Error updating product. Please try again.', 'error');
                });
        } else {
            // Add new product
            const newProductRef = inventoryRef.push();
            newProductRef.set(product)
                .then(() => {
                    showToast('Product added successfully!');
                    resetForm();
                })
                .catch(error => {
                    console.error('Error adding product:', error);
                    showToast('Error adding product. Please try again.', 'error');
                });
        }
    }
    
    /**
     * Edit product
     * @param {Object} product - Product data
     */
    function editProduct(product) {
        // Set form title
        formTitle.textContent = 'Edit Product';
        
        // Set form values
        productIdInput.value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('costPerUnit').value = parseFloat(product.raw.costPerUnit);
        document.getElementById('sellingPrice').value = parseFloat(product.raw.sellingPrice);
        document.getElementById('totalStock').value = parseInt(product.raw.totalStock);
        
        // Set categories
        document.querySelectorAll('input[name="category"]').forEach(checkbox => {
            checkbox.checked = product.raw.categories && product.raw.categories.includes(checkbox.value);
        });
        
        // Set sizes
        document.querySelectorAll('input[name="size"]').forEach(checkbox => {
            checkbox.checked = product.raw.sizes && product.raw.sizes.includes(checkbox.value);
        });
        
        // Set colors
        document.querySelectorAll('input[name="color"]').forEach(checkbox => {
            checkbox.checked = product.raw.colors && product.raw.colors.includes(checkbox.value);
        });
        
        // Scroll to form
        inventoryForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Delete product
     * @param {string} productId - Product ID
     */
    function deleteProduct(productId) {
        inventoryRef.child(productId).remove()
            .then(() => {
                showToast('Product deleted successfully!');
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                showToast('Error deleting product. Please try again.', 'error');
            });
    }
    
    /**
     * Reset form
     */
    function resetForm() {
        formTitle.textContent = 'Add New Product';
        productIdInput.value = '';
        inventoryForm.reset();
    }
});

// The checkAuth function is imported from auth-fix.js