// lib/mongo.js - MongoDB connection helper
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'tinylink';

if (!uri) {
  throw new Error('Please set MONGODB_URI in environment');
}

// cache connection across hot reloads
let cached = global._mongoCache || (global._mongoCache = { client: null, db: null, promise: null });

async function connectToDatabase() {
  if (cached.db) return { client: cached.client, db: cached.db };
  if (!cached.promise) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    cached.promise = client.connect().then(() => {
      cached.client = client;
      cached.db = client.db(dbName);
      return { client: cached.client, db: cached.db };
    });
  }
  return cached.promise;
}

module.exports = { connectToDatabase };
