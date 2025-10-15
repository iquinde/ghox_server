import { WebSocketServer } from "ws";

export function initSignaling(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  const idToSocket = new Map();

  wss.on("connection", (ws) => {
    let myId = null;

    ws.on("message", (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return; }

      if (data.type === "register" && data.userId) {
        myId = data.userId;
        idToSocket.set(myId, ws);
        ws.send(JSON.stringify({ type: "registered", userId: myId }));
        return;
      }

      if (["offer", "answer", "ice"].includes(data.type)) {
        const dest = idToSocket.get(data.to);
        if (dest && dest.readyState === 1) {
          data.from = myId;
          dest.send(JSON.stringify(data));
        } else {
          ws.send(JSON.stringify({ type: "delivery_failed", to: data.to }));
        }
      }
    });

    ws.on("close", () => {
      if (myId) idToSocket.delete(myId);
    });
  });

  console.log("✅ WebSocket signaling activo con IDs");
}
