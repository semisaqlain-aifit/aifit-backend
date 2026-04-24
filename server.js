require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRouter = require('./routes/chat');
const mealsRouter = require('./routes/meals');
const workoutsRouter = require('./routes/workouts');
const foodRouter = require('./routes/foodAnalysis');

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'aifit-backend' }));
app.use('/api', chatRouter);
app.use('/api', mealsRouter);
app.use('/api', workoutsRouter);
app.use('/api', foodRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  const groq = Boolean(process.env.GROQ_API_KEY);
  const openai = Boolean(process.env.OPENAI_API_KEY);
  console.log(`AIFIT backend listening on :${port}`);
  if (groq) console.log('[AI] provider: groq (free)');
  else if (openai) console.log('[AI] provider: openai');
  else console.warn('[WARN] No AI key set. Add GROQ_API_KEY (free) or OPENAI_API_KEY to .env — AI endpoints will error.');
});
