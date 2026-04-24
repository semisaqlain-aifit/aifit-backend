const express = require('express');
const { chat } = require('../services/openai');
const router = express.Router();

router.post('/meal-plan', async (req, res) => {
  try {
    const p = req.body.profile || {};
    const target = p.calorieTarget || 2000;
    const prompt = `Build a daily meal plan for user:
goal: ${p.goal}, kcal target: ${target}, likes: ${(p.likes || []).join(', ') || 'any'}, dislikes: ${(p.dislikes || []).join(', ') || 'none'}.
Return STRICT JSON only, no prose:
{"breakfast":"<1 sentence>","lunch":"<1 sentence>","dinner":"<1 sentence>","calories":<total int>}`;
    const raw = await chat(
      [
        { role: 'system', content: 'You output only compact JSON. Each meal description max 1 short sentence.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 240 }
    );
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : raw);
    res.json({
      breakfast: String(parsed.breakfast || ''),
      lunch: String(parsed.lunch || ''),
      dinner: String(parsed.dinner || ''),
      calories: Math.round(Number(parsed.calories) || target)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
