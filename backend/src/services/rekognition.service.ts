import {
  RekognitionClient,
  DetectLabelsCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  DeleteFacesCommand,
  DetectFacesCommand,
} from '@aws-sdk/client-rekognition';
import { logger } from '../utils/logger';

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COLLECTION_ID =
  process.env.AWS_REKOGNITION_COLLECTION_ID || 'event-media-faces';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'event-media-platform';

export interface DetectedLabel {
  name: string;
  confidence: number;
}

export interface FaceMatch {
  faceId: string;
  similarity: number;
  boundingBox?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export async function ensureCollectionExists(): Promise<void> {
  try {
    await rekognitionClient.send(
      new CreateCollectionCommand({ CollectionId: COLLECTION_ID })
    );
    logger.info(`Rekognition collection created: ${COLLECTION_ID}`);
  } catch (error: any) {
    if (error.name === 'ResourceAlreadyExistsException') {
      logger.info(`Rekognition collection already exists: ${COLLECTION_ID}`);
    } else {
      logger.error('Failed to create Rekognition collection:', error);
      throw error;
    }
  }
}

export async function detectLabels(
  imageBuffer: Buffer,
  maxLabels = 20,
  minConfidence = 70
): Promise<DetectedLabel[]> {
  try {
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBuffer },
      MaxLabels: maxLabels,
      MinConfidence: minConfidence,
    });

    const response = await rekognitionClient.send(command);

    return (response.Labels || []).map((label) => ({
      name: label.Name || '',
      confidence: label.Confidence || 0,
    }));
  } catch (error) {
    logger.error('Failed to detect labels:', error);
    // Return empty array on failure to not block upload
    return [];
  }
}

export async function indexFace(
  imageBuffer: Buffer,
  userId: string
): Promise<string | null> {
  try {
    await ensureCollectionExists();

    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      ExternalImageId: userId,
      MaxFaces: 1,
      QualityFilter: 'AUTO',
      DetectionAttributes: ['DEFAULT'],
    });

    const response = await rekognitionClient.send(command);

    if (response.FaceRecords && response.FaceRecords.length > 0) {
      const faceId = response.FaceRecords[0].Face?.FaceId;
      logger.info(`Indexed face for user ${userId}: ${faceId}`);
      return faceId || null;
    }

    return null;
  } catch (error) {
    logger.error('Failed to index face:', error);
    throw error;
  }
}

export async function searchFacesByImage(
  imageBuffer: Buffer,
  maxFaces = 10,
  minConfidence = 80
): Promise<FaceMatch[]> {
  try {
    await ensureCollectionExists();

    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      MaxFaces: maxFaces,
      FaceMatchThreshold: minConfidence,
    });

    const response = await rekognitionClient.send(command);

    return (response.FaceMatches || []).map((match) => ({
      faceId: match.Face?.FaceId || '',
      similarity: match.Similarity || 0,
      boundingBox: match.Face?.BoundingBox
        ? {
            top: match.Face.BoundingBox.Top || 0,
            left: match.Face.BoundingBox.Left || 0,
            width: match.Face.BoundingBox.Width || 0,
            height: match.Face.BoundingBox.Height || 0,
          }
        : undefined,
    }));
  } catch (error) {
    logger.error('Failed to search faces:', error);
    return [];
  }
}

export async function deleteFace(faceId: string): Promise<void> {
  try {
    await rekognitionClient.send(
      new DeleteFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceIds: [faceId],
      })
    );
    logger.info(`Deleted face: ${faceId}`);
  } catch (error) {
    logger.error('Failed to delete face:', error);
    throw error;
  }
}

export async function detectFaces(imageBuffer: Buffer): Promise<number> {
  try {
    const command = new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ['DEFAULT'],
    });

    const response = await rekognitionClient.send(command);
    return (response.FaceDetails || []).length;
  } catch (error) {
    logger.error('Failed to detect faces:', error);
    return 0;
  }
}

export async function generateAICaption(labels: DetectedLabel[]): Promise<string> {
  if (labels.length === 0) return '';

  const topLabels = labels
    .filter((l) => l.confidence > 80)
    .slice(0, 5)
    .map((l) => l.name.toLowerCase());

  if (topLabels.length === 0) return '';

  // Simple template-based caption generation
  const templates = [
    `A photo featuring ${topLabels.slice(0, 3).join(', ')}`,
    `Captured moment with ${topLabels.slice(0, 2).join(' and ')}`,
    `${topLabels[0].charAt(0).toUpperCase() + topLabels[0].slice(1)} scene`,
    `${topLabels.slice(0, 3).join(', ')} captured in this moment`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
