import { S3Storage } from "coze-coding-dev-sdk";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

const distPath = "./dist-web";
const deployPrefix = "h5-admin/gift-configs";

async function uploadDirectory(localPath: string, remotePrefix: string) {
  const files = await readdir(localPath, { withFileTypes: true });
  const uploadedKeys: string[] = [];

  for (const file of files) {
    const localFilePath = join(localPath, file.name);
    const remoteKey = `${remotePrefix}/${file.name}`;

    if (file.isDirectory()) {
      const subKeys = await uploadDirectory(localFilePath, remoteKey);
      uploadedKeys.push(...subKeys);
    } else {
      const content = await readFile(localFilePath);
      const contentType = getContentType(file.name);
      const key = await storage.uploadFile({
        fileContent: content,
        fileName: remoteKey,
        contentType,
      });
      uploadedKeys.push(key);
      console.log(`Uploaded: ${file.name} -> ${key}`);
    }
  }

  return uploadedKeys;
}

function getContentType(filename: string): string {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".svg")) return "image/svg+xml";
  if (filename.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

async function deploy() {
  console.log("开始部署 H5 中台页面...");
  const keys = await uploadDirectory(distPath, deployPrefix);
  console.log(`\n共上传 ${keys.length} 个文件`);

  // 生成 index.html 的访问地址
  const indexKey = keys.find(k => k.endsWith("/index.html"));
  if (indexKey) {
    const url = await storage.generatePresignedUrl({
      key: indexKey,
      expireTime: 2592000, // 30天
    });
    console.log(`\n🎉 部署成功！访问地址：`);
    console.log(url);
  }
}

deploy().catch(console.error);
