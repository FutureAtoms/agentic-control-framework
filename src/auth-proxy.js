#!/usr/bin/env node

/**
 * Authentication & Monetization Proxy for ACF MCP Server
 * Handles token validation, rate limiting, usage tracking, and billing
 */

const express = require('express');
const httpProxy = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.AUTH_PORT || 3000;
const mcpProxyUrl = process.env.MCP_PROXY_URL || 'http://localhost:8080';

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'https://claude.ai',
    'https://cursor.sh',
    'https://codeium.com',
    'https://continue.dev'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Database setup (Supabase for simplicity)
const supabase = process.env.SUPABASE_URL ? createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
) : null;

// In-memory store for demo (use Redis/database in production)
const tokenStore = new Map();
const usageStore = new Map();

// Token tiers configuration
const TIERS = {
  free: {
    maxRequests: 100,
    maxToolsPerMonth: 15,
    resetInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
    allowedTools: [
      'list_directory', 'read_file', 'write_file', 'execute_command',
      'search_files', 'get_file_info', 'copy_file', 'move_file',
      'delete_file', 'create_directory', 'tree', 'browser_navigate',
      'browser_click', 'browser_type', 'browser_take_screenshot'
    ]
  },
  pro: {
    maxRequests: 10000,
    maxToolsPerMonth: -1, // unlimited
    resetInterval: 30 * 24 * 60 * 60 * 1000,
    allowedTools: null // all tools
  },
  enterprise: {
    maxRequests: 100000,
    maxToolsPerMonth: -1,
    resetInterval: 30 * 24 * 60 * 60 * 1000,
    allowedTools: null
  }
};

// Rate limiting by tier
const createRateLimit = (windowMs, max) => rateLimit({
  windowMs,
  max,
  message: { error: 'Rate limit exceeded. Please upgrade your plan.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token validation middleware
async function validateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    
    // Check token in database first, then fallback to memory
    let tokenData = null;
    
    if (supabase) {
      const { data } = await supabase
        .from('tokens')
        .select('*')
        .eq('token', token)
        .single();
      tokenData = data;
    }
    
    if (!tokenData) {
      tokenData = tokenStore.get(token);
    }

    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if token is active
    if (!tokenData.active) {
      return res.status(401).json({ error: 'Token deactivated' });
    }

    // Check usage limits
    const usage = usageStore.get(token) || { requests: 0, lastReset: Date.now() };
    const tier = TIERS[tokenData.tier] || TIERS.free;
    
    // Reset usage if interval passed
    if (Date.now() - usage.lastReset > tier.resetInterval) {
      usage.requests = 0;
      usage.lastReset = Date.now();
      usageStore.set(token, usage);
    }

    if (usage.requests >= tier.maxRequests) {
      return res.status(429).json({ 
        error: 'Usage limit exceeded',
        tier: tokenData.tier,
        limit: tier.maxRequests,
        resetDate: new Date(usage.lastReset + tier.resetInterval)
      });
    }

    // Add token data to request
    req.tokenData = tokenData;
    req.usage = usage;
    req.tier = tier;
    
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
}

// Tool access control middleware
function checkToolAccess(req, res, next) {
  try {
    const { tier, tokenData } = req;
    const requestData = req.body;
    
    if (requestData && requestData.params && requestData.params.name) {
      const toolName = requestData.params.name;
      
      // Check if tool is allowed for this tier
      if (tier.allowedTools && !tier.allowedTools.includes(toolName)) {
        return res.status(403).json({
          error: 'Tool not available in your tier',
          tool: toolName,
          tier: tokenData.tier,
          upgradeUrl: `${process.env.BASE_URL}/upgrade`
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Tool access check error:', error);
    next();
  }
}

// Usage tracking middleware
function trackUsage(req, res, next) {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token && req.tokenData) {
      const usage = req.usage;
      usage.requests++;
      usageStore.set(token, usage);
      
      // Log usage for analytics
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        token: token.substring(0, 8) + '...',
        tier: req.tokenData.tier,
        tool: req.body?.params?.name,
        requests: usage.requests
      }));
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
  
  next();
}

// Proxy configuration
const proxyOptions = {
  target: mcpProxyUrl,
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Service temporarily unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers
    proxyReq.setHeader('X-Forwarded-User', req.tokenData?.userId || 'anonymous');
    proxyReq.setHeader('X-User-Tier', req.tokenData?.tier || 'free');
  }
};

const proxy = httpProxy.createProxyMiddleware(proxyOptions);

// Apply rate limiting based on tier
app.use((req, res, next) => {
  const tier = req.tokenData?.tier || 'free';
  const limits = {
    free: createRateLimit(60 * 1000, 10), // 10 requests per minute
    pro: createRateLimit(60 * 1000, 100), // 100 requests per minute
    enterprise: createRateLimit(60 * 1000, 1000) // 1000 requests per minute
  };
  
  if (limits[tier]) {
    limits[tier](req, res, next);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'acf-auth-proxy'
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    totalTokens: tokenStore.size,
    totalUsage: Array.from(usageStore.values()).reduce((sum, usage) => sum + usage.requests, 0),
    tierDistribution: {}
  };
  
  for (const [token, data] of tokenStore) {
    metrics.tierDistribution[data.tier] = (metrics.tierDistribution[data.tier] || 0) + 1;
  }
  
  res.json(metrics);
});

// Authentication endpoints
app.post('/api/signup/free', async (req, res) => {
  try {
    const token = `acf_free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokenData = {
      token,
      tier: 'free',
      active: true,
      created: Date.now(),
      userId: req.body.email || `user_${Date.now()}`
    };
    
    tokenStore.set(token, tokenData);
    usageStore.set(token, { requests: 0, lastReset: Date.now() });
    
    // Save to database if available
    if (supabase) {
      await supabase.from('tokens').insert(tokenData);
    }
    
    res.json({ 
      token,
      tier: 'free',
      limits: TIERS.free,
      message: 'Free tier token created successfully'
    });
  } catch (error) {
    console.error('Free signup error:', error);
    res.status(500).json({ error: 'Failed to create free account' });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    
    const { tier = 'pro' } = req.body;
    const prices = {
      pro: process.env.STRIPE_PRO_PRICE_ID,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
    };
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: prices[tier],
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/cancel`,
      metadata: {
        tier,
        service: 'acf-mcp-proxy'
      }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook for subscription management
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tier = session.metadata.tier;
      
      // Create pro/enterprise token
      const token = `acf_${tier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tokenData = {
        token,
        tier,
        active: true,
        created: Date.now(),
        stripeSessionId: session.id,
        userId: session.customer_email || `user_${Date.now()}`
      };
      
      tokenStore.set(token, tokenData);
      usageStore.set(token, { requests: 0, lastReset: Date.now() });
      
      console.log(`Created ${tier} token:`, token);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Protected MCP proxy routes
app.use('/sse', validateToken, checkToolAccess, trackUsage, proxy);
app.use('/messages', validateToken, checkToolAccess, trackUsage, proxy);

// Default route
app.get('/', (req, res) => {
  res.json({
    service: 'ACF MCP Proxy',
    status: 'running',
    documentation: `${process.env.BASE_URL}/docs`,
    signup: `${process.env.BASE_URL}/signup`
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Application error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id
  });
});

app.listen(port, () => {
  console.log(`🔐 ACF Auth Proxy running on port ${port}`);
  console.log(`🎯 Proxying to MCP server at ${mcpProxyUrl}`);
  console.log(`💳 Stripe configured: ${!!process.env.STRIPE_SECRET_KEY}`);
  console.log(`🗄️ Database configured: ${!!supabase}`);
}); 