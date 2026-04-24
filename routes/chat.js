const express = require('express');
const { chat } = require('../services/openai');
const router = express.Router();

const SYSTEM = {
  role: 'system',
  content:
    'You are AIFIT, a concise fitness and nutrition coach. Reply in no more than 3 to 4 short lines. Use bullet points only if needed. No fluff, no disclaimers.'
};

router.post('/chat', async (req, res) => {
  try {
    const history = Array.isArray(req.body.messages) ? req.body.messages : [];
    const messages = [SYSTEM, ...history.filter((m) => m.role !== 'system').slice(-8)];
    const reply = await chat(messages);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
