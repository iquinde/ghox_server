import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { iceRouter } from "./routes/ice.js";
import { callsRouter } from "./routes/calls.js";
import { presenceRouter } from "./routes/presence.js";
import http from "http";
import { initSignaling } from "./signaling.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/ice-config", iceRouter); // Para compatibilidad con cliente web existente
app.use("/api/ice", iceRouter);        // Para cliente Flutter
app.use("/api/calls", callsRouter);
app.use("/api/presence", presenceRouter);

// Swagger/OpenAPI
const swaggerDocument = YAML.load("./docs/openapi.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const server = http.createServer(app);
initSignaling(server);

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => console.log(`API escuchando en http://0.0.0.0:${PORT}`));
});