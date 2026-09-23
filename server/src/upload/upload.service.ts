import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * 对象存储配置解析。
 *
 * 完全脱离 Coze 平台，使用任意 S3 兼容对象存储（MinIO / COS / OSS / S3）：
 *   BUCKET_ENDPOINT_URL  - 服务端点
 *   BUCKET_ACCESS_KEY    - Access Key
 *   BUCKET_SECRET_KEY    - Secret Key
 *   BUCKET_NAME          - Bucket 名称
 *   BUCKET_REGION        - 区域（默认 cn-beijing）
 *   BUCKET_PUBLIC_URL    - （可选）公网访问前缀，用于签名 URL 展示
 */
interface BucketConfig {
  endpointUrl: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
}

function resolveBucketConfig(): BucketConfig {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (process.env[k] && process.env[k]!.trim()) return process.env[k]!.trim();
    }
    return '';
  };

  return {
    endpointUrl: get('BUCKET_ENDPOINT_URL', 'COZE_BUCKET_ENDPOINT_URL'),
    accessKey: get('BUCKET_ACCESS_KEY', 'COZE_BUCKET_ACCESS_KEY'),
    secretKey: get('BUCKET_SECRET_KEY', 'COZE_BUCKET_SECRET_KEY'),
    bucketName: get('BUCKET_NAME', 'COZE_BUCKET_NAME'),
    region: get('BUCKET_REGION', 'COZE_BUCKET_REGION') || 'cn-beijing',
  };
}

@Injectable()
export class UploadService {
  private cfg: BucketConfig;
  private client: S3Client;

  constructor() {
    this.cfg = resolveBucketConfig();
    // 对象存储配置未就绪时不抛异常，允许应用独立启动；
    // 相关上传接口在调用时返回明确错误，避免阻断其他功能。
    if (this.cfg.endpointUrl && this.cfg.bucketName) {
      this.client = new S3Client({
        region: this.cfg.region,
        forcePathStyle: true, // 兼容 MinIO 等私有 S3
        endpoint: this.cfg.endpointUrl,
        credentials: {
          accessKeyId: this.cfg.accessKey,
          secretAccessKey: this.cfg.secretKey,
        },
      });
    }
  }

  /** 校验对象存储是否已初始化，未初始化时抛出明确错误 */
  private ensureReady(): S3Client {
    if (!this.client) {
      throw new Error(
        '对象存储未配置：请先设置 BUCKET_ENDPOINT_URL / BUCKET_NAME 等环境变量，或由平台注入对应配置。',
      );
    }
    return this.client;
  }

  async uploadFile(file: Express.Multer.File, category: string = 'uploads') {
    const client = this.ensureReady();
    let fileContent: Buffer;

    if (file.buffer) {
      fileContent = file.buffer;
    } else if (file.path) {
      const fs = await import('fs/promises');
      fileContent = await fs.readFile(file.path);
    } else {
      throw new Error('无法获取文件内容');
    }

    const fileName = `${category}/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;

    await client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: file.mimetype,
      }),
    );

    // 生成具有 30 天有效期的访问 URL
    const url = await this.generatePresignedUrl(fileName, 2592000);

    return {
      key: fileName,
      url,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async generatePresignedUrl(key: string, expireTime = 2592000): Promise<string> {
    const client = this.ensureReady();
    const command = new GetObjectCommand({
      Bucket: this.cfg.bucketName,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: expireTime });
  }
}