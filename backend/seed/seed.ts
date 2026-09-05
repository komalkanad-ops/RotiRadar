// Standalone entrypoint (`tsx seed/seed.ts`) — unlike src/app.ts, nothing else here loads .env.
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

// Seeds the service catalog, default AppConfig, and the bootstrap admin. Idempotent — safe to run
// on every deploy. Prices here mirror web/src/lib/pricing.ts exactly.

// Mirrors web/src/lib/pricing.ts. Every tier is billed per visit.
const SERVICES = [
  {
    tier: "BASIC" as const,
    name: "Roti • Dal • Rice",
    description: "The everyday essential — 10–12 puffed phulka rotis, dal tadka, and steamed rice, cooked with your ingredients. Kitchen wiped down after.",
    billing: "flat",
    basePricePaise: 19900,
    minMinutes: 60,
    maxMinutes: 60,
  },
  {
    tier: "SABJI" as const,
    name: "Sabzi Prep",
    description: "A week of vegetables in one visit — 2–3 seasonal sabzis chopped, cooked, and stored, plus a masala base for the week. Fridge-ready packing.",
    billing: "flat",
    basePricePaise: 49900,
    minMinutes: 60,
    maxMinutes: 120,
  },
  {
    tier: "FULL_MEAL" as const,
    name: "Full Meal",
    description: "A 3–5 course spread for family dinners and guests — serves 4–6, festive and regional menus, serving and full clean-up.",
    billing: "flat",
    basePricePaise: 99900,
    minMinutes: 120,
    maxMinutes: 120,
  },
];

const CONFIG: Record<string, string> = {
  cancellation_cutoff_minutes: "120",
  cancellation_fee_paise: "10000",
  platform_fee_percent: "10",
  gst_percent: "5",
  scheduling_horizon_days: "7",
  default_service_radius_km: "5",
  cook_commission_percent: "20",
};

async function main() {
  for (const s of SERVICES) {
    await prisma.service.upsert({ where: { tier: s.tier }, create: s, update: s });
  }

  for (const [key, value] of Object.entries(CONFIG)) {
    await prisma.appConfig.upsert({ where: { key }, create: { key, value }, update: {} });
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (email && password) {
    await prisma.adminUser.upsert({
      where: { email },
      create: { email, name: "Owner", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 10) },
      update: {},
    });
  }

  console.log(`Seeded ${SERVICES.length} services, ${Object.keys(CONFIG).length} config keys.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
