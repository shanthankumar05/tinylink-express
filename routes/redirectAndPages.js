// routes/redirectAndPages.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { connectToDatabase } = require('../lib/mongo');

// Dashboard page (static)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Stats page (static) - client fetches /api/links/:code
router.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'code.html'));
});

// Healthcheck
router.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, version: '1.0' });
});

// Redirect route (should be last)
router.get('/:code', async (req, res) => {
  const code = req.params.code;
  // avoid routing reserved paths
  if (['api', 'static', 'healthz', 'code'].includes(code)) return res.status(404).send('not found');

  try {
    const { db } = await connectToDatabase();
    const r = await db.collection('links').findOneAndUpdate(
      { _id: code },
      { $inc: { clicks: 1 }, $set: { last_clicked: new Date() } },
      { returnDocument: 'after' }
    );
    if (!r.value) return res.status(404).send('Not found');
    return res.redirect(302, r.value.url);
  } catch (e) {
    console.error('Redirect error', e);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
