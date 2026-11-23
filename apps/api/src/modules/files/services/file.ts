import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { config } from '../../../config';

const getS3Client = () =>
  new S3Client({
    forcePathStyle: true,
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });

export class FileService {
  static upload = async (file: Express.Multer.File): Promise<string> => {
    const key = `${randomUUID()}-${file.originalname}`;
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return key;
  };

  static getFile = async (key: string): Promise<string> => {
    if (config.s3.publicUpload) {
      if (!config.s3.publicUrl)
        throw new Error(
          'AWS_PUBLIC_URL must be set when AWS_FILE_UPLOAD_TYPE is "public"'
        );
      return `${config.s3.publicUrl}/${encodeURIComponent(key)}`;
    }
    return getSignedUrl(
      getS3Client(),
      new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }),
      { expiresIn: 3600 }
    );
  };
}
