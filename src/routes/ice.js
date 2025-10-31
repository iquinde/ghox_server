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

    return res.json({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  } catch (err) {
    console.error("ice-config error:", err);
    // fallback a STUN público en vez de 500 para evitar romper clientes de prueba
    return res.json({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  }
});