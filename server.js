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

const API_CARD_API_KEY = process.env.API_CARD_API_KEY || 'your_default_api_card_key';
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

app.post('/api-card', async (req, res) => {
  const { programId, limit, addressGenerate, manualAddress, expMonth, expYear, isTest } = req.body;

  if (!API_CARD_API_KEY)
    return res.status(500).json({ error: 'API_CARD_API_KEY not configured' });

  const body = {
    ProgramID: programId,
    Limit: limit,
    AddressGenerate: addressGenerate,
    ExpMonth: expMonth,
    ExpYear: expYear,
    IsTest: isTest,
    ...( !addressGenerate && manualAddress ? manualAddress : {} )
  };

  try {
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
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
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

// Remove explicit port listen for cloud compatibility; listen uses environment
app.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
