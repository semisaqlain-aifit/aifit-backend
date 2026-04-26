const express = require('express');
const { chat } = require('../services/openai');
const router = express.Router();

const THEMES = [
  'Mediterranean', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Italian',
  'Korean', 'Middle Eastern', 'Vietnamese', 'Greek', 'American comfort',
  'high-protein simple', 'plant-forward', 'one-pan easy', 'sheet-pan'
];

const PROTEIN_ROTATION = ['chicken', 'fish', 'eggs', 'beef', 'tofu', 'lentils', 'turkey', 'shrimp', 'beans', 'cottage cheese'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

router.post('/meal-plan', async (req, res) => {
  try {
    const p = req.body.profile || {};
    const target = p.calorieTarget || 2000;
    const likes = (p.likes || []).join(', ') || 'any common foods';
    const dislikes = (p.dislikes || []).join(', ') || 'none';
    const allergies = (p.allergies || []).join(', ');
    const theme = pick(THEMES);
    const breakfastProtein = pick(PROTEIN_ROTATION);
    const lunchProtein = pick(PROTEIN_ROTATION.filter((x) => x !== breakfastProtein));
    const dinnerProtein = pick(PROTEIN_ROTATION.filter((x) => x !== breakfastProtein && x !== lunchProtein));

    const allergyClause = allergies
      ? `\nALLERGIES — STRICTLY EXCLUDE these ingredients and any derivatives: ${allergies}.`
      : '';

    const prompt = `Build today's meal plan.
Profile: goal=${p.goal}, kcal=${target}, likes=${likes}, dislikes=${dislikes}.${allergyClause}
Theme for today: ${theme}.
Use varied proteins: breakfast leans ${breakfastProtein}, lunch leans ${lunchProtein}, dinner leans ${dinnerProtein}.
Each meal must be DIFFERENT cuisine and protein. No repeats. Keep meals simple (3-5 ingredients), each described in ONE short sentence with an emoji prefix.
Return STRICT JSON only:
{"breakfast":"<emoji + 1 sentence>","lunch":"<emoji + 1 sentence>","dinner":"<emoji + 1 sentence>","calories":<int>}`;

    const raw = await chat(
      [
        { role: 'system', content: 'You output ONLY compact JSON. Each meal description is one short, simple sentence with an emoji at the start. Never repeat protein or cuisine across meals. Always respect allergies.' },
        { role: 'user', content: prompt }
      ],
      { max_tokens: 280 }
    );
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : raw);
    res.json({
      breakfast: String(parsed.breakfast || ''),
      lunch: String(parsed.lunch || ''),
      dinner: String(parsed.dinner || ''),
      calories: Math.round(Number(parsed.calories) || target),
      theme
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
