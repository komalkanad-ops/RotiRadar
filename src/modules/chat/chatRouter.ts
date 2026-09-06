import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const chatRouter = Router();

// Resolves the booking and checks the caller is a participant (its customer or its assigned cook).
// Returns { bookingId, senderRole } or null after already sending a 404 (existence is not leaked
// to non-participants).
async function participant(
  req: Request,
  res: Response,
): Promise<{ bookingId: string; senderRole: "CUSTOMER" | "COOK" } | null> {
  const { sub, role } = req.auth!;
  if (role !== "CUSTOMER" && role !== "COOK") {
    res.status(403).json({ error: "Not allowed" });
    return null;
  }
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    select: { id: true, customerId: true, cookId: true },
  });
  const owns =
    booking && ((role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub));
  if (!owns) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  return { bookingId: booking.id, senderRole: role };
}

// GET /chat/:bookingId/messages?after=<messageId> — poll for the conversation.
//   - no `after`     → the most recent 50 messages, oldest-first
//   - `after=<id>`   → every message created after that one, oldest-first (keyset paging, so it's
//                      stable even when several messages share a timestamp)
chatRouter.get("/:bookingId/messages", requireAuth, async (req, res) => {
  const p = await participant(req, res);
  if (!p) return;

  const after = typeof req.query.after === "string" ? req.query.after : undefined;

  if (!after) {
    const latest = await prisma.message.findMany({
      where: { bookingId: p.bookingId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(latest.reverse());
  }

  const cursor = await prisma.message.findUnique({ where: { id: after }, select: { createdAt: true, bookingId: true } });
  if (!cursor || cursor.bookingId !== p.bookingId) {
    return res.status(400).json({ error: "Invalid `after` cursor" });
  }
  const messages = await prisma.message.findMany({
    where: {
      bookingId: p.bookingId,
      OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: after } }],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 200,
  });
  res.json(messages);
});

const sendSchema = z.object({
  body: z.string().min(1).max(4000),
  imageUrl: z.string().url().optional(),
});

// POST /chat/:bookingId/messages — { body, imageUrl? } — senderRole is taken from the token, never
// the request.
chatRouter.post("/:bookingId/messages", requireAuth, async (req, res) => {
  const p = await participant(req, res);
  if (!p) return;

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const message = await prisma.message.create({
    data: { bookingId: p.bookingId, senderRole: p.senderRole, body: parsed.data.body, imageUrl: parsed.data.imageUrl },
  });
  res.status(201).json(message);
});

// POST /chat/:bookingId/read — marks the *other* party's unread messages as read.
chatRouter.post("/:bookingId/read", requireAuth, async (req, res) => {
  const p = await participant(req, res);
  if (!p) return;

  const other = p.senderRole === "CUSTOMER" ? "COOK" : "CUSTOMER";
  const { count } = await prisma.message.updateMany({
    where: { bookingId: p.bookingId, senderRole: other, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ marked: count });
});
