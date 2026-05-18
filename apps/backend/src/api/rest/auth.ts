import { Router } from 'express';
import { S3Service } from '../../services/s3';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.get('/upload-url', authenticate, async (req: any, res) => {
  const { contentType, folder } = req.query;
  if (!contentType) return res.status(400).json({ error: 'contentType required' });

  const result = await S3Service.generatePresignedUploadUrl(
    req.user.id,
    contentType as string,
    (folder as any) || 'wardrobe'
  );
  res.json(result);
});
