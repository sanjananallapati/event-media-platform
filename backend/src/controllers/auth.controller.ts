import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { addDays } from 'date-fns';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, username, password, fullName, role } = req.body;

    // Check existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      sendError(
        res,
        existing.email === email
          ? 'Email already registered'
          : 'Username already taken',
        409
      );
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Only allow VIEWER and CLUB_MEMBER registration by default
    const allowedRoles = ['VIEWER', 'CLUB_MEMBER'];
    const userRole = allowedRoles.includes(role) ? role : 'VIEWER';

    const user = await prisma.user.create({
      data: {
        email,
        username: username.toLowerCase(),
        password: hashedPassword,
        fullName,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: addDays(new Date(), 30),
      },
    });

    sendSuccess(
      res,
      { user, accessToken, refreshToken },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.refreshToken.upsert({
      where: { token: refreshToken },
      create: {
        token: refreshToken,
        userId: user.id,
        expiresAt: addDays(new Date(), 30),
      },
      update: { expiresAt: addDays(new Date(), 30) },
    });

    const { password: _, ...userWithoutPassword } = user;

    sendSuccess(
      res,
      { user: userWithoutPassword, accessToken, refreshToken },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      sendError(res, 'Refresh token required', 400);
      return;
    }

    const decoded = verifyRefreshToken(token);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
    });

    if (!user) {
      sendError(res, 'User not found', 401);
      return;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(res, { accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { token },
      });
    }

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        avatar: true,
        bio: true,
        selfieUrl: true,
        faceId: true,
        rekognitionIndexed: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            mediaUploads: true,
            likes: true,
            comments: true,
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
