const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API-key som miljøvariabel
const API_KEY = process.env.EXCHANGE_RATE_API_KEY; // Sørg for at du har satt denne variabelen på Render

// Server statiske filer, inkludert HTML-filen
app.use(express.static(path.join(__dirname)));

// CORS header
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Variabel for å cache valutakurser
let cachedRates = [];

// Fetch currency rates funksjon
async function fetchRates() {
  try {
    const response = await fetch(`https://api.exchangerate.host/live?access_key=${API_KEY}&source=NOK&currencies=EUR,USD,DKK&format=1`);
    const result = await response.json();

    if (!result.rates) {
      throw new Error("Missing rates from API");
    }

    const now = new Date();
    cachedRates = Object.entries(result.rates).map(([pair, rate]) => {
      const currency = pair.slice(3); // Fjern 'NOK' prefixet
      return {
        currency,
        quoteCurrency: "NOK",
        midRate: 1 / rate, // Konverter til ønsket valutaformat
        updatedDate: now.toISOString()
      };
    });

    console.log('✅ Rates updated at', now.toISOString());
  } catch (err) {
    console.error('❌ Fetch error:', err);
  }
}

// API endpoint
app.get('/api/rates', (req, res) => {
  res.json(cachedRates);
});

// Initial fetch når serveren starter
fetchRates();

// Cron-jobb for å hente data på spesifikke tider (08:00, 10:00, 12:00, 14:00, 16:00 på mandag til fredag)
cron.schedule('0 8,10,12,14,16 * * 1-5', () => {
  console.log('🔄 Scheduled fetch triggered.');
  fetchRates();
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
