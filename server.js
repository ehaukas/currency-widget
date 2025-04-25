const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');
const path = require('path');

const app = express();
// Bruk PORT miljøvariabelen fra Render (hvis ikke, fall tilbake på 3000)
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'YOUR_API_KEY_HERE'; // Skriv inn din API-nøkkel

let cachedRates = [];

// Serve static files like currency-widget.html
app.use(express.static(path.join(__dirname)));

// Fetch currency rates
async function fetchRates() {
  try {
    const response = await fetch(`https://api.exchangerate.host/latest?base=NOK&symbols=EUR,USD,DKK&access_key=${API_KEY}`);
    const data = await response.json();

    if (!data || !data.rates) {
      throw new Error('Missing rates from API');
    }

    const updatedDate = new Date().toISOString();
    cachedRates = [
      { currency: 'EUR', quoteCurrency: 'NOK', midRate: 1 / data.rates.EUR, updatedDate },
      { currency: 'USD', quoteCurrency: 'NOK', midRate: 1 / data.rates.USD, updatedDate },
      { currency: 'DKK', quoteCurrency: 'NOK', midRate: 1 / data.rates.DKK, updatedDate }
    ];

    console.log('✅ Rates updated at', updatedDate);
  } catch (error) {
    console.error('❌ Fetch error:', error);
  }
}

// API endpoint
app.get('/api/rates', (req, res) => {
  res.json(cachedRates);
});

// Initial fetch when server starts
fetchRates();

// Scheduled fetching at 08:00, 10:00, 12:00, 14:00, 16:00 on Monday-Friday
cron.schedule('0 8,10,12,14,16 * * 1-5', () => {
  console.log('🔄 Scheduled fetch triggered.');
  fetchRates();
});

// Start server (bruk PORT miljøvariabelen)
app.listen(PORT, () => {
  console.log(`✅ Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
