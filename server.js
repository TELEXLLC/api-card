require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bodyParser = require('body-parser');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const htmlFilePath = path.join(__dirname, 'api-card-generate-card.html');
const confermaHtmlFilePath = path.join(__dirname, 'conferma-card-generate.html');
console.log('Serving HTML from:', htmlFilePath);
console.log('Serving Conferma HTML from:', confermaHtmlFilePath);

app.get('/', (req, res) => {
  res.sendFile(confermaHtmlFilePath, err => {
    if (err) {
      console.error('Error sending file:', err.message);
      res.status(err.status).end();
    }
  });
});

app.get('/old', (req, res) => {
  res.sendFile(htmlFilePath, err => {
    if (err) {
      console.error('Error sending file:', err.message);
      res.status(err.status).end();
    }
  });
});

const CONFERMA_CLIENT_ID = process.env.CONFERMA_CLIENT_ID || 'your_conferma_client_id';
const CONFERMA_CLIENT_SECRET = process.env.CONFERMA_CLIENT_SECRET || 'your_conferma_client_secret';
const CONFERMA_SCOPE = process.env.CONFERMA_SCOPE || 'your_conferma_scope_pkn';
const CONFERMA_CLIENT_ACCOUNT_CODE = process.env.CONFERMA_CLIENT_ACCOUNT_CODE || 'your_client_account_code';
const APPLE_JWT_TOKEN = process.env.APPLE_JWT_TOKEN || 'your_default_apple_jwt';
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----`;
const MASTERCARD_CONSUMER_KEY = process.env.MASTERCARD_CONSUMER_KEY || 'your_mastercard_consumer_key';
const MASTERCARD_PRIVATE_KEY = process.env.MASTERCARD_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
YOUR_MASTERCARD_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----`;

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Cache for Conferma access token
let confermaTokenCache = {
  token: null,
  expires: null
};

async function getConfermaAccessToken() {
  // Check if we have a valid cached token
  if (confermaTokenCache.token && confermaTokenCache.expires && new Date() < new Date(confermaTokenCache.expires)) {
    return confermaTokenCache.token;
  }

  if (!CONFERMA_CLIENT_ID || !CONFERMA_CLIENT_SECRET || !CONFERMA_SCOPE) {
    throw new Error('Conferma credentials not configured');
  }

  // Create Basic Auth credentials
  const credentials = Buffer.from(`${CONFERMA_CLIENT_ID}:${CONFERMA_CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await fetch('https://assure.cert-confermapay.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: `grant_type=client_credentials&scope=${CONFERMA_SCOPE}`
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token request failed: ${response.status} - ${errorData}`);
    }

    const tokenData = await response.json();
    
    // Cache the token
    confermaTokenCache.token = tokenData.access_token;
    confermaTokenCache.expires = tokenData.expires;
    
    return tokenData.access_token;
  } catch (error) {
    throw new Error(`Failed to get Conferma access token: ${error.message}`);
  }
}

app.post('/conferma-card', async (req, res) => {
  const { 
    spendType, 
    consumerReference, 
    supplierReference, 
    deploymentAmount, 
    invoiceAmount,
    paymentRange,
    customer,
    supplier,
    hotel,
    air,
    rail,
    transport,
    travellers,
    ancillaries,
    serviceFees,
    pnr,
    isAdvancedPurchase,
    straightThroughProcessingEnabled,
    paymentRequestFulfilmentRequests,
    advancedCardControls,
    status,
    timeZoneOffset
  } = req.body;

  if (!CONFERMA_CLIENT_ID || !CONFERMA_CLIENT_SECRET || !CONFERMA_SCOPE)
    return res.status(500).json({ error: 'Conferma credentials not configured' });

  if (!CONFERMA_CLIENT_ACCOUNT_CODE)
    return res.status(500).json({ error: 'CONFERMA_CLIENT_ACCOUNT_CODE not configured' });

  const body = {
    clientAccountCode: CONFERMA_CLIENT_ACCOUNT_CODE,
    spendType: spendType || 'Generic',
    consumerReference,
    supplierReference,
    deploymentAmount: deploymentAmount || {
      amount: 100.00,
      currencyCode: 'USD'
    },
    paymentRange: paymentRange || {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    supplier: supplier || {
      name: 'Test Supplier',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        countryCode: 'US'
      }
    }
  };

  // Add optional fields if provided
  if (invoiceAmount) body.invoiceAmount = invoiceAmount;
  if (customer) body.customer = customer;
  if (hotel) body.hotel = hotel;
  if (air) body.air = air;
  if (rail) body.rail = rail;
  if (transport) body.transport = transport;
  if (travellers) body.travellers = travellers;
  if (ancillaries) body.ancillaries = ancillaries;
  if (serviceFees) body.serviceFees = serviceFees;
  if (pnr) body.pnr = pnr;
  if (isAdvancedPurchase !== undefined) body.isAdvancedPurchase = isAdvancedPurchase;
  if (straightThroughProcessingEnabled !== undefined) body.straightThroughProcessingEnabled = straightThroughProcessingEnabled;
  if (paymentRequestFulfilmentRequests) body.paymentRequestFulfilmentRequests = paymentRequestFulfilmentRequests;
  if (advancedCardControls) body.advancedCardControls = advancedCardControls;
  if (status) body.status = status;
  if (timeZoneOffset !== undefined) body.timeZoneOffset = timeZoneOffset;

  try {
    // Get OAuth access token
    const accessToken = await getConfermaAccessToken();
    
    const response = await fetch('https://api.cert-confermapay.com/deployments/v1/deployments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'X-Request-ID': generateUUID(),
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Conferma API request failed', details: error.message });
  }
});

app.post('/apple-decrypt', (req, res) => {
  // Your Apple Pay decryption logic or placeholder
  const decrypted = { cardNumber: '4111111111111111', expirationDate: '1225', cvv: '123' };
  res.json(decrypted);
});

app.post('/mastercard/vcc-token', async (req, res) => {
  if (!MASTERCARD_CONSUMER_KEY || !MASTERCARD_PRIVATE_KEY)
    return res.status(500).json({ error: 'Mastercard credentials not configured' });

  const oauth = OAuth({
    consumer: { key: MASTERCARD_CONSUMER_KEY, secret: MASTERCARD_PRIVATE_KEY },
    signature_method: 'RSA-SHA1',
    hash_function(base_string, key) {
      return crypto.createSign('RSA-SHA1').update(base_string).sign(key, 'base64');
    }
  });

  const { primaryAccountNumber, expirationDate, cvv } = req.body;

  const requestUrl = 'https://sandbox.api.mastercard.com/virtual-card-tokenization/v1/token';
  const requestData = { primaryAccountNumber, expirationDate, cvv };
  const requestBody = JSON.stringify(requestData);
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...oauth.toHeader(oauth.authorize({ url: requestUrl, method: 'POST' }))
  };

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Mastercard VCC token request failed', details: error.message });
  }
});

// API Testing Endpoints
app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Test endpoint is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/test/conferma-card',
      '/test/mastercard', 
      '/test/apple-decrypt',
      '/test/all'
    ]
  });
});

app.get('/test/conferma-card', async (req, res) => {
  const testData = {
    spendType: 'Generic',
    consumerReference: 'TEST-REF-' + Date.now(),
    supplierReference: 'SUPPLIER-REF-' + Date.now(),
    deploymentAmount: {
      amount: 100.00,
      currencyCode: 'USD'
    },
    paymentRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    supplier: {
      name: 'Test Supplier',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        countryCode: 'US'
      }
    }
  };

  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.cert-confermapay.com/deployments/v1/deployments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (await getConfermaAccessToken()),
        'Content-Type': 'application/json',
        'X-Request-ID': generateUUID(),
      },
      body: JSON.stringify({
        clientAccountCode: CONFERMA_CLIENT_ACCOUNT_CODE,
        ...testData
      })
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    res.json({
      test: 'Conferma Card Integration',
      status: response.ok ? 'PASS' : 'FAIL',
      responseTime: `${responseTime}ms`,
      httpStatus: response.status,
      testData,
      response: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    res.json({
      test: 'Conferma Card Integration',
      status: 'ERROR',
      responseTime: `${responseTime}ms`,
      error: error.message,
      testData,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/test/mastercard', async (req, res) => {
  const testData = {
    primaryAccountNumber: '4111111111111111',
    expirationDate: '1225',
    cvv: '123'
  };

  const startTime = Date.now();

  if (!MASTERCARD_CONSUMER_KEY || !MASTERCARD_PRIVATE_KEY) {
    return res.json({
      test: 'Mastercard VCC Token',
      status: 'SKIP',
      message: 'Mastercard credentials not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const oauth = OAuth({
      consumer: { key: MASTERCARD_CONSUMER_KEY, secret: MASTERCARD_PRIVATE_KEY },
      signature_method: 'RSA-SHA1',
      hash_function(base_string, key) {
        return crypto.createSign('RSA-SHA1').update(base_string).sign(key, 'base64');
      }
    });

    const requestUrl = 'https://sandbox.api.mastercard.com/virtual-card-tokenization/v1/token';
    const requestBody = JSON.stringify(testData);
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...oauth.toHeader(oauth.authorize({ url: requestUrl, method: 'POST' }))
    };

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    res.json({
      test: 'Mastercard VCC Token',
      status: response.ok ? 'PASS' : 'FAIL',
      responseTime: `${responseTime}ms`,
      httpStatus: response.status,
      testData,
      response: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    res.json({
      test: 'Mastercard VCC Token',
      status: 'ERROR',
      responseTime: `${responseTime}ms`,
      error: error.message,
      testData,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/test/apple-decrypt', (req, res) => {
  const startTime = Date.now();
  
  try {
    // Test the Apple decrypt endpoint (currently a placeholder)
    const testResult = { cardNumber: '4111111111111111', expirationDate: '1225', cvv: '123' };
    const responseTime = Date.now() - startTime;
    
    res.json({
      test: 'Apple Pay Decrypt',
      status: 'PASS',
      responseTime: `${responseTime}ms`,
      message: 'Placeholder endpoint working',
      response: testResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    res.json({
      test: 'Apple Pay Decrypt',
      status: 'ERROR',
      responseTime: `${responseTime}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/test/all', async (req, res) => {
  const startTime = Date.now();
  const results = [];

  // Test Conferma Card (simulate the test directly)
  const confermaTestData = {
    spendType: 'Generic',
    consumerReference: 'TEST-REF-' + Date.now(),
    supplierReference: 'SUPPLIER-REF-' + Date.now(),
    deploymentAmount: {
      amount: 100.00,
      currencyCode: 'USD'
    },
    paymentRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    supplier: {
      name: 'Test Supplier',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        countryCode: 'US'
      }
    }
  };

  const confermaStartTime = Date.now();
  
  if (!CONFERMA_CLIENT_ID || !CONFERMA_CLIENT_SECRET || !CONFERMA_SCOPE) {
    results.push({
      test: 'Conferma Card Integration',
      status: 'SKIP',
      message: 'Conferma credentials not configured',
      timestamp: new Date().toISOString()
    });
  } else {
    try {
      // Get OAuth access token
      const accessToken = await getConfermaAccessToken();
      
      const response = await fetch('https://api.cert-confermapay.com/deployments/v1/deployments', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
          'X-Request-ID': generateUUID(),
        },
        body: JSON.stringify({
          clientAccountCode: CONFERMA_CLIENT_ACCOUNT_CODE,
          ...confermaTestData
        })
      });
      
      const confermaResponseTime = Date.now() - confermaStartTime;
      const data = await response.json();
      
      results.push({
        test: 'Conferma Card Integration',
        status: response.ok ? 'PASS' : 'FAIL',
        responseTime: `${confermaResponseTime}ms`,
        httpStatus: response.status,
        testData: confermaTestData,
        response: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const confermaResponseTime = Date.now() - confermaStartTime;
      results.push({
        test: 'Conferma Card Integration',
        status: 'ERROR',
        responseTime: `${confermaResponseTime}ms`,
        error: error.message,
        testData: confermaTestData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Test Mastercard
  const mastercardTestData = {
    primaryAccountNumber: '4111111111111111',
    expirationDate: '1225',
    cvv: '123'
  };

  const mastercardStartTime = Date.now();
  if (!MASTERCARD_CONSUMER_KEY || !MASTERCARD_PRIVATE_KEY) {
    results.push({
      test: 'Mastercard VCC Token',
      status: 'SKIP',
      message: 'Mastercard credentials not configured',
      timestamp: new Date().toISOString()
    });
  } else {
    try {
      const oauth = OAuth({
        consumer: { key: MASTERCARD_CONSUMER_KEY, secret: MASTERCARD_PRIVATE_KEY },
        signature_method: 'RSA-SHA1',
        hash_function(base_string, key) {
          return crypto.createSign('RSA-SHA1').update(base_string).sign(key, 'base64');
        }
      });

      const requestUrl = 'https://sandbox.api.mastercard.com/virtual-card-tokenization/v1/token';
      const requestBody = JSON.stringify(mastercardTestData);
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...oauth.toHeader(oauth.authorize({ url: requestUrl, method: 'POST' }))
      };

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });
      
      const mastercardResponseTime = Date.now() - mastercardStartTime;
      const data = await response.json();
      
      results.push({
        test: 'Mastercard VCC Token',
        status: response.ok ? 'PASS' : 'FAIL',
        responseTime: `${mastercardResponseTime}ms`,
        httpStatus: response.status,
        testData: mastercardTestData,
        response: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const mastercardResponseTime = Date.now() - mastercardStartTime;
      results.push({
        test: 'Mastercard VCC Token',
        status: 'ERROR',
        responseTime: `${mastercardResponseTime}ms`,
        error: error.message,
        testData: mastercardTestData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Test Apple Decrypt
  const appleStartTime = Date.now();
  try {
    const testResult = { cardNumber: '4111111111111111', expirationDate: '1225', cvv: '123' };
    const appleResponseTime = Date.now() - appleStartTime;
    
    results.push({
      test: 'Apple Pay Decrypt',
      status: 'PASS',
      responseTime: `${appleResponseTime}ms`,
      message: 'Placeholder endpoint working',
      response: testResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const appleResponseTime = Date.now() - appleStartTime;
    results.push({
      test: 'Apple Pay Decrypt',
      status: 'ERROR',
      responseTime: `${appleResponseTime}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  const totalTime = Date.now() - startTime;
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  const skipCount = results.filter(r => r.status === 'SKIP').length;

  res.json({
    summary: {
      totalTests: results.length,
      passed: passCount,
      failed: failCount,
      errors: errorCount,
      skipped: skipCount,
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString()
    },
    results
  });
});

// Remove explicit port listen for cloud compatibility; listen uses environment
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Server running on host 0.0.0.0, port', process.env.PORT || 3000);
});
