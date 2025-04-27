// Firebase configuration and database operations

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Import Firebase configuration from config file
import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

/**
 * Save order data to Firebase Realtime Database
 * @param {Object} orderData - Combined order and customer data
 * @returns {Promise<string>} - Order ID
 */
export async function saveOrderToDatabase(orderData) {
  try {
    // Create a reference to the orders collection
    const ordersRef = ref(database, 'orders');
    
    // Generate a new order entry with a unique key
    const newOrderRef = push(ordersRef);
    
    // Add timestamp to order data
    orderData.timestamp = new Date().toISOString();
    
    // Save the data to the new reference
    await set(newOrderRef, orderData);
    
    console.log('Order saved successfully with ID:', newOrderRef.key);
    return newOrderRef.key;
  } catch (error) {
    console.error('Error saving order to database:', error);
    throw error;
  }
}