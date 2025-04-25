const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// API-key som miljøvariabel
const API_KEY = process.env.EXCHANGE_RATE_API_KEY; // Sørg for at du har satt denne variabelen på Render

// CORS header
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/rates', async (req, res) => {
  try {
    // Bruk riktig https URL
    const response = await fetch(`https://api.exchangerate.host/live?access_key=${API_KEY}&source=NOK&currencies=EUR,USD,DKK&format=1`);
    const result = await response.json();
    console.log("💬 API responded:", result); // Logg hele svaret for debugging

    if (!result.rates) {
      throw new Error("Missing rates from API");
    }

    const now = new Date();
    const data = Object.entries(result.rates).map(([pair, rate]) => {
      const currency = pair.slice(3); // Fjern 'NOK' prefixet
      return {
        currency,
        quoteCurrency: "NOK",
        midRate: rate, // Bruk direkte verdi fra API (f.eks. 1 EUR = 11.84 NOK)
        updatedDate: now.toISOString()
      };
    });

    res.json(data);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).send("Error fetching exchange rates.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Currency Widget API running at http://localhost:${PORT}/api/rates`);
});
