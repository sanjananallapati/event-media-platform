/**
 * One-off cleanup for media rows that were orphaned by the old, broken
 * event-delete logic (it set Media.eventId = null instead of deleting the rows).
 *
 * "Orphaned" here = media not attached to any event AND not in any album.
 * These are the leftovers from deleted events. Standalone uploads that were
 * never tied to an event/album also match this filter, so REVIEW THE DRY RUN
 * before deleting.
 *
 * Usage:
 *   # 1. See what would be deleted (no changes made):
 *   npx ts-node prisma/cleanup-orphaned-media.ts
 *
 *   # 2. Actually delete (DB rows + best-effort S3 file removal):
 *   CONFIRM=yes npx ts-node prisma/cleanup-orphaned-media.ts
 */
import { PrismaClient } from '@prisma/client';
import { deleteFromS3 } from '../src/services/s3.service';

const prisma = new PrismaClient();

async function main() {
  const confirm = process.env.CONFIRM === 'yes';

  // Adjust this filter if your definition of "orphan" differs.
  const where = { eventId: null, albumId: null };

  const orphans = await prisma.media.findMany({
    where,
    select: { id: true, originalName: true, key: true, thumbnailKey: true },
  });

  console.log(`Found ${orphans.length} orphaned media row(s).`);
  if (orphans.length === 0) {
    return;
  }

  orphans.slice(0, 10).forEach((m) =>
    console.log(`  - ${m.id}  ${m.originalName}`)
  );
  if (orphans.length > 10) console.log(`  ...and ${orphans.length - 10} more`);

  if (!confirm) {
    console.log('\nDRY RUN. Re-run with CONFIRM=yes to delete these.');
    return;
  }

  // Best-effort S3 cleanup (files from already-deleted events are likely gone;
  // errors are ignored so a missing object never blocks the DB cleanup).
  for (const m of orphans) {
    try { await deleteFromS3(m.key); } catch (_) {}
    if (m.thumbnailKey) {
      try { await deleteFromS3(m.thumbnailKey); } catch (_) {}
    }
  }

  // Deleting Media cascades likes/comments/favourites/shares/downloads/tags/etc.
  const result = await prisma.media.deleteMany({ where });
  console.log(`\n✅ Deleted ${result.count} orphaned media row(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());