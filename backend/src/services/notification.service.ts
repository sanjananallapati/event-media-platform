import { prisma } from '../lib/prisma';
import { NotificationType, Prisma } from '@prisma/client'; // 1. Imported Prisma
import { emitToUser } from './socket.service';
import { logger } from '../utils/logger';

export interface CreateNotificationParams {
  type: NotificationType;
  message: string;
  recipientId: string;
  senderId?: string;
  mediaId?: string;
  eventId?: string;
  data?: Prisma.InputJsonValue; // 2. Updated from Record<string, unknown> to Prisma's native JSON type
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    // Don't notify yourself
    if (params.senderId === params.recipientId) return;

    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        message: params.message,
        recipientId: params.recipientId,
        senderId: params.senderId,
        mediaId: params.mediaId,
        eventId: params.eventId,
        data: params.data || {}, // This is now perfectly valid
      },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });

    // Emit real-time notification
    emitToUser(params.recipientId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      sender: notification.sender, // TypeScript will now recognize this properly!
      mediaId: notification.mediaId,
      eventId: notification.eventId,
      data: notification.data,
      createdAt: notification.createdAt,
      isRead: false,
    });

    logger.info(
      `Notification created: ${params.type} for user ${params.recipientId}`
    );
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
}

export async function notifyLike(
  likerId: string,
  mediaId: string,
  mediaOwnerId: string
): Promise<void> {
  const liker = await prisma.user.findUnique({
    where: { id: likerId },
    select: { username: true, fullName: true },
  });

  await createNotification({
    type: 'LIKE',
    message: `${liker?.fullName || liker?.username} liked your photo`,
    recipientId: mediaOwnerId,
    senderId: likerId,
    mediaId,
  });
}

export async function notifyComment(
  commenterId: string,
  mediaId: string,
  mediaOwnerId: string,
  commentPreview: string
): Promise<void> {
  const commenter = await prisma.user.findUnique({
    where: { id: commenterId },
    select: { username: true, fullName: true },
  });

  await createNotification({
    type: 'COMMENT',
    message: `${commenter?.fullName || commenter?.username} commented: "${commentPreview.substring(0, 50)}"`,
    recipientId: mediaOwnerId,
    senderId: commenterId,
    mediaId,
  });
}

export async function notifyTag(
  taggerId: string,
  taggedUserId: string,
  mediaId: string
): Promise<void> {
  const tagger = await prisma.user.findUnique({
    where: { id: taggerId },
    select: { username: true, fullName: true },
  });

  await createNotification({
    type: 'TAG',
    message: `${tagger?.fullName || tagger?.username} tagged you in a photo`,
    recipientId: taggedUserId,
    senderId: taggerId,
    mediaId,
  });
}

export async function notifyUpload(
  uploaderId: string,
  eventId: string,
  eventMemberIds: string[]
): Promise<void> {
  const uploader = await prisma.user.findUnique({
    where: { id: uploaderId },
    select: { username: true, fullName: true },
  });

  await Promise.all(
    eventMemberIds
      .filter((id) => id !== uploaderId)
      .map((memberId) =>
        createNotification({
          type: 'UPLOAD',
          message: `${uploader?.fullName || uploader?.username} uploaded new media to an event`,
          recipientId: memberId,
          senderId: uploaderId,
          eventId,
        })
      )
  );
}