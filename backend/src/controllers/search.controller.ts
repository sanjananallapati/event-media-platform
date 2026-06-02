import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function globalSearch(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      q,
      type = 'all',
      page = '1',
      limit = '20',
      startDate,
      endDate,
      tags,
      event,
      username,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const isLoggedIn = !!req.user;
    const accessFilter = isLoggedIn ? {} : { accessLevel: 'PUBLIC' as const };

    const results: Record<string, unknown> = {};

    if (type === 'all' || type === 'media') {
      const mediaWhere: any = {
        isActive: true,
        ...accessFilter,
        ...(q && {
          OR: [
            { caption: { contains: q as string, mode: 'insensitive' } },
            { originalName: { contains: q as string, mode: 'insensitive' } },
            { aiCaption: { contains: q as string, mode: 'insensitive' } },
          ],
        }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        }),
        ...(tags && {
          OR: [
            {
              aiTags: {
                some: {
                  name: {
                    in: (tags as string).split(',').map(t => t.trim()),
                  },
                },
              },
            },
            {
              tags: {
                some: {
                  name: {
                    in: (tags as string).split(',').map(t => t.trim()),
                  },
                },
              },
            },
          ],
        }),
        ...(username && {
          uploader: {
            username: { contains: username as string, mode: 'insensitive' },
          },
        }),
        ...(event && {
          event: {
            OR: [
              { name: { contains: event as string, mode: 'insensitive' } },
              { slug: { contains: event as string, mode: 'insensitive' } },
            ],
          },
        }),
      };

      const [media, mediaTotal] = await Promise.all([
        prisma.media.findMany({
          where: mediaWhere,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            event: {
              select: { id: true, name: true, slug: true },
            },
            aiTags: true,
            _count: { select: { likes: true, comments: true } },
          },
        }),
        prisma.media.count({ where: mediaWhere }),
      ]);

      results.media = { items: media, total: mediaTotal };
    }

    if (type === 'all' || type === 'events') {
      const eventWhere: any = {
        isActive: true,
        ...accessFilter,
        ...(q && {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' } },
            { description: { contains: q as string, mode: 'insensitive' } },
            { clubName: { contains: q as string, mode: 'insensitive' } },
            { location: { contains: q as string, mode: 'insensitive' } },
          ],
        }),
        ...(startDate && endDate && {
          startDate: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        }),
      };

      const [events, eventsTotal] = await Promise.all([
        prisma.event.findMany({
          where: eventWhere,
          skip,
          take: limitNum,
          orderBy: { startDate: 'desc' },
          include: {
            createdBy: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
            _count: { select: { media: true, albums: true } },
          },
        }),
        prisma.event.count({ where: eventWhere }),
      ]);

      results.events = { items: events, total: eventsTotal };
    }

    if (type === 'all' || type === 'users') {
      const userWhere: any = {
        isActive: true,
        ...(q && {
          OR: [
            { username: { contains: q as string, mode: 'insensitive' } },
            { fullName: { contains: q as string, mode: 'insensitive' } },
          ],
        }),
      };

      const [users, usersTotal] = await Promise.all([
        prisma.user.findMany({
          where: userWhere,
          skip,
          take: limitNum,
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
            _count: { select: { mediaUploads: true } },
          },
        }),
        prisma.user.count({ where: userWhere }),
      ]);

      results.users = { items: users, total: usersTotal };
    }

    sendSuccess(res, results, 'Search results');
  } catch (error) {
    next(error);
  }
}

export async function getAutocompleteSuggestions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      sendSuccess(res, []);
      return;
    }

    const query = q as string;

    const [events, users, tags] = await Promise.all([
      prisma.event.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { name: true, slug: true },
      }),
      prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { username: true, fullName: true, avatar: true },
      }),
      prisma.aITag.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        distinct: ['name'],
        take: 5,
        select: { name: true },
      }),
    ]);

    const suggestions = [
      ...events.map((e) => ({ type: 'event', label: e.name, value: e.slug })),
      ...users.map((u) => ({ type: 'user', label: u.fullName || u.username, value: u.username })),
      ...tags.map((t) => ({ type: 'tag', label: t.name, value: t.name })),
    ];

    sendSuccess(res, suggestions);
  } catch (error) {
    next(error);
  }
}
