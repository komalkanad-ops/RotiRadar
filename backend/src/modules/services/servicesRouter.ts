import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin } from "../../middleware/auth.js";

// Reference module — the shape every other domain module follows (one router file, zod on input,
// lazy prisma, requireAdmin on writes). The service catalog holds the three pricing tiers.
export const servicesRouter = Router();

servicesRouter.get("/", async (_req, res) => {
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { basePricePaise: "asc" } });
  res.json(services);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  basePricePaise: z.number().int().positive().optional(),
  minMinutes: z.number().int().positive().optional(),
  maxMinutes: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

servicesRouter.patch("/:tier", requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const tier = req.params.tier as "BASIC" | "SABJI" | "FULL_MEAL";
  const service = await prisma.service.update({ where: { tier }, data: parsed.data });
  res.json(service);
});
