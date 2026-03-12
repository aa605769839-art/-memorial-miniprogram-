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
const deployPrefix = "h5-admin/gift-configs-v6";

function getContentType(filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg")) return "image/jpeg";
  if (filename.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

const pathToKey = {};

async function uploadDirectory(localPath, relativeDir = "") {
  const entries = fs.readdirSync(localPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(localPath, entry.name);
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      await uploadDirectory(fullPath, relativePath);
    } else {
      const content = fs.readFileSync(fullPath);
      const contentType = getContentType(entry.name);
      const remoteKey = `${deployPrefix}/${relativePath}`;
      
      const key = await storage.uploadFile({
        fileContent: content,
        fileName: remoteKey,
        contentType,
      });
      
      pathToKey[relativePath] = key;
      console.log(`✓ ${relativePath}`);
    }
  }
}

async function deploy() {
  console.log("🚀 开始部署 H5 礼物配置中台页面...\n");
  
  await uploadDirectory(distPath);
  console.log(`\n📤 共上传 ${Object.keys(pathToKey).length} 个文件`);
  
  // 为所有资源生成签名 URL
  console.log("\n🔑 生成资源访问链接...");
  const pathToUrl = {};
  
  for (const [relativePath, key] of Object.entries(pathToKey)) {
    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: 2592000, // 30天
    });
    pathToUrl[relativePath] = url;
  }
  
  // 修改 index.html，使用完整签名 URL
  let html = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
  
  console.log("\n🔧 更新资源引用...");
  Object.entries(pathToKey).forEach(([originalPath, key]) => {
    if (originalPath === "index.html") return;
    
    const dir = path.dirname(originalPath);
    const originalName = path.basename(originalPath);
    const originalRef = dir === "." ? `./${originalName}` : `./${dir}/${originalName}`;
    const fullUrl = pathToUrl[originalPath];
    
    if (html.includes(originalRef)) {
      html = html.split(originalRef).join(fullUrl);
      console.log(`  ${originalRef} -> ${fullUrl.substring(0, 60)}...`);
    }
  });
  
  // 上传修改后的 index.html
  const finalKey = await storage.uploadFile({
    fileContent: Buffer.from(html),
    fileName: `${deployPrefix}/index.html`,
    contentType: "text/html",
  });
  
  console.log(`\n✅ 部署完成`);
  
  const indexUrl = await storage.generatePresignedUrl({
    key: finalKey,
    expireTime: 2592000,
  });
  
  console.log(`\n🌐 访问地址（有效期30天）：`);
  console.log(indexUrl);
}

deploy().catch(console.error);
