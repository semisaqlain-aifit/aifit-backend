const express = require('express');
const { visionCaloriesFromBase64 } = require('../services/openai');
const router = express.Router();

router.post('/food-analyze', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });
    const out = await visionCaloriesFromBase64(imageBase64);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
