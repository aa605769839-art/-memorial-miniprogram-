# ---- 后端 API 镜像 (纪念小程序) ----
# 运行镜像：仅拷贝本地通过 `pnpm deploy` 生成的独立部署包，无任何编译
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

# 拷贝完整独立部署包（含 node_modules + dist + init）
COPY server/ /app/

EXPOSE 3000
CMD ["node", "dist/main.js"]