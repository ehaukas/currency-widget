const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/api/rates', (req, res) => {
  const fakeData = [
    { currency: "EUR", midRate: 11.23, updatedDate: new Date().toISOString() },
    { currency: "USD", midRate: 10.48, updatedDate: new Date().toISOString() },
    { currency: "DKK", midRate: 1.51, updatedDate: new Date().toISOString() }
  ];
  res.json(fakeData);
});

app.listen(PORT, () => {
  console.log(`Fake DNB Proxy running at http://localhost:${PORT}`);
});
