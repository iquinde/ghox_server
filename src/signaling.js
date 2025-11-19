import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { Call } from "./models/Call.js";

export const userSockets = new Map(); // userId -> ws
export const userPresence = new Map(); // userId -> { status, lastSeen, displayName }

function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Broadcast presence change to all connected users
function broadcastPresenceUpdate(userId, status, displayName) {
  const presenceUpdate = {
    type: "presence-update",
    userId,
    status, // 'online' | 'offline'
    displayName,
    timestamp: new Date().toISOString()
  };

  userSockets.forEach((ws, connectedUserId) => {
    if (connectedUserId !== userId && ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(presenceUpdate));
      } catch (e) {
        console.warn("Failed to send presence update", e);
      }
    }
  });
}

export function initSignaling(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) throw new Error("missing token");

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = payload;
      
      // Store socket and presence
      userSockets.set(payload.userId, ws);
      userPresence.set(payload.userId, {
        status: 'online',
        lastSeen: new Date(),
        displayName: payload.displayName || payload.username || 'Unknown'
      });

      console.log("WS connected:", payload.userId);
      
      // Broadcast that user came online
      broadcastPresenceUpdate(payload.userId, 'online', payload.displayName || payload.username);

      // Send current online users to the newly connected user
      const onlineUsers = Array.from(userPresence.entries())
        .filter(([userId, presence]) => presence.status === 'online' && userId !== payload.userId)
        .map(([userId, presence]) => ({
          userId,
          status: presence.status,
          displayName: presence.displayName,
          lastSeen: presence.lastSeen
        }));

      ws.send(JSON.stringify({
        type: "presence-list",
        users: onlineUsers
      }));

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

      // Handle presence updates (optional - for explicit status changes)
      if (type === "presence-update") {
        const status = data.status; // 'online' | 'away' | 'busy'
        if (userPresence.has(fromId)) {
          userPresence.get(fromId).status = status;
          broadcastPresenceUpdate(fromId, status, userPresence.get(fromId).displayName);
        }
        return;
      }

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

      // Call lifecycle
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
          originWs.send(JSON.stringify({ type: "call-rejected", callId }));
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
    });

    ws.on("close", () => {
      if (ws.user?.userId) {
        const userId = ws.user.userId;
        userSockets.delete(userId);
        
        // Update presence to offline
        if (userPresence.has(userId)) {
          userPresence.get(userId).status = 'offline';
          userPresence.get(userId).lastSeen = new Date();
        }
        
        console.log("WS disconnected:", userId);
        
        // Broadcast that user went offline
        broadcastPresenceUpdate(userId, 'offline', userPresence.get(userId)?.displayName);
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

// Get current presence info
export function getPresenceInfo() {
  return Array.from(userPresence.entries()).map(([userId, presence]) => ({
    userId,
    status: presence.status,
    displayName: presence.displayName,
    lastSeen: presence.lastSeen
  }));
}