// Fake Data Generator for E-commerce AI Tool

// 1. Product Sales and Inventory Data
const generateProductData = () => {
  const products = [
    { id: 'P001', name: 'Wireless Earbuds', category: 'Electronics', basePrice: 59.99, cost: 25 },
    { id: 'P002', name: 'Yoga Mat', category: 'Fitness', basePrice: 29.99, cost: 12 },
    { id: 'P003', name: 'Water Bottle', category: 'Accessories', basePrice: 19.99, cost: 8 },
    { id: 'P004', name: 'Phone Case', category: 'Electronics', basePrice: 14.99, cost: 5 },
    { id: 'P005', name: 'Backpack', category: 'Accessories', basePrice: 49.99, cost: 20 }
  ];

  const salesData = [];
  const inventoryData = [];
  
  products.forEach(product => {
    // Generate 90 days of sales history
    let currentStock = 100;
    for (let day = 0; day < 90; day++) {
      const date = new Date();
      date.setDate(date.getDate() - (90 - day));
      
      // Simulate daily sales with some randomness and weekly patterns
      const weekday = date.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const baseSales = isWeekend ? 8 : 5;
      const dailySales = Math.floor(baseSales + Math.random() * 5 - 2);
      
      // Price variations
      const priceMultiplier = 0.9 + Math.random() * 0.2;
      const sellingPrice = Number((product.basePrice * priceMultiplier).toFixed(2));
      
      salesData.push({
        date: date.toISOString().split('T')[0],
        productId: product.id,
        productName: product.name,
        quantity: dailySales,
        price: sellingPrice,
        revenue: Number((dailySales * sellingPrice).toFixed(2))
      });
      
      currentStock -= dailySales;
      if (currentStock < 20) {
        currentStock += 50; // Restock
      }
    }
    
    inventoryData.push({
      productId: product.id,
      productName: product.name,
      currentStock: currentStock,
      reorderPoint: 20,
      reorderQuantity: 50,
      leadTimeDays: 7,
      lastRestockDate: new Date().toISOString().split('T')[0]
    });
  });
  
  return { salesData, inventoryData, products };
};

// 2. Customer Support Tickets
const generateSupportTickets = () => {
  const ticketTemplates = [
    { category: 'Shipping', issue: 'Where is my order?', response: 'I understand you\'re concerned about your order. Let me check the tracking information for you. Your order #ORDER_ID is currently in transit and should arrive by DATE.' },
    { category: 'Product', issue: 'Product defective', response: 'I\'m sorry to hear you\'re having issues with your product. We stand behind our quality. I\'ll send you a prepaid return label and ship a replacement immediately.' },
    { category: 'Returns', issue: 'How do I return?', response: 'I\'d be happy to help with your return. Our return policy allows returns within 30 days. I\'ll email you a return label and instructions right away.' },
    { category: 'Sizing', issue: 'Wrong size', response: 'I apologize for the sizing issue. We want you to have the perfect fit. I\'ll arrange an exchange for the correct size with free shipping both ways.' },
    { category: 'Payment', issue: 'Payment failed', response: 'I see there was an issue with your payment. This sometimes happens due to bank security. Please try again or use a different payment method. I\'m here if you need help.' }
  ];
  
  const supportTickets = [];
  for (let i = 0; i < 50; i++) {
    const template = ticketTemplates[Math.floor(Math.random() * ticketTemplates.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    supportTickets.push({
      ticketId: `T${String(i + 1).padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      customerEmail: `customer${i}@email.com`,
      category: template.category,
      subject: template.issue,
      message: `Hello, ${template.issue.toLowerCase()}. Order #${1000 + i}. Please help!`,
      suggestedResponse: template.response.replace('ORDER_ID', String(1000 + i)).replace('DATE', new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000).toDateString()),
      status: Math.random() > 0.3 ? 'resolved' : 'pending'
    });
  }
  
  return supportTickets;
};

// 3. Price History
const generatePriceHistory = (products) => {
  const priceHistory = [];
  
  products.forEach(product => {
    for (let week = 0; week < 12; week++) {
      const date = new Date();
      date.setDate(date.getDate() - (week * 7));
      
      // Competitor prices
      const competitorPrice = Number((product.basePrice * (0.85 + Math.random() * 0.3)).toFixed(2));
      const ourPrice = Number((product.basePrice * (0.9 + Math.random() * 0.2)).toFixed(2));
      
      priceHistory.push({
        date: date.toISOString().split('T')[0],
        productId: product.id,
        productName: product.name,
        ourPrice: ourPrice,
        competitorAvgPrice: competitorPrice,
        pricePosition: ourPrice > competitorPrice ? 'above' : 'below',
        margin: Number(((ourPrice - product.cost) / ourPrice * 100).toFixed(2))
      });
    }
  });
  
  return priceHistory;
};

// Generate all data
const { salesData, inventoryData, products } = generateProductData();
const supportTickets = generateSupportTickets();
const priceHistory = generatePriceHistory(products);

// Function to download data as CSV
const downloadCSV = (data, filename) => {
  if (data.length === 0) return;
  
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(key => `"${row[key]}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

// Function to download data as JSON
const downloadJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

// Export functions for use
console.log('Data generated successfully!');
console.log('Sales Data:', salesData.length, 'records');
console.log('Support Tickets:', supportTickets.length, 'records');
console.log('Price History:', priceHistory.length, 'records');

// To use this data:
// 1. Copy this entire code to browser console
// 2. Run: downloadCSV(salesData, 'sales_data.csv')
// 3. Run: downloadCSV(supportTickets, 'support_tickets.csv')
// 4. Run: downloadCSV(priceHistory, 'price_history.csv')
// 5. Run: downloadCSV(inventoryData, 'inventory_data.csv')
