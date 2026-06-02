import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', unreadOnly } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      recipientId: userId,
      ...(unreadOnly === 'true' && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    sendSuccess(res, {
      notifications,
      unreadCount,
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

export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true },
    });

    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await prisma.notification.deleteMany({
      where: { id, recipientId: userId },
    });

    sendSuccess(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
}
