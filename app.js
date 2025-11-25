// app.js - main server
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

const apiLinksRouter = require('./routes/apiLinks');
const pagesRouter = require('./routes/redirectAndPages');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers (keep CSP off in dev if it blocks local assets; you can configure per your needs)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(bodyParser.json());

// mount API routes at exactly /api/links
app.use('/api/links', apiLinksRouter);

// serve static assets (public/) at /static
app.use('/static', express.static(path.join(__dirname, 'public')));

// pages and redirect (order matters: api routes above)
app.use('/', pagesRouter);

// fallback 404 for anything else
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.listen(PORT, () => {
  console.log(`TinyLink server listening on port ${PORT}`);
});
