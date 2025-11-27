import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { Call } from "./models/Call.js";

export const userSockets = new Map(); // userId -> ws

function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function initSignaling(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    // Expect token as query param: wss://.../?token=JWT
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) throw new Error("missing token");

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = payload;
      userSockets.set(payload.userId, ws);

      console.log("WS connected:", payload.userId);
    } catch (err) {
      console.warn("WS auth failed:", err.message);
      try { ws.close(4001, "unauthorized"); } catch {}
      return;
    }

    ws.on("message", async (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const type = data.type;
      const fromId = ws.user?.userId;

      // Forward SDP/ICE to target if connected
      if (["offer", "answer", "ice"].includes(type)) {
        const targetWs = userSockets.get(data.to);
        if (targetWs && targetWs.readyState === targetWs.OPEN) {
          targetWs.send(JSON.stringify({ ...data, from: fromId }));
        } else {
          ws.send(JSON.stringify({ type: "peer-offline", to: data.to }));
        }
        return;
      }

      if (type === "call-init") {
        const to = data.to;
        const callId = generateCallId();
        const call = await Call.create({
          callId,
          from: fromId,
          to,
          status: "ringing",
          meta: data.meta || {},
        });

        const targetWs = userSockets.get(to);
        if (targetWs && targetWs.readyState === targetWs.OPEN) {
          targetWs.send(
            JSON.stringify({
              type: "incoming-call",
              callId,
              from: fromId,
              meta: data.meta || {},
            })
          );
        } else {
          await Call.findByIdAndUpdate(call._id, {
            status: "missed",
            endedAt: new Date(),
          });
          ws.send(JSON.stringify({ type: "call-missed", callId }));
        }
        return;
      }

      if (type === "call-accept") {
        const { callId } = data;
        await Call.findOneAndUpdate({ callId }, { status: "in_call", startedAt: new Date() });
        const originWs = userSockets.get(data.from);
        if (originWs && originWs.readyState === originWs.OPEN) {
          originWs.send(JSON.stringify({ type: "call-accepted", callId }));
        }
        return;
      }

      if (type === "call-reject") {
        const { callId } = data;
        await Call.findOneAndUpdate({ callId }, { status: "rejected", endedAt: new Date() });
        const originWs = userSockets.get(data.from);
        if (originWs && originWs.readyState === originWs.OPEN) {
          originWs.send(JSON.stringify({ type: "call-reject", callId }));
        }
        return;
      }

      if (type === "hangup") {
        const { callId, to } = data;
        await Call.findOneAndUpdate({ callId }, { status: "ended", endedAt: new Date() });
        const otherWs = userSockets.get(to);
        if (otherWs && otherWs.readyState === otherWs.OPEN) {
          otherWs.send(JSON.stringify({ type: "hangup", callId }));
        }
        return;
      }

      // ignore unknown types
    });

    ws.on("close", () => {
      if (ws.user?.userId) {
        userSockets.delete(ws.user.userId);
        console.log("WS disconnected:", ws.user.userId);
      }
    });

    ws.on("error", (err) => {
      console.warn("WS error", err);
    });
  });

  console.log("✅ WebSocket signaling inicializado");
}

// notifyUser helper (WebSocket)
export function notifyUser(userId, payload) {
  const ws = userSockets.get(userId);
  if (!ws) return false;
  try {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
  } catch (e) {
    console.warn("notifyUser error", e);
  }
  return false;
}