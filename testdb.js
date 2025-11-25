// testdb.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('DB connected');
    const db = client.db(process.env.MONGODB_DB || 'tinylink');
    const count = await db.collection('links').countDocuments();
    console.log('links count:', count);
  } catch (e) {
    console.error('DB error:', e);
  } finally {
    await client.close();
  }
})();
