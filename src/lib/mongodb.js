import { MongoClient } from 'mongodb';

if (!process.env.DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

const url = process.env.DATABASE_URL;
let client;
let clientPromise;

try {
  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable so the MongoClient is not repeatedly instantiated
    if (!global._mongoClientPromise) {
      client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, it's best to not use a global variable
    client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    clientPromise = client.connect();
  }
} catch (error) {
  console.error('MongoDB connection error:', error);
  throw error;
}

export async function connectToDatabase() {
  try {
    client = await clientPromise;
    return client.db("fantastic");
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}