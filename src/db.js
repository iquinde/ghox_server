import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
dotenv.config();

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI no definido');

  try {
    await mongoose.connect(uri); // remove deprecated options
    console.log('MongoDB conectado');

    // Seed admin idempotente
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminUserId = process.env.ADMIN_USERID || '000000001';
    const adminDisplayName = process.env.ADMIN_DISPLAYNAME || 'Administrador';

    const admin = await User.findOne({ username: adminUsername });
    if (!admin) {
      await User.create({
        userId: adminUserId,
        username: adminUsername,
        displayName: adminDisplayName,
        role: 'admin'
      });
      console.log('🛡️ Usuario admin creado automáticamente');
    } else {
      console.log('🛡️ Usuario admin ya existe');
    }

    // Seed roles collection
    const roles = [
      { name: 'ORGANIZATION_MANAGER', description: 'ORGANIZATION_MANAGER', is_default: true },
      { name: 'ORGANIZATION_ADMIN',   description: 'ORGANIZATION_ADMIN',   is_default: true },
      { name: 'ORGANIZATION_USER',    description: 'ORGANIZATION_USER',    is_default: true }
    ];
    const rolesColl = mongoose.connection.db.collection('roles');
    for (const r of roles) {
      await rolesColl.updateOne(
        { name: r.name },
        { $setOnInsert: { ...r, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }
    console.log('✅ Roles sembrados (si no existían)');
  } catch (err) {
    console.error('Error conectando/sembrando DB:', err);
    throw err; // deja que el proceso falle y Render muestre el error en logs
  }
}