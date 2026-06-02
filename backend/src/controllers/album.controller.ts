import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadToS3, deleteFromS3 } from '../services/s3.service';
import { processImage } from '../services/image.service';
import { AccessLevel } from '@prisma/client';

export async function createAlbum(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, description, eventId, accessLevel } = req.body;

    let coverImageUrl: string | undefined;
    let coverKey: string | undefined;

    if (req.file) {
      const processed = await processImage(req.file.buffer, { maxWidth: 1200, quality: 85 });
      const result = await uploadToS3(
        processed.buffer,
        req.file.originalname,
        'image/jpeg',
        'albums/covers'
      );
      coverImageUrl = result.url;
      coverKey = result.key;
    }

    const album = await prisma.album.create({
      data: {
        name,
        description,
        coverImage: coverImageUrl,
        coverKey,
        accessLevel: (accessLevel as AccessLevel) || 'PUBLIC',
        eventId: eventId || null,
        createdById: req.user!.userId,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        event: {
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { media: true } },
      },
    });

    sendSuccess(res, album, 'Album created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getAlbums(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = '1', limit = '12', eventId, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
      ...(eventId && { eventId }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          event: {
            select: { id: true, name: true, slug: true },
          },
          _count: { select: { media: true } },
        },
      }),
      prisma.album.count({ where }),
    ]);

    sendPaginated(res, albums, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
}

export async function getAlbumById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const album = await prisma.album.findUnique({
      where: { id, isActive: true },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        event: {
          select: { id: true, name: true, slug: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
          },
        },
        media: {
          where: { isActive: true },
          include: {
            uploader: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            _count: { select: { likes: true, comments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { media: true } },
      },
    });

    if (!album) {
      sendError(res, 'Album not found', 404);
      return;
    }

    sendSuccess(res, album);
  } catch (error) {
    next(error);
  }
}

export async function updateAlbum(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, accessLevel } = req.body;

    const album = await prisma.album.findUnique({ where: { id } });
    if (!album) {
      sendError(res, 'Album not found', 404);
      return;
    }

    if (album.createdById !== req.user!.userId && req.user!.role !== 'ADMIN') {
      sendError(res, 'Not authorized', 403);
      return;
    }

    let coverImageUrl = album.coverImage;
    let coverKey = album.coverKey;

    if (req.file) {
      if (album.coverKey) {
        await deleteFromS3(album.coverKey);
      }
      const processed = await processImage(req.file.buffer, { maxWidth: 1200, quality: 85 });
      const result = await uploadToS3(
        processed.buffer,
        req.file.originalname,
        'image/jpeg',
        'albums/covers'
      );
      coverImageUrl = result.url;
      coverKey = result.key;
    }

    const updated = await prisma.album.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(accessLevel && { accessLevel: accessLevel as AccessLevel }),
        coverImage: coverImageUrl,
        coverKey,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        _count: { select: { media: true } },
      },
    });

    sendSuccess(res, updated, 'Album updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteAlbum(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const album = await prisma.album.findUnique({ where: { id } });
    if (!album) {
      sendError(res, 'Album not found', 404);
      return;
    }

    if (album.createdById !== req.user!.userId && req.user!.role !== 'ADMIN') {
      sendError(res, 'Not authorized', 403);
      return;
    }

    await prisma.album.update({
      where: { id },
      data: { isActive: false },
    });

    sendSuccess(res, null, 'Album deleted');
  } catch (error) {
    next(error);
  }
}

export async function addCollaborator(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const album = await prisma.album.findUnique({ where: { id } });
    if (!album) {
      sendError(res, 'Album not found', 404);
      return;
    }

    if (album.createdById !== req.user!.userId && req.user!.role !== 'ADMIN') {
      sendError(res, 'Not authorized', 403);
      return;
    }

    await prisma.albumCollaborator.upsert({
      where: { albumId_userId: { albumId: id, userId } },
      create: { albumId: id, userId },
      update: {},
    });

    sendSuccess(res, null, 'Collaborator added');
  } catch (error) {
    next(error);
  }
}

export async function removeCollaborator(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, userId } = req.params;

    await prisma.albumCollaborator.deleteMany({
      where: { albumId: id, userId },
    });

    sendSuccess(res, null, 'Collaborator removed');
  } catch (error) {
    next(error);
  }
}
