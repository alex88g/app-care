const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const sendSMS = require('../utils/sendSMS');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  try {
    await sendSMS(phone, message);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports.handler = serverless(app);
