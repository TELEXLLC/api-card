require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const htmlFilePath = path.join(__dirname, 'api-card-generate-card.html');
console.log('Serving HTML from:', htmlFilePath);

app.get('/', (req, res) => {
  res.sendFile(htmlFilePath, err => {
    if (err) {
      console.error('Error sending file:', err.message);
      res.status(err.status).end();
    }
  });
});

const API_CARD_API_KEY = process.env.API_CARD_API_KEY;
const APPLE_JWT_TOKEN = process.env.APPLE_JWT_TOKEN;
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
const MASTERCARD_CONSUMER_KEY = process.env.MASTERCARD_CONSUMER_KEY;
const MASTERCARD_PRIVATE_KEY = process.env.MASTERCARD_PRIVATE_KEY;

// Validate required environment variables
if (!API_CARD_API_KEY) {
  console.warn('Warning: API_CARD_API_KEY not set in environment variables');
}
if (!APPLE_JWT_TOKEN) {
  console.warn('Warning: APPLE_JWT_TOKEN not set in environment variables');
}
if (!APPLE_PRIVATE_KEY) {
  console.warn('Warning: APPLE_PRIVATE_KEY not set in environment variables');
}
if (!MASTERCARD_CONSUMER_KEY) {
  console.warn('Warning: MASTERCARD_CONSUMER_KEY not set in environment variables');
}
if (!MASTERCARD_PRIVATE_KEY) {
  console.warn('Warning: MASTERCARD_PRIVATE_KEY not set in environment variables');
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.post('/api-card', async (req, res) => {
  const { programId, limit, addressGenerate, manualAddress, expMonth, expYear, isTest } = req.body;

  // Validate required environment variable
  if (!API_CARD_API_KEY) {
    return res.status(500).json({ error: 'API_CARD_API_KEY not configured' });
  }

  // Validate required fields
  if (!programId || typeof programId !== 'number') {
    return res.status(400).json({ error: 'programId is required and must be a number' });
  }

  if (!expMonth || !expYear) {
    return res.status(400).json({ error: 'expMonth and expYear are required' });
  }

  // Validate manual address fields if addressGenerate is false
  if (!addressGenerate && manualAddress) {
    const requiredFields = ['FirstName', 'LastName', 'Address1', 'City', 'State', 'Zip', 'CountryIso'];
    for (const field of requiredFields) {
      if (!manualAddress[field] || manualAddress[field].trim() === '') {
        return res.status(400).json({ error: `${field} is required when not auto-generating address` });
      }
    }
  }

  const body = {
    ProgramID: programId,
    Limit: limit || 1,
    AddressGenerate: addressGenerate,
    ExpMonth: expMonth,
    ExpYear: expYear,
    IsTest: isTest !== false, // Default to true for safety
    ...( !addressGenerate && manualAddress ? manualAddress : {} )
  };

  try {
    console.log('Making API request to api-card.com with body:', JSON.stringify(body, null, 2));
    
    const response = await fetch('https://api-card.com/api/v1/cards', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_CARD_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': generateUUID(),
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    console.log('API response status:', response.status);
    console.log('API response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('API request error:', error);
    res.status(500).json({ error: 'api-card request failed', details: error.message });
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Card Server running on port ${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});
