import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { generateUserId , generateDeviceId} from "../utils/generateId.js";

export const authRouter = Router();

/**
 * POST /api/auth/register
 * body: { username, displayName? }
 * Crea un usuario nuevo con un ID único de 9 dígitos
 */
authRouter.post("/register", async (req, res) => {
  const { username, displayName } = req.body || {};
  if (!username) return res.status(400).json({ error: "username requerido" });

  // validar que no exista username
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ error: "username ya en uso" });

  const userId = generateUserId();
  const deviceId = generateDeviceId();

  const token = jwt.sign(
    { userId: userId, username: username },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const user = await User.create({
    userId,
    username,
    displayName: displayName || "",
    sessionToken: token,
    deviceId: deviceId,//req.body.deviceId || "",
    role: "user" // <-- asigna el rol por defecto
  });

  res.json({
    token,
    user: { id: user.userId, username: user.username, displayName: user.displayName, deviceId: user.deviceId, sessionToken: user.sessionToken , role: user.role }
  });
});

/**
 * POST /api/auth/login
 * body: { username }
 * Devuelve JWT si el usuario existe
 */
authRouter.post("/login", async (req, res) => {
  const { username , deviceId } = req.body || {};
  if (!username) return res.status(400).json({ error: "username requerido" });

  if (!deviceId) return res.status(400).json({ error: "deviceId requerido" });

  const user = await User.findOne({ username, deviceId });
  if (!user) return res.status(404).json({ error: "usuario no encontrado" });

  const token = jwt.sign(
    { userId: user.userId, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    user: { id: user.userId, username: user.username, displayName: user.displayName }
  });
});
