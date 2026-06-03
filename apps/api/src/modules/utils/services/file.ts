import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const getS3Client = () =>
  new S3Client({
    forcePathStyle: true,
    region: process.env.AWS_REGION!,
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

export class FileService {
  static upload = async (file: Express.Multer.File): Promise<string> => {
    const key = `${randomUUID()}-${file.originalname}`;
    const s3 = getS3Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return key;
  };

  static getFile = async (key: string): Promise<string> => {
    if (process.env.AWS_FILE_UPLOAD_TYPE === 'public') {
      return `https://pub-a3841831c45040bf87348c00c5498163.r2.dev/${process.env.AWS_BUCKET}/${key}`;
    }

    const s3 = getS3Client();
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  };
}
