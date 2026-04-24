const express = require('express');
const { chat } = require('../services/openai');
const router = express.Router();

router.post('/workout', async (req, res) => {
  try {
    const p = req.body.profile || {};
    const prompt = `Suggest today's workout for goal="${p.goal}", age=${p.age}, weightKg=${p.weightKg}.
Return STRICT JSON only:
{"type":"<short>","duration":"<e.g. 30 min>","intensity":"<low|medium|high>","notes":"<max 2 short lines>"}`;
    const raw = await chat(
      [
        { role: 'system', content: 'You output only compact JSON. Be specific and practical. Notes max 2 short lines.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 220 }
    );
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : raw);
    res.json({
      type: String(parsed.type || 'Full-body session'),
      duration: String(parsed.duration || '30 min'),
      intensity: String(parsed.intensity || 'medium'),
      notes: String(parsed.notes || '')
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
