import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToS3, deleteFromS3 } from '../services/s3.service';
import { processImage } from '../services/image.service';
import { indexFace, deleteFace } from '../services/rekognition.service';
import { hashPassword, comparePassword } from '../utils/password';

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        avatar: true,
        bio: true,
        selfieUrl: true,
        rekognitionIndexed: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            mediaUploads: { where: { isActive: true } },
            likes: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, bio, username } = req.body;
    const userId = req.user!.userId;

    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: userId } },
      });
      if (existing) {
        sendError(res, 'Username already taken', 409);
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(username && { username: username.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        avatar: true,
        bio: true,
        rekognitionIndexed: true,
      },
    });

    sendSuccess(res, updated, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateAvatar(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'Avatar file required', 400);
      return;
    }

    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    // Delete old avatar
    if (user?.avatarKey) {
      await deleteFromS3(user.avatarKey);
    }

    const processed = await processImage(req.file.buffer, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 90,
    });

    const result = await uploadToS3(
      processed.buffer,
      req.file.originalname,
      'image/jpeg',
      'avatars'
    );

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: result.url, avatarKey: result.key },
      select: { id: true, avatar: true },
    });

    sendSuccess(res, updated, 'Avatar updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function uploadSelfieForFaceRecognition(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'Selfie file required', 400);
      return;
    }

    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { selfieKey: true, faceId: true },
    });

    // Delete old selfie
    if (user?.selfieKey) {
      await deleteFromS3(user.selfieKey);
    }

    // Remove old face from Rekognition
    if (user?.faceId) {
      try {
        await deleteFace(user.faceId);
      } catch (err) {
        // Continue even if deletion fails
      }
    }

    // Process selfie
    const processed = await processImage(req.file.buffer, {
      maxWidth: 800,
      quality: 90,
    });

    // Upload selfie to S3
    const result = await uploadToS3(
      processed.buffer,
      `selfie_${userId}.jpg`,
      'image/jpeg',
      'selfies'
    );

    // Index face in Rekognition
    const faceId = await indexFace(processed.buffer, userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        selfieUrl: result.url,
        selfieKey: result.key,
        faceId: faceId || null,
        rekognitionIndexed: !!faceId,
      },
    });

    sendSuccess(
      res,
      {
        selfieUrl: result.url,
        indexed: !!faceId,
        message: faceId
          ? 'Face indexed successfully. You can now find photos with your face.'
          : 'Selfie uploaded but face indexing failed. Please try with a clearer photo.',
      },
      'Selfie uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
}

export async function getMyPhotos(
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

    // Find photos where user was face-matched
    const [matches, total] = await Promise.all([
      prisma.faceMatch.findMany({
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
              event: {
                select: { id: true, name: true, slug: true },
              },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      }),
      prisma.faceMatch.count({ where: { userId } }),
    ]);

    const photos = matches.map((m) => ({
      ...m.media,
      faceMatchSimilarity: m.similarity,
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

export async function changePassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    const hashedNew = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNew },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      isActive: true,
      ...(search && {
        OR: [
          { username: { contains: search as string, mode: 'insensitive' } },
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, { users, meta: { page: pageNum, limit: limitNum, total } });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    sendSuccess(res, updated, 'User role updated');
  } catch (error) {
    next(error);
  }
}
