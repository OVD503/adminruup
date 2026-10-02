/**
 * One-time script: Fix signatory names in DB.
 * Replaces "Gottimukkala Shyam Sunder" (old hardcoded default) with
 * the admin's actual displayName for every SignatureSetting record.
 *
 * Run: npx tsx scripts/fix-signatory-names.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all signature settings that still have the old hardcoded default name
  const badRecords = await prisma.signatureSetting.findMany({
    where: { signatoryName: "Gottimukkala Shyam Sunder" },
    include: { adminUser: { select: { displayName: true } } },
  });

  if (badRecords.length === 0) {
    console.log("✅ No records with the old hardcoded name found. Nothing to fix.");
    return;
  }

  console.log(`Found ${badRecords.length} record(s) to fix:`);

  for (const record of badRecords) {
    const correctName = record.adminUser.displayName;
    console.log(`  • ${record.adminUserId} → "${correctName}"`);

    await prisma.signatureSetting.update({
      where: { adminUserId: record.adminUserId },
      data: { signatoryName: correctName },
    });
  }

  console.log("✅ Done! All signatory names updated to the admin's displayName.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
