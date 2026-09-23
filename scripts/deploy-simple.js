const { S3Storage } = require("coze-coding-dev-sdk");
const fs = require("fs");
const path = require("path");

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

const deployPrefix = "h5-admin/simple-v1";

async function deploy() {
  console.log("🚀 部署简化版礼物配置中台...\n");
  
  const html = fs.readFileSync("./dist-web/simple-admin.html");
  const key = await storage.uploadFile({
    fileContent: html,
    fileName: `${deployPrefix}/index.html`,
    contentType: "text/html",
  });
  
  const url = await storage.generatePresignedUrl({
    key: key,
    expireTime: 2592000,
  });
  
  console.log("\n🌐 简化版访问地址（有效期30天）：");
  console.log(url);
}

deploy().catch(console.error);
