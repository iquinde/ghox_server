import express from "express";
import mongoose from "mongoose";
import { Request } from "../models/Request.js";
import { authMiddleware } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = express.Router();

router.post("/",authMiddleware, async (req, res) => {
  try {
    const { to, meta } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Campos 'to' son requeridos" });
    }
    // 👇 el "from" viene del token, no del body
    const from = req.user.userId;

        // 🔎 Validar si ya existe una solicitud pendiente entre from y to
    const existingRequest = await Request.findOne({
      from,
      to,
      status: { $in: ["pending", "accepted"] }, 
    });

    if (existingRequest) {
      return res.status(400).json({
        error: "Ya existe una solicitud activa para este usuario",
      });
    }

    const newRequest = new Request({
      from,
      to,
      meta,
    });

    await newRequest.save();

    // 👇 Ajustamos la respuesta al esquema de Swagger
    res.status(201).json({ request: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { direction, status } = req.query;
    const userId = req.user.userId;

    // Construimos el filtro dinámico
    const filter = {};

    if (direction === "incoming") {
      filter.to = userId;
    } else if (direction === "outgoing") {
      filter.from = userId;
    } else {
      // Si no se especifica direction, traemos ambos
      filter.$or = [{ to: userId }, { from: userId }];
    }

    if (status) {
      filter.status = status;
    }

    const requests = await Request.find(filter).lean();

    // Buscar usuarios relacionados
    const userIds = [...requests.map(r => r.from), ...requests.map(r => r.to)];
    const users = await User.find({ userId: { $in: userIds } }).lean();

    const usersMap = Object.fromEntries(users.map(u => [u.userId, u]));

    const enriched = requests.map(r => ({
      ...r,
      from: usersMap[r.from],
      to: usersMap[r.to],
    }));

    res.json({ requests : enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

        // Validar que el string sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de solicitud inválido" });
    }

    // Validar estado permitido
    const allowedStatuses = ["accepted", "rejected", "cancelled", "pending"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    // Buscar la solicitud
    const request = await Request.findById(id);
    if (!request) {
      return res.status(400).json({ error: "Solicitud no encontrada" });
    }

    if ((status !== "pending" || status !== "cancelled" ) && request.to !== userId) {
      return res.status(403).json({ error: "No tienes permiso para actualizar esta solicitud, solo el receptor puede aceptar/rechazar" });
    }

    if (status == "cancelled" && request.from !== userId) {
      return res.status(403).json({ error: "No tienes permiso para actualizar esta solicitud, solo el emisor la puede cancelar" });
    }

    // Actualizar estado
    request.status = status;
    await request.save();

    res.json({ request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export const requestsRouter = router;