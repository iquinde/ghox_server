import { Router } from "express";
export const iceRouter = Router();

iceRouter.get("/", async (req, res) => {
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const Twilio = (await import("twilio")).default;
      const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const token = await client.tokens.create();
      return res.json({ iceServers: token.iceServers || [] });
    }

    if (process.env.TURN_URL) {
      return res.json({
        iceServers: [
          { urls: process.env.TURN_URL, username: process.env.TURN_USER || "", credential: process.env.TURN_PASS || "" }
        ]
      });
    }
    console.warn("No TURN/Twilio config found, returning enhanced public STUN/TURN servers");
    return res.json({ 
      iceServers: [
        // Múltiples servidores STUN para mejor conectividad
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        
        // Servidores STUN alternativos
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.stunprotocol.org:3478" },
        { urls: "stun:stun.ekiga.net" },
        { urls: "stun:stun.ideasip.com" },
        { urls: "stun:stun.schlund.de" },
        
        // Servidores TURN públicos para casos NAT restrictivo
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject", 
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        
        // Servidores TURN adicionales para mejor conectividad entre redes
        {
          urls: "turn:a.relay.metered.ca:80",
          username: "c6747f67ef7088cc93424ac1",
          credential: "uYSdYgb8ac9tRw6V"
        },
        {
          urls: "turn:a.relay.metered.ca:80?transport=tcp",
          username: "c6747f67ef7088cc93424ac1", 
          credential: "uYSdYgb8ac9tRw6V"
        },
        {
          urls: "turn:a.relay.metered.ca:443",
          username: "c6747f67ef7088cc93424ac1",
          credential: "uYSdYgb8ac9tRw6V"
        },
        {
          urls: "turn:a.relay.metered.ca:443?transport=tcp",
          username: "c6747f67ef7088cc93424ac1",
          credential: "uYSdYgb8ac9tRw6V"
        }
      ] 
    });
  } catch (err) {
    console.error("ice-config error:", err);
    // fallback a múltiples STUN/TURN en vez de solo uno para evitar romper clientes de prueba
    return res.json({ 
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.services.mozilla.com" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:a.relay.metered.ca:80",
          username: "c6747f67ef7088cc93424ac1",
          credential: "uYSdYgb8ac9tRw6V"
        }
      ] 
    });
  }
});