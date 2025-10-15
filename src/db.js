// ...existing code...
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI no definido');
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('MongoDB conectado');
}