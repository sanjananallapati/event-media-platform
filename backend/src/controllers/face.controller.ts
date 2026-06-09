import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { searchFacesByImage } from '../services/rekognition.service';

export async function findMyPhotos(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceId: true, rekognitionIndexed: true },
    });

    if (!user?.rekognitionIndexed || !user?.faceId) {
      sendError(
        res,
        'Please upload a selfie first to enable face recognition',
        400
      );
      return;
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [matches, total] = await Promise.all([
      prisma.faceMatch.findMany({
        where: { userId, media: { isActive: true } },
        skip,
        take: limitNum,
        orderBy: { similarity: 'desc' },
        include: {
          media: {
            include: {
              uploader: {
                select: { id: true, username: true, fullName: true, avatar: true },
              },
              event: {
                select: { id: true, name: true, slug: true },
              },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      }),
      prisma.faceMatch.count({ where: { userId, media: { isActive: true } } }),
    ]);

    const photos = matches.map((m) => ({
      ...m.media,
      similarity: m.similarity,
      boundingBox: m.boundingBox,
    }));

    sendSuccess(res, {
      photos,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function searchByFaceImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'Image required', 400);
      return;
    }

    const faceMatches = await searchFacesByImage(req.file.buffer, 20, 70);

    if (faceMatches.length === 0) {
      sendSuccess(res, { photos: [], message: 'No matching faces found' });
      return;
    }

    // Get user IDs from face matches
    const matchedUsers = await prisma.user.findMany({
      where: {
        faceId: { in: faceMatches.map((m) => m.faceId) },
      },
      select: { id: true, faceId: true },
    });

    const userIds = matchedUsers.map((u) => u.id);

    // Find photos with face matches for these users
    const photos = await prisma.faceMatch.findMany({
      where: { userId: { in: userIds }, media: { isActive: true } },
      include: {
        media: {
          include: {
            uploader: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            event: {
              select: { id: true, name: true, slug: true },
            },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      orderBy: { similarity: 'desc' },
      take: 50,
    });

    sendSuccess(res, {
      photos: photos.map((p) => ({ ...p.media, similarity: p.similarity })),
      matchCount: photos.length,
    });
  } catch (error) {
    next(error);
  }
}