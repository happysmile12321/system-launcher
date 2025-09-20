# 🚀 Orchestrator Pro - 生产环境 Dockerfile
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建前端资源
RUN npm run web:build

# 生产环境镜像
FROM node:20-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    git \
    docker-cli \
    curl \
    && rm -rf /var/cache/apk/*

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S orchestrator -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=orchestrator:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=orchestrator:nodejs /app/src ./src
COPY --from=builder --chown=orchestrator:nodejs /app/components ./components
COPY --from=builder --chown=orchestrator:nodejs /app/public ./public
COPY --from=builder --chown=orchestrator:nodejs /app/package*.json ./

# 创建必要的目录
RUN mkdir -p /app/.orchestrator-pro && \
    chown -R orchestrator:nodejs /app/.orchestrator-pro

# 切换到非root用户
USER orchestrator

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动命令
CMD ["npm", "start"]

# 标签信息
LABEL maintainer="Orchestrator Pro Team" \
      version="3.0.0" \
      description="下一代智能系统编排平台" \
      org.opencontainers.image.title="Orchestrator Pro" \
      org.opencontainers.image.description="下一代智能系统编排平台" \
      org.opencontainers.image.version="3.0.0" \
      org.opencontainers.image.source="https://github.com/your-username/orchestrator-pro" \
      org.opencontainers.image.licenses="MIT"
