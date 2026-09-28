const { S3Storage } = require("coze-coding-dev-sdk");
const { readFileSync } = require("fs");

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function main() {
  const buffer = readFileSync("/tmp/bg_home3.png");
  const key = await storage.uploadFile({
    fileContent: buffer,
    fileName: "images/home-bg-v3.png",
    contentType: "image/png",
  });
  console.log("KEY=" + key);
  const url = await storage.generatePresignedUrl({ key, expireTime: 2592000 });
  console.log("URL=" + url);
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});