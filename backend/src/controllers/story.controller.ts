import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToS3, deleteFromS3 } from '../services/s3.service';
import { processImage } from '../services/image.service';

export async function createStory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'File required', 400);
      return;
    }

    const { caption } = req.body;
    const userId = req.user!.userId;

    const isImage = req.file.mimetype.startsWith('image/');
    let buffer = req.file.buffer;

    if (isImage) {
      const processed = await processImage(req.file.buffer, {
        maxWidth: 1080,
        quality: 85,
      });
      buffer = processed.buffer;
    }

    const result = await uploadToS3(
      buffer,
      req.file.originalname,
      req.file.mimetype,
      'stories'
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const story = await prisma.story.create({
      data: {
        userId,
        mediaUrl: result.url,
        mediaKey: result.key,
        type: isImage ? 'IMAGE' : 'VIDEO',
        caption,
        expiresAt,
      },
    });

    sendSuccess(res, story, 'Story created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getActiveStories(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by user
    const userIds = [...new Set(stories.map((s) => s.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, fullName: true, avatar: true },
    });

    const grouped = userIds.map((userId) => ({
      user: users.find((u) => u.id === userId),
      stories: stories.filter((s) => s.userId === userId),
    }));

    sendSuccess(res, grouped);
  } catch (error) {
    next(error);
  }
}

export async function viewStory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.story.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    sendSuccess(res, null, 'Story viewed');
  } catch (error) {
    next(error);
  }
}

export async function deleteStory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const story = await prisma.story.findFirst({
      where: { id, userId },
    });

    if (!story) {
      sendError(res, 'Story not found', 404);
      return;
    }

    await deleteFromS3(story.mediaKey);
    await prisma.story.delete({ where: { id } });

    sendSuccess(res, null, 'Story deleted');
  } catch (error) {
    next(error);
  }
}
