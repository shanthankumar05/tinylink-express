// routes/apiLinks.js
const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../lib/mongo');

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function generateCode(len = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

// GET /api/links -> list all links
router.get('/', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const rows = await db.collection('links').find().sort({ created_at: -1 }).toArray();
    const mapped = rows.map(r => ({
      code: r._id,
      url: r.url,
      clicks: r.clicks,
      last_clicked: r.last_clicked,
      created_at: r.created_at
    }));
    return res.status(200).json(mapped);
  } catch (e) {
    console.error('GET /api/links error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

// POST /api/links -> create new link (409 if code exists)
router.post('/', async (req, res) => {
  try {
    const { url, code } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url is required' });

    // validate URL
    try { new URL(url); } catch (e) { return res.status(400).json({ error: 'invalid url' }); }

    const { db } = await connectToDatabase();

    let finalCode = (code && typeof code === 'string' && code.trim().length) ? code.trim() : null;
    if (finalCode && !CODE_REGEX.test(finalCode)) {
      return res.status(400).json({ error: 'code must match [A-Za-z0-9]{6,8}' });
    }

    if (!finalCode) {
      // try to generate unique code
      for (let i = 0; i < 6; i++) {
        const candidate = generateCode();
        try {
          const doc = { _id: candidate, url: new URL(url).href, clicks: 0, created_at: new Date(), last_clicked: null };
          await db.collection('links').insertOne(doc);
          return res.status(201).json({ code: candidate, url: doc.url, clicks: 0, last_clicked: null, created_at: doc.created_at });
        } catch (e) {
          if (e.code === 11000) continue;
          console.error('Insert error', e);
          return res.status(500).json({ error: 'server error' });
        }
      }
      return res.status(500).json({ error: 'could not generate unique code' });
    } else {
      try {
        const doc = { _id: finalCode, url: new URL(url).href, clicks: 0, created_at: new Date(), last_clicked: null };
        await db.collection('links').insertOne(doc);
        return res.status(201).json({ code: finalCode, url: doc.url, clicks: 0, last_clicked: null, created_at: doc.created_at });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: 'code already exists' });
        console.error(e);
        return res.status(500).json({ error: 'server error' });
      }
    }
  } catch (err) {
    console.error('POST /api/links error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// GET /api/links/:code -> single link
router.get('/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const { db } = await connectToDatabase();
    const doc = await db.collection('links').findOne({ _id: code });
    if (!doc) return res.status(404).json({ error: 'not found' });
    return res.status(200).json({ code: doc._id, url: doc.url, clicks: doc.clicks, last_clicked: doc.last_clicked, created_at: doc.created_at });
  } catch (e) {
    console.error('GET /api/links/:code error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

// DELETE /api/links/:code -> delete link (204 on success)
router.delete('/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const { db } = await connectToDatabase();
    const result = await db.collection('links').deleteOne({ _id: code });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'not found' });
    return res.status(204).end();
  } catch (e) {
    console.error('DELETE /api/links/:code error', e);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
