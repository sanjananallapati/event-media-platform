import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  uploadToS3,
  deleteFromS3,
  getSignedDownloadUrl,
} from '../services/s3.service';
import {
  processImage,
  generateThumbnail,
  addWatermark,
  computePerceptualHash,
  hammingDistance,
} from '../services/image.service';
import {
  detectLabels,
  searchFacesByImage,
  generateAICaption,
} from '../services/rekognition.service';
import { createNotification } from '../services/notification.service';
import { emitToEvent } from '../services/socket.service';
import { AccessLevel, MediaType } from '@prisma/client';
import { logger } from '../utils/logger';

export async function uploadMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      sendError(res, 'No files provided', 400);
      return;
    }

    const {
      eventId,
      albumId,
      accessLevel = 'PUBLIC',
      caption,
    } = req.body;

    const uploadedMedia = [];

    for (const file of files) {
      try {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        let mainBuffer = file.buffer;
        let thumbnailUrl: string | undefined;
        let thumbnailKey: string | undefined;
        let width = 0;
        let height = 0;
        let aiTags: { name: string; confidence: number }[] = [];
        let aiCaption = '';
        let perceptualHash = '';

        if (isImage) {
          // Process and compress image
          const processed = await processImage(file.buffer, {
            maxWidth: 2048,
            quality: 85,
          });
          mainBuffer = processed.buffer;
          width = processed.width;
          height = processed.height;

          // Generate thumbnail
          const thumbnail = await generateThumbnail(mainBuffer, 400, 400);

          // Upload thumbnail
          const thumbResult = await uploadToS3(
            thumbnail.buffer,
            `thumb_${file.originalname}`,
            'image/jpeg',
            'thumbnails'
          );
          thumbnailUrl = thumbResult.url;
          thumbnailKey = thumbResult.key;

          // Compute perceptual hash for duplicate detection
          perceptualHash = await computePerceptualHash(mainBuffer);

          // Check for duplicates
          if (perceptualHash) {
            const recentMedia = await prisma.media.findMany({
              where: {
                uploaderId: req.user!.userId,
                perceptualHash: { not: null },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              select: { id: true, perceptualHash: true },
            });

            for (const existing of recentMedia) {
              if (existing.perceptualHash) {
                const dist = hammingDistance(perceptualHash, existing.perceptualHash);
                if (dist < 5) {
                  logger.info(`Duplicate detected: ${existing.id}`);
                  // Still upload but mark as duplicate
                }
              }
            }
          }

          // AI Tagging
          try {
            const labels = await detectLabels(mainBuffer);
            aiTags = labels.map((l) => ({
              name: l.name,
              confidence: l.confidence,
            }));
            aiCaption = await generateAICaption(labels);
          } catch (aiError) {
            logger.warn('AI tagging failed:', aiError);
          }
        }

        // Upload main file to S3
        const folder = isImage ? 'images' : 'videos';
        const result = await uploadToS3(
          mainBuffer,
          file.originalname,
          file.mimetype,
          folder
        );

        // Determine media type
        const mediaType: MediaType = isVideo ? 'VIDEO' : 'IMAGE';

        // Create media record
        const media = await prisma.media.create({
          data: {
            filename: result.key.split('/').pop() || file.originalname,
            originalName: file.originalname,
            mimeType: isImage ? 'image/jpeg' : file.mimetype,
            size: mainBuffer.length,
            width: width || null,
            height: height || null,
            url: result.url,
            key: result.key,
            thumbnailUrl,
            thumbnailKey,
            type: mediaType,
            accessLevel: accessLevel as AccessLevel,
            caption,
            aiCaption: aiCaption || null,
            perceptualHash: perceptualHash || null,
            uploaderId: req.user!.userId,
            eventId: eventId || null,
            albumId: albumId || null,
            ...(aiTags.length > 0 && {
              aiTags: {
                create: aiTags,
              },
            }),
          },
          include: {
            uploader: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            aiTags: true,
          },
        });

        // Run face detection asynchronously
        if (isImage) {
          setImmediate(async () => {
            try {
              await runFaceDetectionForMedia(media.id, mainBuffer, media.url);
            } catch (err) {
              logger.error('Face detection failed:', err);
            }
          });
        }

        uploadedMedia.push(media);

        // Emit to event room if applicable
        if (eventId) {
          emitToEvent(eventId, 'media:uploaded', {
            media,
            uploaderId: req.user!.userId,
          });
        }
      } catch (fileError) {
        logger.error(`Failed to process file ${file.originalname}:`, fileError);
      }
    }

    sendSuccess(
      res,
      uploadedMedia,
      `${uploadedMedia.length} file(s) uploaded successfully`,
      201
    );
  } catch (error) {
    next(error);
  }
}

async function runFaceDetectionForMedia(
  mediaId: string,
  imageBuffer: Buffer,
  imageUrl: string
): Promise<void> {
  try {
    const faceMatches = await searchFacesByImage(imageBuffer, 20, 80);

    if (faceMatches.length > 0) {
      // Get users with indexed faces
      const indexedUsers = await prisma.user.findMany({
        where: {
          faceId: { in: faceMatches.map((m) => m.faceId) },
          rekognitionIndexed: true,
        },
        select: { id: true, faceId: true },
      });

      for (const user of indexedUsers) {
        const match = faceMatches.find((m) => m.faceId === user.faceId);
        if (match) {
          await prisma.faceMatch.upsert({
            where: { mediaId_userId: { mediaId, userId: user.id } },
            create: {
              mediaId,
              userId: user.id,
              similarity: match.similarity,
              boundingBox: match.boundingBox || {},
            },
            update: {
              similarity: match.similarity,
              boundingBox: match.boundingBox || {},
            },
          });
        }
      }
    }
  } catch (error) {
    logger.error('Face detection processing error:', error);
  }
}

export async function getMediaById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id, isActive: true },
      include: {
        uploader: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        event: {
          select: { id: true, name: true, slug: true, clubName: true },
        },
        album: {
          select: { id: true, name: true },
        },
        aiTags: true,
        tags: true,
        userTags: {
          include: {
            taggedUser: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
          },
        },
        comments: {
          where: { parentId: null },
          include: {
            user: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, username: true, fullName: true, avatar: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { likes: true, comments: true, favourites: true, shares: true },
        },
        ...(req.user && {
          likes: { where: { userId: req.user.userId } },
          favourites: { where: { userId: req.user.userId } },
        }),
      },
    });

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    if (media.accessLevel === 'PRIVATE' && !req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Increment view count
    await prisma.media.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    sendSuccess(res, media);
  } catch (error) {
    next(error);
  }
}

export async function deleteMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({ where: { id } });

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    if (
      media.uploaderId !== req.user!.userId &&
      req.user!.role !== 'ADMIN'
    ) {
      sendError(res, 'Not authorized to delete this media', 403);
      return;
    }

    // Delete from S3
    await deleteFromS3(media.key);
    if (media.thumbnailKey) {
      await deleteFromS3(media.thumbnailKey);
    }

    // Soft delete
    await prisma.media.update({
      where: { id },
      data: { isActive: false },
    });

    sendSuccess(res, null, 'Media deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function likeMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const media = await prisma.media.findUnique({
      where: { id, isActive: true },
      select: { id: true, uploaderId: true },
    });

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    const existing = await prisma.like.findUnique({
      where: { mediaId_userId: { mediaId: id, userId } },
    });

    if (existing) {
      await prisma.like.delete({
        where: { mediaId_userId: { mediaId: id, userId } },
      });

      const count = await prisma.like.count({ where: { mediaId: id } });
      sendSuccess(res, { liked: false, count });
    } else {
      await prisma.like.create({
        data: { mediaId: id, userId },
      });

      const count = await prisma.like.count({ where: { mediaId: id } });

      // Send notification
      await createNotification({
        type: 'LIKE',
        message: 'liked your photo',
        recipientId: media.uploaderId,
        senderId: userId,
        mediaId: id,
      });

      sendSuccess(res, { liked: true, count });
    }
  } catch (error) {
    next(error);
  }
}

export async function addComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user!.userId;

    const media = await prisma.media.findUnique({
      where: { id, isActive: true },
      select: { id: true, uploaderId: true },
    });

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        mediaId: id,
        userId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });

    // Notify media owner
    await createNotification({
      type: 'COMMENT',
      message: `commented: "${content.substring(0, 50)}"`,
      recipientId: media.uploaderId,
      senderId: userId,
      mediaId: id,
    });

    // Emit real-time
    emitToEvent(id, 'comment:new', comment);

    sendSuccess(res, comment, 'Comment added', 201);
  } catch (error) {
    next(error);
  }
}

export async function getComments(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { mediaId: id, parentId: null },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, username: true, fullName: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.comment.count({ where: { mediaId: id, parentId: null } }),
    ]);

    sendPaginated(res, comments, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
}

export async function toggleFavourite(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const media = await prisma.media.findUnique({
      where: { id, isActive: true },
    });

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    const existing = await prisma.favourite.findUnique({
      where: { mediaId_userId: { mediaId: id, userId } },
    });

    if (existing) {
      await prisma.favourite.delete({
        where: { mediaId_userId: { mediaId: id, userId } },
      });
      sendSuccess(res, { favourited: false });
    } else {
      await prisma.favourite.create({ data: { mediaId: id, userId } });
      sendSuccess(res, { favourited: true });
    }
  } catch (error) {
    next(error);
  }
}

export async function getFavourites(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [favourites, total] = await Promise.all([
      prisma.favourite.findMany({
        where: { userId },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          media: {
            include: {
              uploader: {
                select: { id: true, username: true, fullName: true, avatar: true },
              },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      }),
      prisma.favourite.count({ where: { userId } }),
    ]);

    sendPaginated(
      res,
      favourites.map((f) => f.media),
      pageNum,
      limitNum,
      total
    );
  } catch (error) {
    next(error);
  }
}

export async function shareMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    const userId = req.user!.userId;

    await prisma.share.create({
      data: { mediaId: id, userId, platform },
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/media/${id}`;

    sendSuccess(res, { shareUrl });
  } catch (error) {
    next(error);
  }
}

export async function downloadMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id, isActive: true },
      include: {
        event: {
          select: { name: true, clubName: true },
        },
        uploader: {
          select: { role: true },
        },
      },
    });

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    let downloadBuffer: Buffer | undefined;

    // Generate watermarked version for images
    if (media.type === 'IMAGE') {
      try {
        // Fetch the image from S3 URL
        const response = await fetch(media.url);
        const arrayBuffer = await response.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        // Build watermark text
      const watermarkText =
      `CIG Media | ${media.event?.name || 'Event'}`;  

        downloadBuffer = await addWatermark(originalBuffer, watermarkText);
      } catch (wmError) {
        logger.error('Watermark error during download:', wmError);
      }
    }

    // Track download
    if (req.user) {
      await prisma.download.create({
        data: { mediaId: id, userId: req.user.userId },
      });
      await prisma.media.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });
    }

    if (downloadBuffer) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${media.originalName}"`
      );
      res.send(downloadBuffer);
    } else {
      // For videos or if watermark fails, redirect to signed URL
      const signedUrl = await getSignedDownloadUrl(media.key, 300);
      res.redirect(signedUrl);
    }
  } catch (error) {
    next(error);
  }
}

export async function tagUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { taggedUserId } = req.body;
    const taggerUserId = req.user!.userId;

    const [media, taggedUser] = await Promise.all([
      prisma.media.findUnique({ where: { id, isActive: true } }),
      prisma.user.findUnique({ where: { id: taggedUserId } }),
    ]);

    if (!media) {
      sendError(res, 'Media not found', 404);
      return;
    }

    if (!taggedUser) {
      sendError(res, 'User to tag not found', 404);
      return;
    }

    const tag = await prisma.mediaTag.upsert({
      where: { mediaId_taggedUserId: { mediaId: id, taggedUserId } },
      create: { mediaId: id, taggedUserId, taggerUserId },
      update: {},
      include: {
        taggedUser: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });

    // Notify tagged user (createNotification no-ops when tagging yourself)
    await createNotification({
      type: 'TAG',
      message: 'tagged you in a photo',
      recipientId: taggedUserId,
      senderId: taggerUserId,
      mediaId: id,
    });

    sendSuccess(res, tag, 'User tagged successfully');
  } catch (error) {
    next(error);
  }
}

export async function untagUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, taggedUserId } = req.params;
    const requesterId = req.user!.userId;

    const [media, tag] = await Promise.all([
      prisma.media.findUnique({ where: { id } }),
      prisma.mediaTag.findUnique({
        where: { mediaId_taggedUserId: { mediaId: id, taggedUserId } },
      }),
    ]);

    if (!media || !tag) {
      sendError(res, 'Tag not found', 404);
      return;
    }

    // Allowed: whoever created the tag, the tagged person, the media owner, or an admin
    const canRemove =
      tag.taggerUserId === requesterId ||
      tag.taggedUserId === requesterId ||
      media.uploaderId === requesterId ||
      req.user!.role === 'ADMIN';

    if (!canRemove) {
      sendError(res, 'Not authorized to remove this tag', 403);
      return;
    }

    await prisma.mediaTag.delete({
      where: { mediaId_taggedUserId: { mediaId: id, taggedUserId } },
    });

    sendSuccess(res, { mediaId: id, taggedUserId }, 'Tag removed');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /media/gallery
 * Public, paginated gallery feed for the infinite-scroll Gallery page.
 *
 * Visibility rule (privacy-safe — mirrors the canAccessAlbum / searchMedia fix):
 *   A media item is shown ONLY when it is fully public, i.e.
 *     - media.accessLevel === PUBLIC, AND
 *     - it has no event   OR its event is PUBLIC & active, AND
 *     - it has no album   OR its album is PUBLIC & active.
 *   This prevents a PUBLIC media/album that lives inside a PRIVATE event
 *   from leaking into the global feed.
 *
 * Query params: page, limit, type (IMAGE|VIDEO), q (caption / name / tag / #hashtag)
 */
export async function getGalleryMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = '1', limit = '12', type, q } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Validate optional media-type filter against the enum.
    const typeFilter =
      type === MediaType.IMAGE || type === MediaType.VIDEO
        ? (type as MediaType)
        : undefined;

    // Search term: strip a leading "#" so "#chart" matches the tag "chart".
    const term = (q as string)?.trim().replace(/^#/, '') || '';

    const where: Record<string, unknown> = {
      isActive: true,
      accessLevel: AccessLevel.PUBLIC,
      ...(typeFilter && { type: typeFilter }),
      AND: [
        // event is absent OR public+active
        {
          OR: [
            { eventId: null },
            { event: { accessLevel: AccessLevel.PUBLIC, isActive: true } },
          ],
        },
        // album is absent OR public+active
        {
          OR: [
            { albumId: null },
            { album: { accessLevel: AccessLevel.PUBLIC, isActive: true } },
          ],
        },
        // free-text search across caption / AI caption / filename / tags
        ...(term
          ? [
              {
                OR: [
                  { caption: { contains: term, mode: 'insensitive' } },
                  { aiCaption: { contains: term, mode: 'insensitive' } },
                  { originalName: { contains: term, mode: 'insensitive' } },
                  { tags: { some: { name: { contains: term, mode: 'insensitive' } } } },
                  { aiTags: { some: { name: { contains: term, mode: 'insensitive' } } } },
                ],
              },
            ]
          : []),
      ],
    };

    const userId = req.user?.userId;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          event: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true } },
          aiTags: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true, favourites: true } },
          // Per-user state so the feed can render the correct liked/saved icons.
          ...(userId && {
            likes: { where: { userId }, select: { id: true } },
            favourites: { where: { userId }, select: { id: true } },
          }),
        },
      }),
      prisma.media.count({ where }),
    ]);

    sendPaginated(res, media, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
}
