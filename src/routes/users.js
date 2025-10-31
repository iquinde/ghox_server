import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const usersRouter = Router();

/** GET /api/users/me */
usersRouter.get("/me", authMiddleware, async (req, res) => {
  const u = await User.findOne({ userId: req.user.userId }).lean();
  if (!u) return res.status(404).json({ error: "user not found" });
  res.json({ id: u.userId, username: u.username, displayName: u.displayName });
});

/** POST /api/users/find
 * body: { usernames: ["israel_q","ghostman"] }
 * Devuelve los usuarios que existen
 */
usersRouter.post("/find", authMiddleware, async (req, res) => {
  const { usernames } = req.body || {};
  if (!Array.isArray(usernames) || !usernames.length) {
    return res.status(400).json({ error: "usernames requerido" });
  }
  const users = await User.find({ username: { $in: usernames } }, { userId: 1, username: 1, displayName: 1 }).lean();
  res.json({ found: users });
});

/** GET /api/users
 * Devuelve todos los usuarios (solo campos públicos)
 */
usersRouter.get("/", authMiddleware, async (req, res) => {
  // exclude the current user and the admin user (if ADMIN_USERNAME is set)
  const filter = { userId: { $ne: req.user.userId } };
  if (process.env.ADMIN_USERNAME) {
    filter.username = { $ne: process.env.ADMIN_USERNAME };
  }

  const users = await User.find(filter, { userId: 1, username: 1, displayName: 1 }).lean();
  res.json({ users });
});

/** GET /api/users/:id
 * Devuelve un usuario público por userId
 */
usersRouter.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "id requerido" });

  const u = await User.findOne(
    { userId: id },
    { userId: 1, username: 1, displayName: 1 }
  ).lean();

  if (!u) return res.status(404).json({ error: "user not found" });

  res.json({ user: { id: u.userId, username: u.username, displayName: u.displayName } });
});