# Orchestrator Pro Root Documentation Digest

## 1. Project Snapshot
- **Mission**: Orchestrator Pro delivers a workflow-driven DevOps platform that unifies container management, backups, triggers, and custom components behind a Vue 3 dashboard and Node.js/Express backend (see `README.md`, `PROJECT_SUMMARY.md`).
- **Key Capabilities**: visual workflow builder, Docker Desktop-style container operations, trigger system (cron/webhook/manual/system), GitHub-backed configuration, Feishu integration, and component marketplace foundations.
- **Tech Stack Highlights**: Vue 3 + Vite + Tailwind on the front-end, Node.js 18+ with Express, Octokit-powered GitFS abstraction, execa for process handling, optional Docker/Podman drivers, and Feishu APIs.

## 2. Architecture & Code Map (from `src/` review)
- **CLI (`src/cli/index.js`)**: interactive tool to inspect orchestration state, run Docker/Cloudflare deployments, and bootstrap system services with docker-compose.
- **Core (`src/core/`)**: GitFS wrapper (`gitfs.js`) for GitHub-backed storage, orchestration state helpers (`orchestration.js`), and deployment shims (`deployment.js`).
- **Services (`src/services/`)**: configuration loader/validator (`configService.js`), GitHub config sync (`githubService.js`), container lifecycle APIs (`containerService.js`), scheduler automation (`schedulerService.js`), workflow CRUD backed by GitFS (`workflowService.js`), plus Feishu, backup, trigger, and AI cron utilities.
- **Web Layer (`src/web/`)**: Express app (`server.js`) guarding setup flow, serving Vue assets, mounting REST routes under `/api` (workflows, containers, components, backups, triggers, Feishu webhooks, etc.), and wiring schedulers/websocket services.
- **Components (`components/`)**: executable Node scripts packaged as “official components” for container operations, backups, Feishu reporting, and GitHub file sync.

## 3. Working Agreements (from `AGENTS.md` & toolchain docs)
- **Repo Layout**: runtime logic in `src/`, CLI entry under `src/cli/`, service layer in `src/services/`, shared engines in `src/core/`, web runtime at `src/web/` with static UI under `public/`.
- **Commands**: `npm start` (dashboard after config), `npm run cli`, replace failing `npm test` with real test runner before relying on CI.
- **Style**: native ES modules, two-space indentation, semicolons, camelCase/PascalCase naming, centralised logging through `src/utils/logger.js` for colored severity.
- **Testing Strategy**: mirror `src/` under `tests/`, stub GitHub through GitFS, cover scheduler, CLI, Express routes, and enforce failing-tests-block-merges rule.
- **Git Hygiene**: commit messages `<type>: <summary>`, keep scope tight, ensure `.orchestrator.config.json` remains untracked, verify GitFS-generated commits, never hard-code credentials (use `.env`).

## 4. Feature & Fix Briefs (root change logs)
- **Docker Compose Management (`COMPOSITIONS_MANAGEMENT_SUMMARY.md`)**: documents the end-to-end Compose UI rebuild—dual YAML/visual editors via Monaco, REST endpoints for CRUD/validate/deploy/stop, status badges, and Vue/Tailwind UX patterns.
- **Container Listing Reliability (`DOCKER_CONTAINER_FIX_SUMMARY.md`)**: explains the shift from component table output to native Docker CLI JSON, simplifying `containerService.getContainers()` and mirroring API field names.
- **Image Size Display (`IMAGE_SIZE_FIX_SUMMARY.md`)**: records the Vue-side `formatSize` guard that accepts preformatted strings (`10.1GB`), preserving numeric fallbacks and adding regex detection.
- **UI Overhaul (`UI_ENHANCEMENT_SUMMARY.md`)**: outlines the revamped component/backup management pages, README polish, demo script, Docker/CI configs, and documentation bundle.
- **Project Recap (`PROJECT_SUMMARY.md`)**: high-level digest of features, architecture, deployment paths, metrics, roadmap, and contribution practices.

## 5. Product Direction Artifacts
- **`PRD.md`**: V3.0 mandate focusing on “architecture convergence” and clarified system concepts (workflows, components, triggers, system services, container services) with enforced `.orchestrator-pro/` Git layout.
- **Chinese-Language Notes** (`V2.3`/`V2.4`/`V3.0` reports, 飞书说明, 前端规范): retain historical context and localised guidance; not merged here but keep alongside this digest for native readers.

## 6. Suggested Next Steps
- Treat this digest as the root index; cross-link it from `README.md` or repo wiki if centralised guidance is desired.
- When updating any root document, ensure the corresponding section here reflects the latest decisions so contributors have a single English-language touchpoint.
