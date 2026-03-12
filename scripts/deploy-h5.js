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

const distPath = "./dist-web";
const deployPrefix = "h5-admin/gift-configs-v3";

function getContentType(filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".svg")) return "image/svg+xml";
  if (filename.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

// 存储文件名到 key 的映射
const fileMapping = {};
const dirMapping = {};

async function uploadDirectory(localPath, remotePrefix, relativeDir = "") {
  const files = fs.readdirSync(localPath, { withFileTypes: true });

  for (const file of files) {
    const localFilePath = path.join(localPath, file.name);
    const relativePath = relativeDir ? `${relativeDir}/${file.name}` : file.name;
    const remoteKey = `${remotePrefix}/${relativePath}`;

    if (file.isDirectory()) {
      await uploadDirectory(localFilePath, remotePrefix, relativePath);
    } else {
      const content = fs.readFileSync(localFilePath);
      const contentType = getContentType(file.name);
      const key = await storage.uploadFile({
        fileContent: content,
        fileName: remoteKey,
        contentType,
      });
      const storedName = path.basename(key);
      fileMapping[file.name] = storedName;
      dirMapping[relativePath] = storedName;
      console.log(`✓ Uploaded: ${relativePath} -> ${storedName}`);
    }
  }
}

async function deploy() {
  console.log("🚀 开始部署 H5 礼物配置中台页面...\n");
  await uploadDirectory(distPath, deployPrefix);
  
  const uploadedFiles = Object.keys(fileMapping);
  console.log(`\n✅ 共上传 ${uploadedFiles.length} 个文件`);

  // 找到 index.html 的 key
  const indexRelativePath = "index.html";
  const indexKey = Object.entries(dirMapping).find(([k, v]) => k === "index.html")?.[1];
  
  if (!indexKey) {
    console.log("❌ 未找到 index.html");
    return;
  }

  // 读取原始 index.html
  let htmlContent = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
  
  // 替换引用路径
  Object.entries(dirMapping).forEach(([originalPath, storedName]) => {
    if (originalPath !== "index.html") {
      // 将 ./js/app.xxx.js 替换为 ./js/app.xxx_uuid.js
      const originalName = path.basename(originalPath);
      const dir = path.dirname(originalPath);
      const searchPattern = dir === "." ? `./${originalName}` : `./${dir}/${originalName}`;
      const replacePattern = dir === "." ? `./${storedName}` : `./${dir}/${storedName}`;
      htmlContent = htmlContent.replace(new RegExp(searchPattern.replace(/\./g, "\\."), "g"), replacePattern);
    }
  });
  
  // 上传更新后的 index.html
  const updatedHtmlKey = await storage.uploadFile({
    fileContent: Buffer.from(htmlContent),
    fileName: `${deployPrefix}/index.html`,
    contentType: "text/html",
  });
  
  console.log(`\n✓ 已更新并上传 index.html`);
  
  // 生成访问地址
  const url = await storage.generatePresignedUrl({
    key: updatedHtmlKey,
    expireTime: 2592000, // 30天
  });
  
  console.log(`\n🌐 访问地址（有效期30天）：`);
  console.log(url);
}

deploy().catch(console.error);
