// SmartCommerce AI Modules
// These modules can work with or without AI APIs

// Module 1: Pricing Suggestion Engine
class PricingEngine {
  constructor(salesData, priceHistory, inventory) {
    this.salesData = salesData;
    this.priceHistory = priceHistory;
    this.inventory = inventory;
  }

  // Calculate sales velocity (units per day)
  calculateVelocity(productId, days = 7) {
    const recentSales = this.salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const daysAgo = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
      return sale.productId === productId && daysAgo <= days;
    });
    
    const totalUnits = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    return totalUnits / days;
  }

  // Get competitor price position
  getMarketPosition(productId) {
    const recent = this.priceHistory
      .filter(p => p.productId === productId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    return {
      ourPrice: recent.ourPrice,
      competitorPrice: recent.competitorAvgPrice,
      difference: ((recent.ourPrice - recent.competitorAvgPrice) / recent.competitorAvgPrice * 100).toFixed(2)
    };
  }

  // Generate pricing suggestions
  suggestPrice(productId) {
    const velocity = this.calculateVelocity(productId);
    const position = this.getMarketPosition(productId);
    const stock = this.inventory.find(i => i.productId === productId);
    
    let suggestion = {
      productId,
      currentPrice: position.ourPrice,
      suggestedPrice: position.ourPrice,
      reason: '',
      expectedImpact: ''
    };

    // High velocity + low stock = increase price
    if (velocity > 5 && stock.currentStock < 30) {
      suggestion.suggestedPrice = Number((position.ourPrice * 1.1).toFixed(2));
      suggestion.reason = 'High demand with low stock';
      suggestion.expectedImpact = 'Maximize profit margins while stock lasts';
    }
    // Low velocity + high stock = decrease price
    else if (velocity < 2 && stock.currentStock > 50) {
      suggestion.suggestedPrice = Number((position.ourPrice * 0.92).toFixed(2));
      suggestion.reason = 'Slow sales with excess inventory';
      suggestion.expectedImpact = 'Increase sales velocity by 30-50%';
    }
    // Price above competitors with normal velocity = match market
    else if (position.difference > 10 && velocity < 4) {
      suggestion.suggestedPrice = Number((position.competitorPrice * 1.02).toFixed(2));
      suggestion.reason = 'Price significantly above market average';
      suggestion.expectedImpact = 'Improve competitiveness while maintaining margin';
    }

    return suggestion;
  }
}

// Module 2: Customer Support Reply Generator
class SupportAssistant {
  constructor(ticketHistory) {
    this.ticketHistory = ticketHistory;
    this.templates = this.learnFromHistory();
  }

  // Learn response patterns from history
  learnFromHistory() {
    const templates = {};
    this.ticketHistory.forEach(ticket => {
      if (!templates[ticket.category]) {
        templates[ticket.category] = [];
      }
      templates[ticket.category].push({
        keywords: this.extractKeywords(ticket.subject + ' ' + ticket.message),
        response: ticket.suggestedResponse
      });
    });
    return templates;
  }

  // Simple keyword extraction
  extractKeywords(text) {
    const commonWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an'];
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }

  // Generate response for new ticket
  generateResponse(subject, message, category) {
    const ticketKeywords = this.extractKeywords(subject + ' ' + message);
    
    // If using OpenAI API (code template)
    if (window.OPENAI_API_KEY) {
      return this.generateWithAI(subject, message, category);
    }
    
    // Fallback: template matching
    const categoryTemplates = this.templates[category] || [];
    let bestMatch = null;
    let bestScore = 0;

    categoryTemplates.forEach(template => {
      const score = ticketKeywords.filter(keyword => 
        template.keywords.includes(keyword)
      ).length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    });

    if (bestMatch) {
      return this.personalizeResponse(bestMatch.response, subject);
    }

    // Default response
    return `Thank you for contacting us about "${subject}". I understand your concern and I'm here to help. Let me look into this for you right away. I'll get back to you within 24 hours with a solution.`;
  }

  // Add personal touches to response
  personalizeResponse(template, subject) {
    return template
      .replace(/ORDER_ID/g, `#${Math.floor(1000 + Math.random() * 9000)}`)
      .replace(/DATE/g, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString());
  }

  // AI-powered response (requires API key)
  async generateWithAI(subject, message, category) {
    const prompt = `Generate a helpful customer service response for this ${category} inquiry:
Subject: ${subject}
Message: ${message}

Response should be friendly, helpful, and offer a specific solution.`;

    // This is where you'd call OpenAI API
    // For now, returning template
    return this.generateResponse(subject, message, category);
  }
}

// Module 3: Inventory Prediction Model
class InventoryPredictor {
  constructor(salesData, inventory) {
    this.salesData = salesData;
    this.inventory = inventory;
  }

  // Calculate average daily sales
  getAverageDailySales(productId, days = 30) {
    const recentSales = this.salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const daysAgo = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
      return sale.productId === productId && daysAgo <= days;
    });
    
    const totalUnits = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    return totalUnits / days;
  }

  // Detect sales trend (increasing/decreasing)
  detectTrend(productId) {
    const week1Sales = this.getAverageDailySales(productId, 7);
    const week4Sales = this.getAverageDailySales(productId, 28);
    
    const trendPercent = ((week1Sales - week4Sales) / week4Sales) * 100;
    
    return {
      trend: trendPercent > 10 ? 'increasing' : trendPercent < -10 ? 'decreasing' : 'stable',
      percentage: trendPercent.toFixed(2)
    };
  }

  // Predict when to reorder
  predictReorder(productId) {
    const product = this.inventory.find(i => i.productId === productId);
    const avgDailySales = this.getAverageDailySales(productId);
    const trend = this.detectTrend(productId);
    
    // Adjust for trend
    let adjustedDailySales = avgDailySales;
    if (trend.trend === 'increasing') {
      adjustedDailySales *= 1.2; // Add 20% buffer for increasing trend
    }
    
    // Calculate days until reorder point
    const daysUntilReorder = (product.currentStock - product.reorderPoint) / adjustedDailySales;
    
    // Account for lead time
    const shouldReorderIn = daysUntilReorder - product.leadTimeDays;
    
    return {
      productId,
      productName: product.productName,
      currentStock: product.currentStock,
      dailySales: avgDailySales.toFixed(2),
      trend: trend.trend,
      daysUntilStockout: (product.currentStock / adjustedDailySales).toFixed(0),
      reorderIn: shouldReorderIn.toFixed(0),
      urgent: shouldReorderIn <= 0,
      recommendation: shouldReorderIn <= 0 
        ? `ORDER NOW! Stock will run out before new inventory arrives.`
        : `Order in ${shouldReorderIn.toFixed(0)} days to maintain stock levels.`
    };
  }

  // Get all predictions
  getAllPredictions() {
    return this.inventory.map(item => this.predictReorder(item.productId))
      .sort((a, b) => a.reorderIn - b.reorderIn);
  }
}

// Export for use in main application
const AIModules = {
  PricingEngine,
  SupportAssistant,
  InventoryPredictor
};

console.log('AI Modules loaded successfully!');
console.log('Available modules: PricingEngine, SupportAssistant, InventoryPredictor');
