import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole, RequestStatus } from '@prisma/client';

// ─── USER ENDPOINTS ──────────────────────────────────────────────────────────

/**
 * POST /api/role-requests
 * Allows a VIEWER to request an upgrade to CLUB_MEMBER or PHOTOGRAPHER.
 */
export async function requestRoleUpgrade(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { requestedRole, remarks } = req.body;

    // Only VIEWER can request upgrades through this flow
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    if (user.role !== 'VIEWER') {
      sendError(res, 'Only VIEWER accounts can request role upgrades', 400);
      return;
    }

    const allowedTargets: UserRole[] = ['CLUB_MEMBER', 'PHOTOGRAPHER'];
    if (!allowedTargets.includes(requestedRole as UserRole)) {
      sendError(res, 'You can only request CLUB_MEMBER or PHOTOGRAPHER roles', 400);
      return;
    }

    // Check if there's already a PENDING request for this role
    const existing = await prisma.roleRequest.findFirst({
      where: { userId, requestedRole, status: 'PENDING' },
    });

    if (existing) {
      sendError(res, 'You already have a pending request for this role', 409);
      return;
    }

    const roleRequest = await prisma.roleRequest.create({
      data: {
        userId,
        requestedRole: requestedRole as UserRole,
        remarks: remarks || null,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, email: true, role: true },
        },
      },
    });

    sendSuccess(res, roleRequest, 'Role upgrade request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/role-requests/my
 * Returns the current user's own role requests.
 */
export async function getMyRoleRequests(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const requests = await prisma.roleRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
}

// ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

/**
 * GET /api/role-requests
 * Admin: list all role requests with optional status filter.
 */
export async function getAllRoleRequests(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
      where.status = status as RequestStatus;
    }

    const [requests, total] = await Promise.all([
      prisma.roleRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          reviewer: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      prisma.roleRequest.count({ where }),
    ]);

    sendSuccess(res, {
      requests,
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

/**
 * PATCH /api/role-requests/:id/approve
 * Admin: approve a pending request, update user's role.
 */
export async function approveRoleRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    const request = await prisma.roleRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      sendError(res, 'Role request not found', 404);
      return;
    }

    if (request.status !== 'PENDING') {
      sendError(res, `Request is already ${request.status.toLowerCase()}`, 400);
      return;
    }

    // Approve the request and update user's role in a transaction
    const [updated] = await prisma.$transaction([
      prisma.roleRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, email: true },
          },
          reviewer: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole },
      }),
    ]);

    sendSuccess(res, updated, 'Role request approved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/role-requests/:id/reject
 * Admin: reject a pending request with optional remarks.
 */
export async function rejectRoleRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user!.userId;

    const request = await prisma.roleRequest.findUnique({ where: { id } });

    if (!request) {
      sendError(res, 'Role request not found', 404);
      return;
    }

    if (request.status !== 'PENDING') {
      sendError(res, `Request is already ${request.status.toLowerCase()}`, 400);
      return;
    }

    const updated = await prisma.roleRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        remarks: remarks || null,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, email: true },
        },
        reviewer: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    sendSuccess(res, updated, 'Role request rejected');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/role-requests/stats
 * Admin: quick counts for dashboard.
 */
export async function getRoleRequestStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [pending, approved, rejected, totalUsers, photographers, clubMembers] =
      await Promise.all([
        prisma.roleRequest.count({ where: { status: 'PENDING' } }),
        prisma.roleRequest.count({ where: { status: 'APPROVED' } }),
        prisma.roleRequest.count({ where: { status: 'REJECTED' } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'PHOTOGRAPHER', isActive: true } }),
        prisma.user.count({ where: { role: 'CLUB_MEMBER', isActive: true } }),
        
      ]);

    const [totalEvents, totalMedia] = await Promise.all([
      prisma.event.count({ where: { isActive: true } }),
      prisma.media.count({ where: { isActive: true } }),
    ]);

    sendSuccess(res, {
      roleRequests: { pending, approved, rejected },
      users: { total: totalUsers, photographers, clubMembers },
      platform: { events: totalEvents, media: totalMedia },
    });
  } catch (error) {
    next(error);
  }
}
