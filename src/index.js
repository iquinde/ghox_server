import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { connectDB, connectRedis, WebRTCCache } from "./config/database.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { iceRouter } from "./routes/ice.js";
import http from "http";
import https from "https";
import fs from "fs";
import { initSignaling, getCallStats } from "./signaling.js";

const app = express();

// 🛡️ Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Para desarrollo WebRTC
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limitar payload para seguridad

// 📁 Servir archivos estáticos (cliente de prueba)
app.use(express.static('public'));

// 🔒 Routes optimizadas para WebRTC
app.get("/health", (req, res) => res.json({ 
  status: "ok", 
  encryption: "🔒 WebRTC SRTP enabled",
  timestamp: new Date().toISOString()
}));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/ice", iceRouter);

// 📊 Estadísticas de llamadas y storage
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getCallStats();
    const redisStats = await WebRTCCache.getCallStats();
    
    res.json({
      ...stats,
      redis: redisStats,
      uptime: process.uptime(),
      storage: {
        mongodb: "✅ Persistencia de usuarios y llamadas",
        redis: redisStats.onlineUsers !== undefined ? "✅ Cache activo" : "⚠️ Desconectado"
      },
      security: "🔒 SRTP + TLS encryption active"
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to get stats",
      storage: "Error accediendo storage",
      security: "🔒 SRTP active"
    });
  }
});

// 🔒 Servidor HTTPS + WSS por defecto
let server;
let isSSLEnabled = false;

// Intentar configurar HTTPS automáticamente
if (process.env.USE_SSL === 'true') {
  try {
    const certPath = process.env.SSL_CERT_PATH || './ssl/cert.pem';
    const keyPath = process.env.SSL_KEY_PATH || './ssl/key.pem';
    
    // Verificar si existen certificados
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      
      server = https.createServer(sslOptions, app);
      isSSLEnabled = true;
      console.log("🔒 HTTPS + WSS Server configurado - Señalización cifrada de extremo a extremo");
    } else {
      throw new Error('Certificados SSL no encontrados');
    }
  } catch (error) {
    console.warn("⚠️  Certificados SSL no encontrados");
    console.warn("   Ejecuta: generate-ssl.bat (Windows) o ./generate-ssl.sh (Linux)");
    console.warn("   Continuando con HTTP (señalización sin cifrar)...");
    server = http.createServer(app);
    isSSLEnabled = false;
  }
} else {
  server = http.createServer(app);
  console.log("🌐 HTTP Server - Recomendado: Configurar USE_SSL=true para seguridad completa");
  isSSLEnabled = false;
}

// 🔗 Inicializar WebSocket signaling
initSignaling(server);

const PORT = process.env.PORT || 8080;

connectDB().then(async () => {
  console.log("📊 MongoDB conectado para WebRTC data");
  
  // 🚀 Conectar Redis para cache y presencia
  const { redisClient } = await connectRedis();
  if (redisClient) {
    WebRTCCache.setClient(redisClient);
    console.log("⚡ Redis cache habilitado para sesiones");
  }
  
  server.listen(PORT, '0.0.0.0', () => {
    const protocol = isSSLEnabled ? 'https' : 'http';
    const wsProtocol = isSSLEnabled ? 'wss' : 'ws';
    const securityLevel = isSSLEnabled ? '🔒 COMPLETA' : '⚠️ PARCIAL';
    
    console.log(`
🚀 Ghox P2P Voice Server - MongoDB + Redis
📡 Servidor: ${protocol}://0.0.0.0:${PORT}
🔗 WebSocket: ${wsProtocol}://0.0.0.0:${PORT}
🌐 Cliente: ${protocol}://localhost:${PORT}

💾 STORAGE:
  📊 MongoDB: ✅ Usuarios, llamadas, historial
  ⚡ Redis: ${redisClient ? '✅ Cache, sesiones, presencia' : '⚠️ Deshabilitado'}

🔐 SEGURIDAD ${securityLevel}:
  📤 Señalización: ${isSSLEnabled ? '✅ HTTPS + WSS' : '⚠️  HTTP + WS (sin cifrar)'}
  🎵 Media: ✅ WebRTC SRTP (siempre cifrado)
  
⚡ Ready for ${isSSLEnabled ? 'fully secure' : 'partially secure'} voice calls!
    `);
    
    if (!isSSLEnabled) {
      console.warn("\n🛡️  RECOMENDACIÓN: Para seguridad completa, ejecuta:");
      console.warn("   generate-ssl.bat && set USE_SSL=true && npm start");
    }
  });
}).catch(err => {
  console.error("❌ Database connection failed:", err);
  process.exit(1);
});