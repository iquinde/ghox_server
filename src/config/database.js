// 🔧 Configuración MongoDB + Redis para WebRTC
import mongoose from 'mongoose';
import Redis from 'ioredis';

// 🗄️ MongoDB Connection
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log('✅ MongoDB conectado para WebRTC data');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// 🚀 Redis Connection
let redisClient = null;
let redisSubscriber = null;

export async function connectRedis() {
  try {
    // Cliente principal para operaciones
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Cliente para pub/sub de presencia
    redisSubscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true
    });

    await redisClient.connect();
    await redisSubscriber.connect();

    console.log('✅ Redis conectado para cache y sesiones WebRTC');
    
    // Test básico
    await redisClient.set('webrtc:test', 'ok', 'EX', 10);
    
    return { redisClient, redisSubscriber };
  } catch (error) {
    console.warn('⚠️ Redis connection failed:', error.message);
    console.log('🔄 Continuando sin Redis cache...');
    return { redisClient: null, redisSubscriber: null };
  }
}

// 📊 Cache Keys para WebRTC
export const REDIS_KEYS = {
  // Sesiones de usuario
  USER_SESSION: (userId) => `webrtc:session:${userId}`,
  USER_PRESENCE: (userId) => `webrtc:presence:${userId}`,
  
  // Llamadas activas
  ACTIVE_CALL: (callId) => `webrtc:call:${callId}`,
  USER_CALLS: (userId) => `webrtc:calls:${userId}`,
  
  // ICE candidates cache
  ICE_CANDIDATES: (userId) => `webrtc:ice:${userId}`,
  
  // Stats y metrics
  CALL_STATS: 'webrtc:stats:calls',
  ONLINE_USERS: 'webrtc:online'
};

// 🔄 Helper functions para cache
export class WebRTCCache {
  static client = null;
  
  static setClient(client) {
    this.client = client;
  }

  // 👤 Gestión de presencia de usuario
  static async setUserOnline(userId, userData = {}) {
    if (!this.client) return false;
    
    try {
      const key = REDIS_KEYS.USER_PRESENCE(userId);
      const data = {
        userId,
        status: 'online',
        timestamp: Date.now(),
        ...userData
      };
      
      await this.client.setex(key, 300, JSON.stringify(data)); // 5 min TTL
      await this.client.sadd(REDIS_KEYS.ONLINE_USERS, userId);
      
      return true;
    } catch (error) {
      console.warn('Redis setUserOnline error:', error);
      return false;
    }
  }

  static async setUserOffline(userId) {
    if (!this.client) return false;
    
    try {
      await this.client.del(REDIS_KEYS.USER_PRESENCE(userId));
      await this.client.srem(REDIS_KEYS.ONLINE_USERS, userId);
      await this.client.del(REDIS_KEYS.USER_CALLS(userId));
      return true;
    } catch (error) {
      console.warn('Redis setUserOffline error:', error);
      return false;
    }
  }

  static async getOnlineUsers() {
    if (!this.client) return [];
    
    try {
      return await this.client.smembers(REDIS_KEYS.ONLINE_USERS);
    } catch (error) {
      console.warn('Redis getOnlineUsers error:', error);
      return [];
    }
  }

  // 📞 Gestión de llamadas
  static async storeActiveCall(callId, callData) {
    if (!this.client) return false;
    
    try {
      const key = REDIS_KEYS.ACTIVE_CALL(callId);
      const data = {
        callId,
        startTime: Date.now(),
        encrypted: true, // SRTP siempre activo
        ...callData
      };
      
      await this.client.setex(key, 3600, JSON.stringify(data)); // 1 hour TTL
      
      // Agregar a llamadas del usuario
      if (callData.from) {
        await this.client.sadd(REDIS_KEYS.USER_CALLS(callData.from), callId);
      }
      if (callData.to) {
        await this.client.sadd(REDIS_KEYS.USER_CALLS(callData.to), callId);
      }
      
      return true;
    } catch (error) {
      console.warn('Redis storeActiveCall error:', error);
      return false;
    }
  }

  static async removeActiveCall(callId) {
    if (!this.client) return false;
    
    try {
      // Obtener datos de la llamada antes de eliminar
      const callData = await this.client.get(REDIS_KEYS.ACTIVE_CALL(callId));
      
      if (callData) {
        const data = JSON.parse(callData);
        
        // Remover de llamadas de usuarios
        if (data.from) {
          await this.client.srem(REDIS_KEYS.USER_CALLS(data.from), callId);
        }
        if (data.to) {
          await this.client.srem(REDIS_KEYS.USER_CALLS(data.to), callId);
        }
      }
      
      await this.client.del(REDIS_KEYS.ACTIVE_CALL(callId));
      return true;
    } catch (error) {
      console.warn('Redis removeActiveCall error:', error);
      return false;
    }
  }

  // 📈 Estadísticas
  static async incrementCallStats() {
    if (!this.client) return;
    
    try {
      await this.client.incr(REDIS_KEYS.CALL_STATS);
    } catch (error) {
      console.warn('Redis incrementCallStats error:', error);
    }
  }

  static async getCallStats() {
    if (!this.client) return { totalCalls: 0, activeCalls: 0 };
    
    try {
      const totalCalls = await this.client.get(REDIS_KEYS.CALL_STATS) || 0;
      const activeCallKeys = await this.client.keys(REDIS_KEYS.ACTIVE_CALL('*'));
      
      return {
        totalCalls: parseInt(totalCalls),
        activeCalls: activeCallKeys.length,
        onlineUsers: (await this.getOnlineUsers()).length
      };
    } catch (error) {
      console.warn('Redis getCallStats error:', error);
      return { totalCalls: 0, activeCalls: 0 };
    }
  }

  // 🧊 ICE candidates cache (opcional)
  static async cacheICECandidate(userId, candidate) {
    if (!this.client) return false;
    
    try {
      const key = REDIS_KEYS.ICE_CANDIDATES(userId);
      await this.client.lpush(key, JSON.stringify(candidate));
      await this.client.expire(key, 60); // 1 min TTL
      return true;
    } catch (error) {
      console.warn('Redis cacheICECandidate error:', error);
      return false;
    }
  }
}

export { redisClient, redisSubscriber };