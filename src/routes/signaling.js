import { Server } from "socket.io";

export function initSignaling(server) {
  console.log("Iniciando señalización WebSocket con Socket.IO");
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    // Recibir oferta SDP
    socket.on("offer", (data) => {
      console.log("Oferta recibida:", data);
      socket.broadcast.emit("offer", data);
    });

    // Recibir respuesta SDP
    socket.on("answer", (data) => {
      console.log("Respuesta recibida:", data);
      socket.broadcast.emit("answer", data);
    });

    // Recibir ICE candidates
    socket.on("candidate", (data) => {
      console.log("Candidate recibido:", data);
      socket.broadcast.emit("candidate", data);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  return io; // opcional, si quieres usar io en otros módulos
}