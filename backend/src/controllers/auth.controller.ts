import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { addDays } from 'date-fns';

// POST /api/auth/register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, username, password, fullName } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: username.toLowerCase() }] },
      select: { email: true },
    });

    if (existing) {
      sendError(
        res,
        existing.email === email ? 'Email already registered' : 'Username already taken',
        409
      );
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Always VIEWER — role upgrades go through admin-approval workflow
    const user = await prisma.user.create({
      data: {
        email,
        username: username.toLowerCase(),
        password: hashedPassword,
        fullName,
        role: 'VIEWER',
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

    const accessToken  = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshTokenVal = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenVal,
        userId: user.id,
        expiresAt: addDays(new Date(), 30),
      },
    });

    sendSuccess(res, { user, accessToken, refreshToken: refreshTokenVal }, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account is deactivated. Contact an administrator.', 403);
      return;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const accessToken     = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshTokenVal = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

    // Always CREATE a new refresh token (never upsert on a freshly-signed token
    // that cannot exist yet — the upsert where-clause would never match anyway
    // and would just create, but upsert requires the unique field to already exist
    // or to be provided in `create`, so using create is cleaner).
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenVal,
        userId: user.id,
        expiresAt: addDays(new Date(), 30),
      },
    });

    // Optionally: clean up old refresh tokens for this user (keep last 5)
    const allTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (allTokens.length > 5) {
      const toDelete = allTokens.slice(5).map((t) => t.id);
      await prisma.refreshToken.deleteMany({ where: { id: { in: toDelete } } });
    }

    const { password: _pw, ...safeUser } = user;

    sendSuccess(
      res,
      { user: safeUser, accessToken, refreshToken: refreshTokenVal },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/refresh
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

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      sendError(res, 'Refresh token expired or revoked', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
    });

    if (!user) {
      sendError(res, 'User not found or deactivated', 401);
      return;
    }

    // Re-read role from DB so approved role changes take effect immediately
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

// POST /api/auth/logout — does NOT require authenticate middleware
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
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
        isActive: true,
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

    if (!user || !user.isActive) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}
