import { Injectable } from '@nestjs/common';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 对象存储服务。
 *
 * 复用平台注入的 S3 兼容对象存储配置（COZE_BUCKET_ENDPOINT_URL / COZE_BUCKET_NAME），
 * 使用受控 SDK 完成上传与签名 URL 生成，无需显式维护 AK/SK。
 */
@Injectable()
export class UploadService {
  private storage: S3Storage | null = null;

  constructor() {
    const endpointUrl = process.env.BUCKET_ENDPOINT_URL || process.env.COZE_BUCKET_ENDPOINT_URL;
    const bucketName = process.env.BUCKET_NAME || process.env.COZE_BUCKET_NAME;
    if (endpointUrl && bucketName) {
      // 使用无参构造：SDK 自动读取平台注入的 COZE_BUCKET_* 并通过受控集成身份完成 S3 签名，
      // 无需显式维护 AK/SK。
      this.storage = new S3Storage({
        endpointUrl,
        bucketName,
      });
    }
  }

  /** 校验对象存储是否已初始化，未初始化时抛出明确错误 */
  private ensureReady(): S3Storage {
    if (!this.storage) {
      throw new Error(
        '对象存储未配置：请先设置 BUCKET_ENDPOINT_URL / BUCKET_NAME 等环境变量，或由平台注入对应配置。',
      );
    }
    return this.storage;
  }

  async uploadFile(file: Express.Multer.File, category: string = 'uploads') {
    const storage = this.ensureReady();
    let fileContent: Buffer;

    if (file.buffer) {
      fileContent = file.buffer;
    } else if (file.path) {
      const fs = await import('fs/promises');
      fileContent = await fs.readFile(file.path);
    } else {
      throw new Error('无法获取文件内容');
    }

    const safeName = file.originalname.replace(/\s+/g, '_');
    const fileName = `${category}/${Date.now()}_${safeName}`;

    const key = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.mimetype || 'application/octet-stream',
    });

    // 生成具有 30 天有效期的访问 URL
    const url = await storage.generatePresignedUrl({ key, expireTime: 2592000 });

    return {
      key,
      url,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async generatePresignedUrl(key: string, expireTime = 2592000): Promise<string> {
    const storage = this.ensureReady();
    return storage.generatePresignedUrl({ key, expireTime });
  }
}