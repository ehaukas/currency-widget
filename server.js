const fetch = require('node-fetch');

// Replace 'YOUR_ACCESS_KEY' with your actual API key
const API_KEY = 'cc1fccbc44d79ec99d47885178031703';
const BASE_URL = `https://api.exchangerate.host/latest?base=NOK&access_key=${API_KEY}`;

async function fetchRates() {
  try {
    const response = await fetch(BASE_URL);
    const result = await response.json();

    if (!result.success) {
      throw new Error(`API Error: ${result.error.type} - ${result.error.info}`);
    }

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

    // Proceed with caching and serving the data as before
    // ...
  } catch (error) {
    console.error('Error fetching exchange rates:', error.message);
  }
}
