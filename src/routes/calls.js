import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { Call } from "../models/Call.js";

export const callsRouter = Router();

/**
 * POST /api/calls/start
 * body: { to: "<userId>", meta: { ... } }
 * Crea registro de llamada y devuelve callId.
 */
callsRouter.post("/start", authMiddleware, async (req, res) => {
  try {
    const from = req.user.userId;
    const { to, meta } = req.body;
    if (!to) return res.status(400).json({ error: "missing 'to' field" });

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const call = await Call.create({
      callId,
      from,
      to,
      status: "ringing",
      meta: meta || {},
    });

    // Nota: la notificación en tiempo real al peer debe hacerse por WebSocket (señalización).
    // Si quieres que el servidor notifique al peer desde aquí, exponemos la map userSockets
    // o una función notifyPeer en src/signaling.js. Por ahora devolvemos callId.
    return res.status(201).json({ callId, call });
  } catch (err) {
    console.error("calls/start error:", err);
    return res.status(500).json({ error: "failed to start call" });
  }
});