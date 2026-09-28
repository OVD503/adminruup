import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ruup Admin database …");

  const superAdminUserId = (process.env.SEED_SUPER_ADMIN_USER_ID || "superadmin").toLowerCase();
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || "ChangeMeImmediately123!";
  const superAdminName = process.env.SEED_SUPER_ADMIN_NAME || "Super Admin";
  const existingSuperAdmin = await prisma.adminUser.findUnique({ where: { userId: superAdminUserId } });
  if (!existingSuperAdmin) {
    await prisma.adminUser.create({
      data: { userId: superAdminUserId, displayName: superAdminName, passwordHash: await hashPassword(superAdminPassword), role: "SUPER_ADMIN" },
    });
    console.log(`  Super Admin created: ${superAdminUserId}`);
  }

  // ── Products / Services ──────────────────────────────────────────────
  const products = [
    {
      type: "GATC Stamping",
      name: "Stamping & Verification Charges",
      description:
        "Stamping & Verification Charges for Electronic Weighing Instrument (Class III)",
      hsnCode: "998346",
      basePrice: 0,
      taxRate: 18,
      unit: "Nos",
    },
    {
      type: "GATC Stamping",
      name: "Calibration / Testing Charges",
      description: "Calibration / Testing Charges (if applicable)",
      hsnCode: "998346",
      basePrice: 0,
      taxRate: 18,
      unit: "Nos",
    },
    {
      type: "GATC Stamping",
      name: "Transportation / On-site Service Charges",
      description: "Transportation / On-site Service charges (if applicable)",
      hsnCode: "996791",
      basePrice: 0,
      taxRate: 18,
      unit: "Nos",
    },
    {
      type: "Weighbridge Sale",
      name: "Weighbridge Sale",
      description: "Weighbridge sale and installation service",
      hsnCode: "84238900",
      basePrice: 0,
      taxRate: 18,
      unit: "Nos",
    },
    {
      type: "AMC Contract",
      name: "AMC Contract",
      description: "Annual maintenance contract service",
      hsnCode: "998717",
      basePrice: 0,
      taxRate: 18,
      unit: "Nos",
    },
  ];

  for (const product of products) {
    const existing = await prisma.productService.findFirst({
      where: { name: product.name, type: product.type },
    });
    if (!existing) {
      await prisma.productService.create({ data: product });
      console.log(`  ✓ Product: ${product.name}`);
    } else {
      console.log(`  – Product already exists: ${product.name}`);
    }
  }

  // ── Invoice Counter ──────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const counterExists = await prisma.invoiceCounter.findUnique({
    where: { year: currentYear },
  });
  if (!counterExists) {
    await prisma.invoiceCounter.create({
      data: { year: currentYear, lastNumber: 0 },
    });
    console.log(`  ✓ InvoiceCounter for ${currentYear}`);
  } else {
    console.log(`  – InvoiceCounter already exists for ${currentYear}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
