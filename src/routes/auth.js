import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { generateUserId } from "../utils/generateId.js";

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

  const user = await User.create({
    userId,
    username,
    displayName: displayName || "",
    role: "user" // <-- asigna el rol por defecto
  });

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

/**
 * POST /api/auth/login
 * body: { username }
 * Devuelve JWT si el usuario existe
 */
authRouter.post("/login", async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "username requerido" });

  const user = await User.findOne({ username });
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
