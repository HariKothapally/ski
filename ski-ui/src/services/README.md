# SKI-MS API Services Documentation

## Overview
The SKI-MS (Kitchen Management System) API services provide a centralized way to interact with the backend API. This architecture ensures consistent error handling, standardized API calls, and improved maintainability across the application.

## Directory Structure
```
services/api/
├── config.js         # API configuration and common utilities
├── apiService.js     # Base API service factory
├── services.js       # Individual service instances
└── README.md         # This documentation
```

## Core Components

### 1. Configuration (config.js)
Manages base configuration and common utilities for API interactions.

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Get the authentication token from localStorage
function getAuthToken() {
  return localStorage.getItem('token');
}

// Get the base configuration for axios
function getBaseConfig() {
  return {
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` })
    }
  };
}

// Handle API errors consistently
function handleApiError(error) {
  if (error.response) {
    // Handle different error types
    switch (error.response.status) {
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      // ... other cases
    }
  }
}
```

### 2. API Service Factory (apiService.js)
Creates standardized CRUD operations for each resource.

#### Base Methods
```javascript
// Example of how the base service methods work
const baseService = {
  // Get all items with optional query parameters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/resource', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get a single item by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/resource/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create a new item
  create: async (data) => {
    try {
      const response = await api.post('/api/resource', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Update an existing item
  update: async (id, data) => {
    try {
      const response = await api.put(`/api/resource/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete an item
  delete: async (id) => {
    try {
      await api.delete(`/api/resource/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  }
};
```

### 3. Service Instances (services.js)

Each service follows the same pattern but works with different endpoints. Here are examples of the data structures each service expects:

#### Menu Service
```javascript
// Example menu item structure
const menuItem = {
  name: 'Spaghetti Carbonara',
  description: 'Classic Italian pasta dish',
  price: 15.99,
  category: 'main',
  isAvailable: true,
  ingredients: ['pasta', 'eggs', 'cheese'],
  imageUrl: 'https://example.com/image.jpg',
  preparationTime: '20 mins',
  nutritionalInfo: 'Calories: 800'
};

// Usage example
await menuService.create(menuItem);
```

#### Order Service
```javascript
// Example order structure
const order = {
  customerName: 'John Doe',
  items: [
    {
      itemId: 'menu-item-id',
      quantity: 2,
      specialInstructions: 'Extra cheese'
    }
  ],
  status: 'pending',
  totalAmount: 31.98,
  orderType: 'dine-in',
  tableNumber: 'A1'
};

// Usage example
await orderService.create(order);
```

#### Inventory Service
```javascript
// Example inventory item structure
const inventoryItem = {
  name: 'Tomatoes',
  category: 'vegetables',
  quantity: 50,
  unit: 'kg',
  unitPrice: 2.99,
  minQuantity: 10,
  supplier: 'Fresh Farms Inc',
  notes: 'Organic Roma tomatoes'
};

// Usage example
await inventoryService.create(inventoryItem);
```

## Error Handling
All services include standardized error handling for:
- Network errors
- Authentication errors (401)
- Authorization errors (403)
- Resource not found (404)
- Validation errors (400)
- Server errors (500)

## Usage Examples

### Basic CRUD Operations
```javascript
// Import the service you need
import { menuService } from './services/api/services';

// Fetch all items
try {
  const menuItems = await menuService.getAll();
  // Handle success
} catch (error) {
  showToast(error.message, 'danger');
}

// Create a new item
try {
  const newItem = {
    name: 'New Dish',
    price: 15.99,
    category: 'main'
  };
  await menuService.create(newItem);
  showToast('Menu item created successfully', 'success');
} catch (error) {
  showToast(error.message, 'danger');
}

// Update an item
try {
  const updates = {
    price: 16.99,
    isAvailable: false
  };
  await menuService.update(itemId, updates);
  showToast('Menu item updated successfully', 'success');
} catch (error) {
  showToast(error.message, 'danger');
}

// Delete an item
try {
  await menuService.delete(itemId);
  showToast('Menu item deleted successfully', 'success');
} catch (error) {
  showToast(error.message, 'danger');
}
```

### Using with React Components
```javascript
import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/api/services';

function MenuList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        const data = await menuService.getAll();
        setItems(data);
      } catch (error) {
        showToast(error.message, 'danger');
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  // Rest of your component code...
}
```

## Best Practices
1. Always use try-catch blocks with service calls
2. Handle loading states appropriately
3. Show user-friendly error messages
4. Keep service calls in useEffect or event handlers
5. Reset forms and update UI after successful operations
6. Use the custom method for specialized endpoints

## Common Patterns
1. Fetching data on component mount
2. Handling form submissions
3. Updating lists after CRUD operations
4. Managing loading and error states
5. Handling authentication
6. Showing success/error messages
