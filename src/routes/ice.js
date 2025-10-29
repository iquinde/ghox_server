import { Router } from "express";
import Twilio from "twilio";
export const iceRouter = Router();

iceRouter.get("/", async (req, res) => {
  try {
    // Si hay credenciales Twilio, pedir iceServers dinámicos
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) {
      const client = Twilio(sid, token);
      // crea un token de red que devuelve iceServers
      const resp = await client.tokens.create();
      // resp.iceServers es un array con STUN/TURN de Twilio
      return res.json({ iceServers: resp.iceServers || [] });
    }

    // Si tienes TURN estático en env, devolverlo
    if (process.env.TURN_URL) {
      return res.json({
        iceServers: [
          {
            urls: process.env.TURN_URL,
            username: process.env.TURN_USER || "",
            credential: process.env.TURN_PASS || "",
          },
        ],
      });
    }

    // Fallback: STUN público
    return res.json({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  } catch (err) {
    console.error("ice-config error:", err);
    return res.status(500).json({ error: "failed to get ice servers" });
  }
});