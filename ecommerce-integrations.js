// E-commerce Platform Integration Scripts
// These scripts show how to connect SmartCommerce AI with popular platforms

// ====================
// 1. SHOPIFY INTEGRATION
// ====================

class ShopifyIntegration {
  constructor(shopDomain, apiKey, password) {
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
    this.headers = {
      'X-Shopify-Access-Token': password,
      'Content-Type': 'application/json'
    };
  }

  // Fetch all products
  async getProducts() {
    try {
      const response = await fetch(`${this.baseURL}/products.json`, {
        headers: this.headers
      });
      const data = await response.json();
      return data.products.map(product => ({
        id: product.id,
        name: product.title,
        price: product.variants[0].price,
        inventory: product.variants[0].inventory_quantity,
        sku: product.variants[0].sku
      }));
    } catch (error) {
      console.error('Shopify API Error:', error);
      return [];
    }
  }

  // Update product price
  async updatePrice(productId, variantId, newPrice) {
    const body = {
      variant: {
        id: variantId,
        price: newPrice.toString()
      }
    };

    try {
      const response = await fetch(`${this.baseURL}/variants/${variantId}.json`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      console.error('Price update error:', error);
    }
  }

  // Get orders for sales data
  async getOrders(sinceDate) {
    try {
      const response = await fetch(`${this.baseURL}/orders.json?created_at_min=${sinceDate}`, {
        headers: this.headers
      });
      const data = await response.json();
      
      // Transform to our format
      const salesData = [];
      data.orders.forEach(order => {
        order.line_items.forEach(item => {
          salesData.push({
            date: order.created_at.split('T')[0],
            productId: item.product_id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            revenue: item.quantity * item.price
          });
        });
      });
      
      return salesData;
    } catch (error) {
      console.error('Orders fetch error:', error);
      return [];
    }
  }
}

// ====================
// 2. WOOCOMMERCE INTEGRATION
// ====================

class WooCommerceIntegration {
  constructor(siteURL, consumerKey, consumerSecret) {
    this.baseURL = `${siteURL}/wp-json/wc/v3`;
    this.auth = btoa(`${consumerKey}:${consumerSecret}`);
    this.headers = {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/json'
    };
  }

  // Fetch products
  async getProducts() {
    try {
      const response = await fetch(`${this.baseURL}/products?per_page=100`, {
        headers: this.headers
      });
      const products = await response.json();
      
      return products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        inventory: product.stock_quantity,
        sku: product.sku
      }));
    } catch (error) {
      console.error('WooCommerce API Error:', error);
      return [];
    }
  }

  // Update product price
  async updatePrice(productId, newPrice) {
    const body = {
      regular_price: newPrice.toString()
    };

    try {
      const response = await fetch(`${this.baseURL}/products/${productId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      console.error('Price update error:', error);
    }
  }

  // Get orders
  async getOrders(after) {
    try {
      const response = await fetch(`${this.baseURL}/orders?after=${after}&per_page=100`, {
        headers: this.headers
      });
      const orders = await response.json();
      
      const salesData = [];
      orders.forEach(order => {
        order.line_items.forEach(item => {
          salesData.push({
            date: order.date_created.split('T')[0],
            productId: item.product_id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            revenue: item.total
          });
        });
      });
      
      return salesData;
    } catch (error) {
      console.error('Orders fetch error:', error);
      return [];
    }
  }

  // Create support ticket from WooCommerce
  async createSupportTicket(customerEmail, subject, message) {
    // WooCommerce doesn't have built-in tickets, so we'll create a note
    const body = {
      note: `Support Ticket - ${subject}\n\nFrom: ${customerEmail}\n\nMessage: ${message}`
    };

    try {
      const response = await fetch(`${this.baseURL}/orders/notes`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      console.error('Support ticket error:', error);
    }
  }
}

// ====================
// 3. AMAZON SP-API INTEGRATION
// ====================

class AmazonIntegration {
  constructor(refreshToken, clientId, clientSecret, region = 'us-east-1') {
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.region = region;
    this.accessToken = null;
  }

  // Get access token
  async authenticate() {
    const tokenURL = 'https://api.amazon.com/auth/o2/token';
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    try {
      const response = await fetch(tokenURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });
      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Amazon auth error:', error);
    }
  }

  // Get inventory
  async getInventory() {
    if (!this.accessToken) await this.authenticate();
    
    const url = `https://sellingpartnerapi-${this.region}.amazon.com/fba/inventory/v1/summaries`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'x-amz-access-token': this.accessToken,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      return data.inventorySummaries.map(item => ({
        sku: item.sellerSku,
        asin: item.asin,
        totalQuantity: item.totalQuantity,
        inboundQuantity: item.inboundQuantity
      }));
    } catch (error) {
      console.error('Inventory fetch error:', error);
      return [];
    }
  }

  // Get pricing data
  async getPricing(asin) {
    if (!this.accessToken) await this.authenticate();
    
    const url = `https://sellingpartnerapi-${this.region}.amazon.com/products/pricing/v0/price/${asin}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'x-amz-access-token': this.accessToken,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Pricing fetch error:', error);
    }
  }
}

// ====================
// 4. UNIVERSAL ADAPTER
// ====================

class UniversalEcommerceAdapter {
  constructor(platform, credentials) {
    this.platform = platform;
    
    switch(platform) {
      case 'shopify':
        this.integration = new ShopifyIntegration(
          credentials.shopDomain,
          credentials.apiKey,
          credentials.password
        );
        break;
      case 'woocommerce':
        this.integration = new WooCommerceIntegration(
          credentials.siteURL,
          credentials.consumerKey,
          credentials.consumerSecret
        );
        break;
      case 'amazon':
        this.integration = new AmazonIntegration(
          credentials.refreshToken,
          credentials.clientId,
          credentials.clientSecret
        );
        break;
      default:
        throw new Error('Unsupported platform');
    }
  }

  // Sync data with SmartCommerce AI
  async syncData() {
    console.log(`Syncing data from ${this.platform}...`);
    
    try {
      // Get products
      const products = await this.integration.getProducts();
      console.log(`Fetched ${products.length} products`);
      
      // Get recent orders (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const orders = await this.integration.getOrders(thirtyDaysAgo.toISOString());
      console.log(`Fetched ${orders.length} orders`);
      
      // Store in local storage or send to backend
      const syncData = {
        platform: this.platform,
        syncDate: new Date().toISOString(),
        products: products,
        orders: orders
      };
      
      // Save to local storage
      localStorage.setItem('smartcommerce_sync_data', JSON.stringify(syncData));
      
      return syncData;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  // Apply price changes
  async applyPriceChange(productId, newPrice) {
    console.log(`Updating price for product ${productId} to ${newPrice}`);
    
    try {
      if (this.platform === 'shopify') {
        // Shopify needs variant ID, for demo using product ID
        return await this.integration.updatePrice(productId, productId, newPrice);
      } else if (this.platform === 'woocommerce') {
        return await this.integration.updatePrice(productId, newPrice);
      } else if (this.platform === 'amazon') {
        console.log('Amazon price updates require additional seller account setup');
        return { message: 'Amazon integration requires seller central setup' };
      }
    } catch (error) {
      console.error('Price update error:', error);
      throw error;
    }
  }
}

// ====================
// 5. WEBHOOK HANDLERS
// ====================

class WebhookHandler {
  constructor() {
    this.handlers = {
      'order.created': this.handleNewOrder.bind(this),
      'product.updated': this.handleProductUpdate.bind(this),
      'inventory.low': this.handleLowInventory.bind(this)
    };
  }

  // Process incoming webhook
  async processWebhook(platform, event, data) {
    console.log(`Processing ${event} webhook from ${platform}`);
    
    const handler = this.handlers[event];
    if (handler) {
      return await handler(data);
    } else {
      console.log(`No handler for event: ${event}`);
    }
  }

  // Handle new order
  async handleNewOrder(orderData) {
    // Update sales data
    const salesEntry = {
      date: new Date().toISOString().split('T')[0],
      productId: orderData.productId,
      quantity: orderData.quantity,
      price: orderData.price,
      revenue: orderData.quantity * orderData.price
    };
    
    // Store in local data
    const currentData = JSON.parse(localStorage.getItem('smartcommerce_sales') || '[]');
    currentData.push(salesEntry);
    localStorage.setItem('smartcommerce_sales', JSON.stringify(currentData));
    
    // Trigger inventory check
    this.checkInventoryLevels(orderData.productId);
  }

  // Handle product update
  async handleProductUpdate(productData) {
    console.log('Product updated:', productData);
    // Trigger price analysis
    if (window.pricingEngine) {
      const suggestion = window.pricingEngine.suggestPrice(productData.id);
      console.log('New price suggestion:', suggestion);
    }
  }

  // Handle low inventory
  async handleLowInventory(inventoryData) {
    console.log('Low inventory alert:', inventoryData);
    // Create notification
    const alert = {
      type: 'inventory',
      priority: 'high',
      message: `Low stock alert: ${inventoryData.productName} has only ${inventoryData.quantity} units left`,
      timestamp: new Date().toISOString()
    };
    
    // Store alert
    const alerts = JSON.parse(localStorage.getItem('smartcommerce_alerts') || '[]');
    alerts.push(alert);
    localStorage.setItem('smartcommerce_alerts', JSON.stringify(alerts));
  }

  // Check inventory levels
  checkInventoryLevels(productId) {
    if (window.inventoryPredictor) {
      const prediction = window.inventoryPredictor.predictReorder(productId);
      if (prediction.urgent) {
        this.handleLowInventory({
          productId: productId,
          productName: prediction.productName,
          quantity: prediction.currentStock
        });
      }
    }
  }
}

// ====================
// 6. API ENDPOINT SETUP
// ====================

// Example Express.js server setup (for reference)
const apiEndpoints = `
// This is example code for setting up your own API server
// You would run this on a Node.js server, not in the browser

const express = require('express');
const app = express();

// Webhook endpoint for Shopify
app.post('/webhooks/shopify', (req, res) => {
  const webhook = new WebhookHandler();
  webhook.processWebhook('shopify', req.headers['x-shopify-topic'], req.body);
  res.status(200).send('OK');
});

// Webhook endpoint for WooCommerce
app.post('/webhooks/woocommerce', (req, res) => {
  const webhook = new WebhookHandler();
  webhook.processWebhook('woocommerce', req.body.event, req.body.data);
  res.status(200).send('OK');
});

// API endpoint to get predictions
app.get('/api/predictions/:type', (req, res) => {
  const type = req.params.type;
  
  switch(type) {
    case 'pricing':
      // Return pricing suggestions
      break;
    case 'inventory':
      // Return inventory predictions
      break;
    case 'support':
      // Return support metrics
      break;
  }
});

app.listen(3000, () => {
  console.log('SmartCommerce API running on port 3000');
});
`;

// ====================
// 7. INTEGRATION SETUP GUIDE
// ====================

const integrationGuide = {
  shopify: {
    steps: [
      "1. Go to Shopify Admin > Apps > Manage private apps",
      "2. Create a private app with these permissions: Products (Read/Write), Orders (Read), Inventory (Read)",
      "3. Copy the API key and password",
      "4. Enter credentials in SmartCommerce settings"
    ],
    webhooks: [
      "orders/create",
      "products/update",
      "inventory_levels/update"
    ]
  },
  woocommerce: {
    steps: [
      "1. Install WooCommerce REST API plugin",
      "2. Go to WooCommerce > Settings > Advanced > REST API",
      "3. Create new API keys with Read/Write permissions",
      "4. Copy consumer key and secret",
      "5. Enter credentials in SmartCommerce settings"
    ],
    webhooks: [
      "woocommerce_new_order",
      "woocommerce_product_updated",
      "woocommerce_low_stock"
    ]
  },
  amazon: {
    steps: [
      "1. Register as Amazon seller and get MWS credentials",
      "2. Create SP-API application in Seller Central",
      "3. Get refresh token, client ID, and secret",
      "4. Configure IAM roles for API access",
      "5. Enter credentials in SmartCommerce settings"
    ],
    note: "Amazon integration requires additional setup and approval"
  }
};

// ====================
// 8. QUICK START FUNCTIONS
// ====================

// Initialize integration
function initializeIntegration(platform, credentials) {
  try {
    const adapter = new UniversalEcommerceAdapter(platform, credentials);
    
    // Store adapter globally
    window.ecommerceAdapter = adapter;
    
    // Sync initial data
    adapter.syncData().then(data => {
      console.log('Initial sync complete:', data);
      
      // Update UI with synced data
      if (data.products && data.orders) {
        // Update local data stores
        window.appData.products = data.products;
        window.appData.salesData = data.orders;
        
        // Reinitialize AI modules with new data
        window.pricingEngine = new PricingEngine(data.orders, [], data.products);
        window.inventoryPredictor = new InventoryPredictor(data.orders, data.products);
        
        // Refresh UI
        loadPricingData();
        loadInventoryData();
      }
    });
    
    return adapter;
  } catch (error) {
    console.error('Integration setup error:', error);
    throw error;
  }
}

// Test connection
async function testConnection(platform, credentials) {
  try {
    const adapter = new UniversalEcommerceAdapter(platform, credentials);
    const products = await adapter.integration.getProducts();
    
    if (products && products.length > 0) {
      return {
        success: true,
        message: `Successfully connected to ${platform}. Found ${products.length} products.`,
        sampleProduct: products[0]
      };
    } else {
      return {
        success: false,
        message: 'Connection successful but no products found.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
}

// Schedule automatic sync
function scheduleAutoSync(intervalHours = 6) {
  if (window.ecommerceAdapter) {
    // Initial sync
    window.ecommerceAdapter.syncData();
    
    // Schedule recurring sync
    setInterval(() => {
      console.log('Running scheduled sync...');
      window.ecommerceAdapter.syncData()
        .then(data => {
          console.log('Scheduled sync complete');
          // Update AI predictions
          if (window.pricingEngine) {
            loadPricingData();
          }
          if (window.inventoryPredictor) {
            loadInventoryData();
          }
        })
        .catch(error => {
          console.error('Scheduled sync error:', error);
        });
    }, intervalHours * 60 * 60 * 1000);
    
    console.log(`Auto-sync scheduled every ${intervalHours} hours`);
  }
}

// Export functions
const IntegrationAPI = {
  ShopifyIntegration,
  WooCommerceIntegration,
  AmazonIntegration,
  UniversalEcommerceAdapter,
  WebhookHandler,
  initializeIntegration,
  testConnection,
  scheduleAutoSync,
  guide: integrationGuide
};

console.log('E-commerce integrations loaded!');
console.log('Available platforms: Shopify, WooCommerce, Amazon');
console.log('Use IntegrationAPI.guide for setup instructions');
