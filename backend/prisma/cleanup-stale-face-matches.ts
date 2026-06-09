/**
 * One-off cleanup for FaceMatch rows left behind by the old delete logic,
 * which soft-deleted media (isActive=false) + removed the S3 file but never
 * removed the matching FaceMatch rows. Those stale rows are what rendered as
 * broken/white tiles in "My Photos" and face search.
 *
 * The live queries now filter on media.isActive, so these rows are already
 * hidden from users — this script just removes the dead data.
 *
 * Usage:
 *   # 1. See what would be deleted (no changes made):
 *   npx ts-node prisma/cleanup-stale-face-matches.ts
 *
 *   # 2. Actually delete:
 *   CONFIRM=yes npx ts-node prisma/cleanup-stale-face-matches.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const confirm = process.env.CONFIRM === 'yes';

  // Stale = the face match points at media that is soft-deleted.
  const where = { media: { isActive: false } };

  const stale = await prisma.faceMatch.findMany({
    where,
    select: {
      id: true,
      userId: true,
      mediaId: true,
      media: { select: { originalName: true } },
    },
  });

  console.log(`Found ${stale.length} stale face match row(s).`);
  if (stale.length === 0) return;

  stale.slice(0, 10).forEach((m) =>
    console.log(`  - ${m.id}  media=${m.mediaId}  ${m.media?.originalName ?? ''}`)
  );
  if (stale.length > 10) console.log(`  ...and ${stale.length - 10} more`);

  if (!confirm) {
    console.log('\nDRY RUN. Re-run with CONFIRM=yes to delete these.');
    return;
  }

  const result = await prisma.faceMatch.deleteMany({ where });
  console.log(`\n✅ Deleted ${result.count} stale face match row(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());