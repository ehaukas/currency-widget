const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');  // Node's file system module

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

// Custom logging function for tracking requests and saving to file
function logFetchSource(source) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] Fetch triggered by: ${source}\n`;

  // Append log message to fetchLogs.txt file
  fs.appendFileSync('fetchLogs.txt', logMessage, 'utf8');  // Save the log to a file
  console.log(logMessage);  // Also log to console for real-time debugging
}

// Fetch currency rates function
async function fetchRates(source = 'manual') {
  try {
    logFetchSource(source);  // Log the source of the fetch

    const response = await fetch(`https://api.exchangerate.host/live?access_key=${API_KEY}&source=NOK&currencies=EUR,GBP,USD,DKK&format=1`);
    const result = await response.json();

    if (!result.quotes) {
      throw new Error("Missing quotes from API");
    }

    const now = new Date();
    const data = Object.entries(result.quotes).map(([pair, rate]) => {
      const currency = pair.slice(3); // Remove 'NOK' prefix
      return {
        currency,
        quoteCurrency: "NOK",
        midRate: 1 / rate,  // Convert to desired currency rate
        updatedDate: now.toISOString()
      };
    });

    console.log(`[${now.toISOString()}] Rates updated successfully`);
    return data;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    throw err;
  }
}

// API endpoint to fetch rates
app.get('/api/rates', async (req, res) => {
  try {
    const data = await fetchRates('manual');
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching exchange rates.");
  }
});

// Initial fetch when server starts (manual trigger)
fetchRates('startup').catch(err => console.error("Error on startup fetch:", err));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
