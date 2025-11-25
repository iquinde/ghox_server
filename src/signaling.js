import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { WebRTCCache } from "./config/database.js";
import { Call } from "./models/Call.js";

export const userSockets = new Map(); // userId -> ws
export const activeCalls = new Map();  // callId -> {from, to, startTime}

function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// 🔒 Validar que el SDP contiene configuración SRTP/DTLS
function validateSecureSDP(sdp) {
  if (!sdp) return false;
  
  // Verificar que DTLS esté presente (requerido para SRTP)
  const hasDtls = sdp.includes('a=setup:') && sdp.includes('a=fingerprint:');
  const hasEncryption = sdp.includes('a=crypto:') || sdp.includes('DTLS');
  
  return hasDtls || hasEncryption;
}

// 🛡️ Logs de seguridad para debugging
function logSecurityStatus(type, data, fromId) {
  if (type === 'offer' || type === 'answer') {
    const isSecure = validateSecureSDP(data.sdp);
    console.log(`🔒 ${type.toUpperCase()} de ${fromId}: ${isSecure ? '✅ SRTP/DTLS' : '⚠️ No cifrado'}`);
  }
}

export function initSignaling(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) throw new Error("Token requerido");

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = payload;
      
      userSockets.set(payload.userId, ws);
      console.log(`🔗 Usuario conectado: ${payload.userId}`);

      // 🚀 Registrar en Redis cache
      await WebRTCCache.setUserOnline(payload.userId, {
        displayName: payload.displayName || payload.username,
        connectedAt: new Date().toISOString()
      });

      // Enviar confirmación de conexión segura
      ws.send(JSON.stringify({
        type: "connected",
        userId: payload.userId,
        encryption: "🔒 WebRTC SRTP activo",
        storage: "📊 MongoDB + Redis",
        timestamp: new Date().toISOString()
      }));

      // 👥 Enviar lista de usuarios online (desde Redis)
      const onlineUsers = await WebRTCCache.getOnlineUsers();
      ws.send(JSON.stringify({
        type: "online-users",
        users: onlineUsers.filter(id => id !== payload.userId),
        count: onlineUsers.length - 1
      }));

    } catch (err) {
      console.warn("❌ Auth failed:", err.message);
      try { ws.close(4001, "unauthorized"); } catch {}
      return;
    }

    ws.on("message", async (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return ws.send(JSON.stringify({ type: "error", message: "JSON inválido" }));
      }

      const type = data.type;
      const fromId = ws.user?.userId;

      // 🔒 Intercambio WebRTC con validación de seguridad
      if (["offer", "answer", "ice"].includes(type)) {
        const targetWs = userSockets.get(data.to);
        
        if (!targetWs || targetWs.readyState !== targetWs.OPEN) {
          return ws.send(JSON.stringify({ type: "peer-offline", to: data.to }));
        }

        // Log de seguridad
        logSecurityStatus(type, data, fromId);

        // Cache ICE candidates en Redis (opcional)
        if (type === 'ice') {
          await WebRTCCache.cacheICECandidate(data.to, data.candidate);
        }

        // Reenviar mensaje con validación
        const secureMessage = { 
          ...data, 
          from: fromId,
          encrypted: type === 'offer' || type === 'answer' ? validateSecureSDP(data.sdp) : true,
          timestamp: new Date().toISOString()
        };

        targetWs.send(JSON.stringify(secureMessage));
        return;
      }

      // 📞 Iniciación de llamada
      if (type === "call-invite") {
        const { to, callType = "audio" } = data;
        const callId = generateCallId();
        
        try {
          // 📊 Guardar en MongoDB
          const call = new Call({
            callId,
            from: fromId,
            to,
            callType,
            status: "ringing",
            encrypted: true, // SRTP siempre activo
            startedAt: new Date()
          });
          await call.save();

          // ⚡ Cache en Redis
          await WebRTCCache.storeActiveCall(callId, { from: fromId, to, callType });
          await WebRTCCache.incrementCallStats();
          
          activeCalls.set(callId, {
            from: fromId,
            to,
            callType,
            startTime: Date.now(),
            status: "ringing"
          });

          const targetWs = userSockets.get(to);
          if (!targetWs || targetWs.readyState !== targetWs.OPEN) {
            // Usuario offline, actualizar estado
            call.status = "missed";
            call.endedAt = new Date();
            await call.save();
            
            await WebRTCCache.removeActiveCall(callId);
            activeCalls.delete(callId);
            
            return ws.send(JSON.stringify({ type: "user-offline", to }));
          }

          targetWs.send(JSON.stringify({
            type: "incoming-call",
            callId,
            from: fromId,
            callType,
            encryption: "🔒 SRTP habilitado",
            timestamp: new Date().toISOString()
          }));

          console.log(`📞 Llamada ${callId}: ${fromId} -> ${to} (${callType}) [MongoDB + Redis]`);
          
        } catch (error) {
          console.error("❌ Error guardando llamada:", error);
          ws.send(JSON.stringify({ type: "error", message: "Error iniciando llamada" }));
        }
        return;
      }

      // ✅ Aceptar llamada
      if (type === "call-accept") {
        const { callId } = data;
        
        try {
          // Actualizar MongoDB
          const call = await Call.findOne({ callId });
          if (call) {
            call.status = "accepted";
            call.acceptedAt = new Date();
            await call.save();
          }

          // Actualizar cache
          const callData = activeCalls.get(callId);
          if (!callData) {
            return ws.send(JSON.stringify({ type: "call-not-found", callId }));
          }

          callData.status = "accepted";
          const originWs = userSockets.get(callData.from);
          
          if (originWs && originWs.readyState === originWs.OPEN) {
            originWs.send(JSON.stringify({ 
              type: "call-accepted", 
              callId,
              encryption: "🔒 Canal seguro establecido",
              storage: "📊 Guardado en MongoDB"
            }));
          }

          console.log(`✅ Llamada aceptada: ${callId} [Persistida]`);
          
        } catch (error) {
          console.error("❌ Error aceptando llamada:", error);
        }
        return;
      }

      // ❌ Rechazar llamada
      if (type === "call-reject") {
        const { callId } = data;
        
        try {
          // Actualizar MongoDB
          const call = await Call.findOne({ callId });
          if (call) {
            call.status = "rejected";
            call.endedAt = new Date();
            await call.save();
          }

          // Limpiar cache
          await WebRTCCache.removeActiveCall(callId);
          const callData = activeCalls.get(callId);
          
          if (callData) {
            activeCalls.delete(callId);
            const originWs = userSockets.get(callData.from);
            
            if (originWs && originWs.readyState === originWs.OPEN) {
              originWs.send(JSON.stringify({ type: "call-rejected", callId }));
            }
          }

          console.log(`❌ Llamada rechazada: ${callId} [Persistida]`);
          
        } catch (error) {
          console.error("❌ Error rechazando llamada:", error);
        }
        return;
      }

      // 📲 Finalizar llamada
      if (type === "call-end") {
        const { callId, to } = data;
        
        try {
          // Actualizar MongoDB con duración
          const call = await Call.findOne({ callId });
          if (call) {
            call.status = "completed";
            call.endedAt = new Date();
            call.duration = Math.round((call.endedAt - call.startedAt) / 1000); // segundos
            await call.save();
          }

          // Limpiar cache
          await WebRTCCache.removeActiveCall(callId);
          const callData = activeCalls.get(callId);
          
          if (callData) {
            const duration = ((Date.now() - callData.startTime) / 1000).toFixed(1);
            console.log(`📲 Llamada finalizada: ${callId} (${duration}s) [Guardada]`);
            activeCalls.delete(callId);
          }

          const otherWs = userSockets.get(to);
          if (otherWs && otherWs.readyState === otherWs.OPEN) {
            otherWs.send(JSON.stringify({ type: "call-ended", callId }));
          }
          
        } catch (error) {
          console.error("❌ Error finalizando llamada:", error);
        }
        return;
      }

      // 💓 Keepalive con Redis
      if (type === "ping") {
        await WebRTCCache.setUserOnline(fromId); // Renovar TTL en Redis
        ws.send(JSON.stringify({ 
          type: "pong", 
          timestamp: Date.now(),
          cache: "Redis TTL renovado"
        }));
        return;
      }

      // 📊 Solicitar estadísticas
      if (type === "get-stats") {
        const stats = await WebRTCCache.getCallStats();
        ws.send(JSON.stringify({
          type: "stats-response",
          ...stats,
          redisCache: true,
          mongoStorage: true
        }));
        return;
      }
    });

    ws.on("close", async () => {
      if (ws.user?.userId) {
        const userId = ws.user.userId;
        userSockets.delete(userId);
        
        // 🚀 Limpiar presencia de Redis
        await WebRTCCache.setUserOffline(userId);
        
        // Terminar llamadas activas del usuario
        const userCalls = Array.from(activeCalls.entries())
          .filter(([_, call]) => call.from === userId || call.to === userId);

        for (const [callId, call] of userCalls) {
          try {
            // Actualizar MongoDB
            const dbCall = await Call.findOne({ callId });
            if (dbCall) {
              dbCall.status = "interrupted";
              dbCall.endedAt = new Date();
              await dbCall.save();
            }

            // Notificar al otro usuario
            const otherUserId = call.from === userId ? call.to : call.from;
            const otherWs = userSockets.get(otherUserId);
            
            if (otherWs && otherWs.readyState === otherWs.OPEN) {
              otherWs.send(JSON.stringify({ 
                type: "call-ended", 
                callId, 
                reason: "user-disconnected" 
              }));
            }
            
            // Limpiar cache
            await WebRTCCache.removeActiveCall(callId);
            activeCalls.delete(callId);
            console.log(`📲 Llamada ${callId} interrumpida por desconexión [Persistida]`);
            
          } catch (error) {
            console.error("❌ Error limpiando llamada:", error);
          }
        }
        
        console.log(`🔌 Usuario desconectado: ${userId} [Cache limpiado]`);
      }
    });

    ws.on("error", (err) => {
      console.warn("⚠️ WebSocket error:", err.message);
    });
  });

  console.log("🚀 Señalización WebRTC iniciada - MongoDB + Redis + SRTP");
}

// Helper: Notificar usuario por WebSocket
export function notifyUser(userId, payload) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn("❌ Error notificando usuario:", e);
    }
  }
  return false;
}

// Helper: Estadísticas combinadas (Redis + MongoDB + Memoria)
export async function getCallStats() {
  try {
    // Stats de Redis (cache rápido)
    const redisStats = await WebRTCCache.getCallStats();
    
    // Stats de memoria local
    const memoryStats = {
      activeConnections: userSockets.size,
      activeCallsMemory: activeCalls.size
    };

    return {
      ...redisStats,
      ...memoryStats,
      storage: "MongoDB + Redis",
      encrypted: true // SRTP siempre activo
    };
  } catch (error) {
    console.warn("❌ Error obteniendo stats:", error);
    return {
      activeCalls: activeCalls.size,
      connectedUsers: userSockets.size,
      storage: "Solo memoria",
      encrypted: true
    };
  }
}