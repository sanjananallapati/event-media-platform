import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateUniqueSlug } from '../utils/slugify';
import { uploadToS3, deleteFromS3 } from '../services/s3.service';
import { processImage } from '../services/image.service';
import { EventCategory, AccessLevel } from '@prisma/client';

export async function createEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      description,
      category,
      accessLevel,
      startDate,
      endDate,
      location,
      clubName,
      albumName,
    } = req.body;

    const slug = generateUniqueSlug(name);

    let coverImageUrl: string | undefined;
    let coverKey: string | undefined;

    if (req.file) {
      const processed = await processImage(req.file.buffer, { maxWidth: 1920, quality: 85 });
      const result = await uploadToS3(
        processed.buffer,
        req.file.originalname,
        'image/jpeg',
        'events/covers'
      );
      coverImageUrl = result.url;
      coverKey = result.key;
    }

    const event = await prisma.event.create({
      data: {
        name,
        slug,
        description,
        category: category as EventCategory,
        accessLevel: accessLevel as AccessLevel,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        clubName,
        albumName: albumName || null,
        coverImage: coverImageUrl,
        coverKey,
        createdById: req.user!.userId,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        _count: { select: { media: true, albums: true } },
      },
    });

    sendSuccess(res, event, 'Event created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      page = '1',
      limit = '12',
      sortBy = 'startDate',
      order = 'desc',
      category,
      search,
      accessLevel,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const isLoggedIn = !!req.user;

    const where: Record<string, unknown> = {
      isActive: true,
      ...(isLoggedIn
        ? {}
        : { accessLevel: 'PUBLIC' }),
      ...(category && { category }),
      ...(accessLevel && { accessLevel }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { clubName: { contains: search as string, mode: 'insensitive' } },
          { albumName: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const validSortFields = ['name', 'startDate', 'category', 'createdAt'];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'startDate';

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
        include: {
          createdBy: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          _count: { select: { media: true, albums: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    sendPaginated(res, events, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
}

export async function getEventBySlug(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;

    const event = await prisma.event.findUnique({
      where: { slug, isActive: true },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        albums: {
          where: { isActive: true },
          include: {
            createdBy: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            _count: { select: { media: true } },
          },
        },
        _count: { select: { media: true, albums: true } },
      },
    });

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    if (event.accessLevel === 'PRIVATE' && !req.user) {
      sendError(res, 'Authentication required to view this event', 401);
      return;
    }

    sendSuccess(res, event);
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      accessLevel,
      startDate,
      endDate,
      location,
      clubName,
      albumName,
    } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    if (
      event.createdById !== req.user!.userId &&
      req.user!.role !== 'ADMIN'
    ) {
      sendError(res, 'Not authorized to update this event', 403);
      return;
    }

    let coverImageUrl = event.coverImage;
    let coverKey = event.coverKey;

    if (req.file) {
      if (event.coverKey) {
        await deleteFromS3(event.coverKey);
      }

      const processed = await processImage(req.file.buffer, { maxWidth: 1920, quality: 85 });
      const result = await uploadToS3(
        processed.buffer,
        req.file.originalname,
        'image/jpeg',
        'events/covers'
      );
      coverImageUrl = result.url;
      coverKey = result.key;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        category: category as EventCategory,
        accessLevel: accessLevel as AccessLevel,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        location,
        clubName,
        albumName: albumName !== undefined ? albumName || null : undefined,
        coverImage: coverImageUrl,
        coverKey,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        _count: { select: { media: true, albums: true } },
      },
    });

    sendSuccess(res, updated, 'Event updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        media: true,
        albums: {
          include: { media: true },
        },
      },
    });

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    if (
      event.createdById !== req.user!.userId &&
      req.user!.role !== 'ADMIN'
    ) {
      sendError(res, 'Not authorized to delete this event', 403);
      return;
    }

    // Delete cover image from S3 if exists
    if (event.coverKey) {
      try { await deleteFromS3(event.coverKey); } catch (_) {}
    }

    // Delete all media files from S3
    for (const m of event.media) {
      try { await deleteFromS3(m.key); } catch (_) {}
      if (m.thumbnailKey) {
        try { await deleteFromS3(m.thumbnailKey); } catch (_) {}
      }
    }

    // Delete album cover images from S3
    for (const album of event.albums) {
      if (album.coverKey) {
        try { await deleteFromS3(album.coverKey); } catch (_) {}
      }
      for (const m of album.media) {
        try { await deleteFromS3(m.key); } catch (_) {}
        if (m.thumbnailKey) {
          try { await deleteFromS3(m.thumbnailKey); } catch (_) {}
        }
      }
    }

    // Hard delete — cascade handles related records via Prisma schema
    await prisma.event.delete({ where: { id } });

    sendSuccess(res, null, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
}

export async function getEventMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;
    const {
      page = '1',
      limit = '20',
      type,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const event = await prisma.event.findUnique({
      where: { slug, isActive: true },
    });

    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    if (event.accessLevel === 'PRIVATE' && !req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const where: Record<string, unknown> = {
      eventId: event.id,
      isActive: true,
      ...(type && { type }),
    };

    const validSortFields = ['createdAt', 'viewCount', 'downloadCount'];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'createdAt';

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: order === 'asc' ? 'asc' : 'desc' },
        include: {
          uploader: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          aiTags: true,
          tags: true,
          _count: {
            select: { likes: true, comments: true, favourites: true },
          },
          ...(req.user && {
            likes: { where: { userId: req.user.userId } },
            favourites: { where: { userId: req.user.userId } },
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

export async function generateQRCode(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;
    const QRCode = require('qrcode');

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      sendError(res, 'Event not found', 404);
      return;
    }

    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${slug}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    sendSuccess(res, { qrCode: qrDataUrl, url });
  } catch (error) {
    next(error);
  }
}
