import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getDashboardAnalytics(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalEvents,
      totalMedia,
      totalUsers,
      totalLikes,
      totalComments,
      totalDownloads,
      recentMedia,
      popularMedia,
      topUploaders,
      mediaByType,
    ] = await Promise.all([
      prisma.event.count({ where: { isActive: true } }),
      prisma.media.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.download.count(),
      prisma.media.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          uploader: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.media.findMany({
        where: { isActive: true },
        orderBy: [{ viewCount: 'desc' }, { likes: { _count: 'desc' } }],
        take: 10,
        include: {
          uploader: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          _count: { select: { likes: true, comments: true, downloads: true } },
        },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        orderBy: { mediaUploads: { _count: 'desc' } },
        take: 10,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          role: true,
          _count: { select: { mediaUploads: true } },
        },
      }),
      prisma.media.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: true,
      }),
    ]);

    // Storage estimate
    const storageUsed = await prisma.media.aggregate({
      where: { isActive: true },
      _sum: { size: true },
    });

    // Activity over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const uploadsOverTime = await prisma.media.groupBy({
      by: ['createdAt'],
      where: {
        isActive: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, {
      overview: {
        totalEvents,
        totalMedia,
        totalUsers,
        totalLikes,
        totalComments,
        totalDownloads,
        storageUsedBytes: storageUsed._sum.size || 0,
      },
      recentMedia,
      popularMedia,
      topUploaders,
      mediaByType,
      uploadsOverTime,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventAnalytics(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { media: true, albums: true } },
      },
    });

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    const [mediaStats, topMedia, uploaders] = await Promise.all([
      prisma.media.aggregate({
        where: { eventId: id, isActive: true },
        _sum: { size: true, viewCount: true, downloadCount: true },
        _count: true,
      }),
      prisma.media.findMany({
        where: { eventId: id, isActive: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
        include: {
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.media.groupBy({
        by: ['uploaderId'],
        where: { eventId: id, isActive: true },
        _count: true,
        orderBy: { _count: { uploaderId: 'desc' } },
        take: 10,
      }),
    ]);

    sendSuccess(res, {
      event,
      mediaStats: {
        totalMedia: mediaStats._count,
        totalSize: mediaStats._sum.size || 0,
        totalViews: mediaStats._sum.viewCount || 0,
        totalDownloads: mediaStats._sum.downloadCount || 0,
      },
      topMedia,
      uploaders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserAnalytics(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [uploads, receivedLikes, receivedComments, downloads, faceMatches] =
      await Promise.all([
        prisma.media.count({ where: { uploaderId: userId, isActive: true } }),
        prisma.like.count({ where: { media: { uploaderId: userId } } }),
        prisma.comment.count({ where: { media: { uploaderId: userId } } }),
        prisma.download.count({ where: { media: { uploaderId: userId } } }),
        prisma.faceMatch.count({ where: { userId } }),
      ]);

    const recentUploads = await prisma.media.findMany({
      where: { uploaderId: userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    });

    sendSuccess(res, {
      stats: {
        uploads,
        receivedLikes,
        receivedComments,
        downloads,
        faceMatches,
      },
      recentUploads,
    });
  } catch (error) {
    next(error);
  }
}
