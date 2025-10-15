import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import http from "http";
import { initSignaling } from "./signaling.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

const server = http.createServer(app);
initSignaling(server);

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => console.log(`API escuchando en http://0.0.0.0:${PORT}`));
});