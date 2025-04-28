const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');

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
    const response = await fetch(`https://api.exchangerate.host/live?access_key=${API_KEY}&source=NOK&currencies=EUR,GBP,USD,DKK&format=1`);
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

    // Logg data til CSV
    logRatesToCSV(cachedRates);

    console.log('✅ Rates updated at', now.toISOString());
  } catch (err) {
    console.error('❌ Fetch error:', err);
  }
}

// Funksjon for å logge data til CSV
function logRatesToCSV(rates) {
  const csv = new Parser().parse(rates);
  const filePath = './rates.csv';

  // Append data to CSV
  fs.appendFile(filePath, csv + '\n', (err) => {
    if (err) {
      console.error('Error writing CSV:', err);
    } else {
      console.log('✅ Rates logged to CSV.');
    }
  });
}

// API endpoint
app.get('/api/rates', (req, res) => {
  res.json(cachedRates);
});

// Initial fetch når serveren starter
fetchRates();

// Start server
app.listen(PORT, () => {
  console.log(`✅ Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
