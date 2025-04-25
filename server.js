const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = 'cc1fccbc44d79ec99d47885178031703'; // <-- REPLACE THIS
let cachedData = [];
let lastUpdated = null;

async function fetchRates() {
  try {
    console.log("⏳ Fetching new exchange rates...");
    const response = await fetch(`http://api.exchangerate.host/live?access_key=${API_KEY}&source=NOK&currencies=EUR,USD,DKK&format=1`);
    const result = await response.json();

    if (!result.quotes) {
      throw new Error("Missing quotes from API");
    }

    const now = new Date();
    cachedData = Object.entries(result.quotes).map(([pair, rate]) => {
      const currency = pair.slice(3); // Remove 'NOK' prefix
      return {
        currency,
        quoteCurrency: "NOK",
        midRate: 1 / rate,
        updatedDate: now.toISOString()
      };
    });
    lastUpdated = now.toISOString();
    console.log("✅ Rates updated at", lastUpdated);
  } catch (err) {
    console.error("⚠️ Fetch error:", err.message);
  }
}

// Fetch initially when server starts
fetchRates();

// Setup scheduler
cron.schedule('0 8,10,12,14,16 * * 1-5', () => {
  fetchRates();
}, {
  timezone: "Europe/Oslo"
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/rates', (req, res) => {
  if (cachedData.length === 0) {
    return res.status(503).send("Rates not available yet.");
  }
  res.json(cachedData);
});

app.listen(PORT, () => {
  console.log(`✅ Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
