# Orchestrator Pro

下一代智能系统编排平台，面向 DevOps 团队统一工作流、容器、备份与协作场景。此文件聚焦“我该怎么开始开发/了解项目”，详细背景与规范请查阅下述文档索引。

## 1. 立即了解项目
- **核心概览**：阅读《项目总览与规范.md》，掌握架构、运行方式、编码规范与协作流程。
- **历史演进**：若需复盘版本变迁与关键修复，请查看《版本迭代纪要.md》。
- **当前迭代目标**：产品规划及必做列表位于《PRD.md》。

> 进阶资料（操作指南、设计稿、权限说明等）已沉淀到外部知识库；若需访问，请在团队知识站点检索“Orchestrator Pro”。

## 2. 环境与依赖
- 必备软件：Node.js ≥ 18、npm、Git、Docker（容器相关功能）、可选 Cloudflare Wrangler。
- 可选增强：pnpm/volta、Feishu 开发者账号（用于备份与消息模块）。
- 根目录下 `.orchestrator.config.json` 由 CLI/后台生成，**不要加入版本控制**。

## 3. 快速启动
```bash
npm install          # 安装依赖
npm run web:dev      # 前端开发模式（监听编译）
npm start            # 启动 Express + API 服务，默认 http://localhost:3000
```
- CLI 工具：`npm run cli`
- Docker 方案：`docker-compose up -d`
- 首次访问请按页面提示完成 GitHub / 飞书配置。

## 4. 开发者指南
1. **熟悉目录结构**
   ```
   src/
   ├── cli/            # 交互式命令行入口
   ├── core/           # GitFS、编排状态、部署适配
   ├── services/       # 容器、备份、触发器、Feishu、AI Cron 等业务服务
   ├── utils/          # 通用工具（日志、格式化）
   └── web/            # Express 服务与 Vue 3 前端
   components/         # 官方组件（Docker、备份、飞书、GitHub 同步）
   ````
2. **遵循规范**：编码风格、日志接口、测试策略详见《项目总览与规范.md》。
3. **测试与验证**：目前 `npm test` 为占位符；若编写新测试，请在 `tests/` 目录镜像 `src/` 结构并更新 npm 脚本。
4. **提交要求**：commit 信息使用 `<type>: <summary>`，提交前确认 `.orchestrator.config.json` 未入库，PR 需附手动验证步骤与必要截图。

## 5. 文档导航
| 场景 | 建议阅读 |
| --- | --- |
| 快速了解架构、命令、规范 | 《项目总览与规范.md》 |
| 查历史迭代、修复内容 | 《版本迭代纪要.md》 |
| 当前待办与验收标准 | 《PRD.md》 |
| 深入 API / 设计细节 | docs/ 目录与外部知识库 |

## 6. 常用命令速查
| 命令 | 说明 |
| --- | --- |
| `npm run web:dev` | 前端开发环境，支持热更新 |
| `npm start` | 启动 Express 服务（需先构建前端或使用 dev 服务） |
| `npm run cli` | 打开 CLI 工具，包含部署与系统服务操作 |
| `npm run web:build` | 打包前端静态资源到 `src/web/public/app/` |
| `docker-compose up -d` | 一键启动依赖服务与控制台 |

## 7. 建议的日常流程
1. 阅读 PRD 与项目总览，确认任务上下文。
2. 新建分支，完成代码与必要文档更新。
3. 本地运行 `npm run web:dev` + `npm start` 或 `docker-compose up` 验证。
4. 视任务涉及运行 CLI、容器、备份链路时，请记录操作步骤以便 PR 说明。
5. 提交 MR/PR 前自检规范并同步更新对应文档。

如对文档、流程或权限有疑问，请在团队沟通渠道以“[Orchestrator Pro] + 主题”发起讨论。祝开发顺利！
