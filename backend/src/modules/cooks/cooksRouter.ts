import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

export const cooksRouter = Router();

// CSV-stored list fields (schema comment: "comma-separated") — split/join at the boundary so the
// API always deals in real arrays.
function toCsv(values: string[] | undefined): string | undefined {
  return values ? values.join(",") : undefined;
}
function fromCsv(csv: string): string[] {
  return csv ? csv.split(",").filter(Boolean) : [];
}

function serializeCook(cook: {
  id: string;
  phone: string;
  name: string;
  gender: string | null;
  dob: Date | null;
  languages: string;
  experienceYrs: number;
  photoUrl: string | null;
  bio: string | null;
  status: string;
  baseLat: number | null;
  baseLng: number | null;
  radiusKm: number;
  localities: string;
  bankAccount: string | null;
  bankIfsc: string | null;
  upiId: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
}) {
  return { ...cook, languages: fromCsv(cook.languages), localities: fromCsv(cook.localities) };
}

// ─── Cook's own profile ───────────────────────────────────────────────────────────

function requireCook(req: import("express").Request, res: import("express").Response): string | null {
  if (req.auth?.role !== "COOK") {
    res.status(403).json({ error: "Cook access required" });
    return null;
  }
  return req.auth.sub;
}

// GET /cooks/me — the cook's own full profile, plus documents/offerings/availability.
cooksRouter.get("/me", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const cook = await prisma.cook.findUnique({
    where: { id: cookId },
    include: { documents: true, offerings: true, availability: true },
  });
  if (!cook) return res.status(404).json({ error: "Not found" });

  const { documents, offerings, availability, ...profile } = cook;
  res.json({ ...serializeCook(profile), documents, offerings, availability });
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  gender: z.string().max(30).optional(),
  dob: z.string().datetime().optional(),
  languages: z.array(z.string().min(1)).optional(),
  experienceYrs: z.number().int().min(0).max(60).optional(),
  photoUrl: z.string().url().optional(),
  bio: z.string().max(2000).optional(),
  baseLat: z.number().min(-90).max(90).optional(),
  baseLng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().int().min(1).max(50).optional(),
  localities: z.array(z.string().min(1)).optional(),
  bankAccount: z.string().max(34).optional(),
  bankIfsc: z.string().max(11).optional(),
  upiId: z.string().max(60).optional(),
});

// PATCH /cooks/me — update the cook's own profile. `phone` and `status` are never editable here —
// phone is the login identity, status is admin-controlled (KYC below).
cooksRouter.patch("/me", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { languages, localities, dob, ...rest } = parsed.data;

  const cook = await prisma.cook.update({
    where: { id: cookId },
    data: {
      ...rest,
      ...(dob !== undefined ? { dob: new Date(dob) } : {}),
      ...(languages !== undefined ? { languages: toCsv(languages) } : {}),
      ...(localities !== undefined ? { localities: toCsv(localities) } : {}),
    },
  });
  res.json(serializeCook(cook));
});

// ─── KYC documents ────────────────────────────────────────────────────────────────

const addDocumentSchema = z.object({
  type: z.enum(["AADHAAR", "PAN", "POLICE_VERIFICATION", "PHOTO"]),
  fileUrl: z.string().url(),
});

// POST /cooks/me/documents — { type, fileUrl } — records a KYC document for admin review.
// `fileUrl` assumes the file was already uploaded elsewhere (object storage) — this module doesn't
// handle the upload itself.
cooksRouter.post("/me/documents", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const parsed = addDocumentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const doc = await prisma.cookDocument.create({ data: { cookId, ...parsed.data } });
  res.status(201).json(doc);
});

// GET /cooks/me/documents — the cook's own uploaded documents and their review status.
cooksRouter.get("/me/documents", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const documents = await prisma.cookDocument.findMany({ where: { cookId }, orderBy: { createdAt: "desc" } });
  res.json(documents);
});

// ─── Service offerings ────────────────────────────────────────────────────────────

const upsertOfferingSchema = z.object({
  tier: z.enum(["BASIC", "SABJI", "FULL_MEAL"]),
  // TODO(product): schema.prisma documents this as "within admin-defined bounds for the tier",
  // but no such bounds exist yet (AppConfig has no per-tier min/max key) — only sanity-checked as
  // a positive integer until that policy is decided.
  ratePaise: z.number().int().positive(),
  veg: z.boolean().optional(),
  nonVeg: z.boolean().optional(),
  cuisines: z.array(z.string().min(1)).optional(),
});

// POST /cooks/me/offerings — { tier, ratePaise, veg?, nonVeg?, cuisines? } — create or replace the
// cook's offering for one tier (CookServiceOffering is unique on [cookId, tier]).
cooksRouter.post("/me/offerings", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const parsed = upsertOfferingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { tier, cuisines, ...rest } = parsed.data;

  const offering = await prisma.cookServiceOffering.upsert({
    where: { cookId_tier: { cookId, tier } },
    create: { cookId, tier, cuisines: toCsv(cuisines) ?? "", ...rest },
    update: { ...rest, ...(cuisines !== undefined ? { cuisines: toCsv(cuisines) } : {}) },
  });
  res.json({ ...offering, cuisines: fromCsv(offering.cuisines) });
});

// GET /cooks/me/offerings — the cook's own offerings across all tiers.
cooksRouter.get("/me/offerings", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const offerings = await prisma.cookServiceOffering.findMany({ where: { cookId } });
  res.json(offerings.map((o) => ({ ...o, cuisines: fromCsv(o.cuisines) })));
});

// ─── Weekly availability ──────────────────────────────────────────────────────────

const availabilitySlotSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
  })
  .refine((s) => s.endMin > s.startMin, { message: "endMin must be after startMin" });

const setAvailabilitySchema = z.object({ slots: z.array(availabilitySlotSchema).max(28) });

// POST /cooks/me/availability — { slots: [{ weekday, startMin, endMin }] } — replaces the cook's
// entire weekly recurring schedule (no per-slot IDs are client-managed, so a full replace is the
// simplest correct semantics).
cooksRouter.post("/me/availability", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const parsed = setAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const slots = await prisma.$transaction(async (tx) => {
    await tx.cookAvailability.deleteMany({ where: { cookId } });
    if (parsed.data.slots.length === 0) return [];
    await tx.cookAvailability.createMany({ data: parsed.data.slots.map((s) => ({ cookId, ...s })) });
    return tx.cookAvailability.findMany({ where: { cookId } });
  });
  res.json(slots);
});

// GET /cooks/me/availability — the cook's own weekly schedule.
cooksRouter.get("/me/availability", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const slots = await prisma.cookAvailability.findMany({ where: { cookId }, orderBy: [{ weekday: "asc" }, { startMin: "asc" }] });
  res.json(slots);
});

// ─── Admin: KYC review ────────────────────────────────────────────────────────────

const COOK_STATUSES = ["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"] as const;

// GET /cooks — admin list, optionally filtered by status, paginated.
cooksRouter.get("/", requireAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status !== undefined && !COOK_STATUSES.includes(status as (typeof COOK_STATUSES)[number])) {
    return res.status(400).json({ error: `status must be one of: ${COOK_STATUSES.join(", ")}` });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const cooks = await prisma.cook.findMany({
    where: status ? { status: status as (typeof COOK_STATUSES)[number] } : undefined,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  res.json(cooks.map(serializeCook));
});

// GET /cooks/:id — admin view of one cook, with documents (for KYC review).
cooksRouter.get("/:id", requireAdmin, async (req, res) => {
  const cook = await prisma.cook.findUnique({ where: { id: req.params.id }, include: { documents: true } });
  if (!cook) return res.status(404).json({ error: "Not found" });
  const { documents, ...profile } = cook;
  res.json({ ...serializeCook(profile), documents });
});

const setCookStatusSchema = z.object({ status: z.enum(COOK_STATUSES) });

// PATCH /cooks/:id/status — { status } — admin moves a cook through the KYC lifecycle
// (PENDING_REVIEW -> ACTIVE/REJECTED, or ACTIVE <-> SUSPENDED).
cooksRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  const parsed = setCookStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const cook = await prisma.cook.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
  res.json(serializeCook(cook));
});

const reviewDocumentSchema = z.object({ status: z.enum(["VERIFIED", "REJECTED"]) });

// PATCH /cooks/:cookId/documents/:docId — { status } — admin approves/rejects one KYC document.
cooksRouter.patch("/:cookId/documents/:docId", requireAdmin, async (req, res) => {
  const parsed = reviewDocumentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const doc = await prisma.cookDocument.findUnique({ where: { id: req.params.docId } });
  if (!doc || doc.cookId !== req.params.cookId) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.cookDocument.update({
    where: { id: req.params.docId },
    data: { status: parsed.data.status, reviewedBy: req.auth!.sub, reviewedAt: new Date() },
  });
  res.json(updated);
});
