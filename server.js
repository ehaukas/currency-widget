// server.js (Auto-refreshing hourly, working hours only)
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

const CACHE_PATH = path.join(__dirname, 'rates.json');
let cachedData = null;
let cachedTimestamp = null;

// Load cache at startup
if (fs.existsSync(CACHE_PATH)) {
  const file = JSON.parse(fs.readFileSync(CACHE_PATH));
  cachedData = file.data;
  cachedTimestamp = new Date(file.updated);
}

// Middleware: Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

async function fetchRates() {
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=NOK');

    if (response.ok) {
      const result = await response.json();
      const updatedDate = new Date();

      const data = [
        {
          currency: "EUR",
          quoteCurrency: "NOK",
          rate: result.rates.EUR
        },
        {
          currency: "USD",
          quoteCurrency: "NOK",
          rate: result.rates.USD
        },
        {
          currency: "DKK",
          quoteCurrency: "NOK",
          rate: result.rates.DKK
        }
      ];

      cachedData = {
        source: "ExchangeRate.host",
        timestamp: updatedDate,
        rates: data
      };
      cachedTimestamp = updatedDate;

      fs.writeFileSync(CACHE_PATH, JSON.stringify({
        data: cachedData,
        updated: updatedDate
      }, null, 2));

      console.log('✅ Rates updated and cached:', updatedDate.toISOString());
    } else {
      console.warn('⚠️ Failed to fetch new rates. Using cached.');
    }
  } catch (err) {
    console.error('❌ Error fetching from ExchangeRate.host:', err.message);
  }
}

// Schedule automatic hourly refresh (working days 8-17 Oslo time)
setInterval(() => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Convert UTC to Oslo time (UTC+2 during summer)
  const osloHour = (utcHour + 2) % 24;

  if (day >= 1 && day <= 5 && osloHour >= 8 && osloHour <= 17) {
    console.log(`🔄 Scheduled fetch at Oslo time ${osloHour}:00`);
    fetchRates();
  } else {
    console.log(`⏸️ Outside working hours (${osloHour}:00 Oslo time)`);
  }
}, 1000 * 60 * 60); // every 1 hour

// First fetch immediately on server start
fetchRates();

app.get('/api/rates', (req, res) => {
  if (cachedData) {
    res.json(cachedData);
  } else {
    res.status(503).send('No data available');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
