产品需求文档 (PRD): Orchestrator Pro V3.1
文档版本	V3.1
主题	精通容器组：标准化与深度集成
关联迭代日志	点击查看 V3.1 实时开发进展 (迭代日志.md)
创建日期	2025年9月20日

导出到 Google 表格
1. 背景
V3.0 版本成功上线了容器管理的基础 UI，用户现在可以查看容器、镜像和容器组。初步反馈显示，“容器组 (Compositions)” 是用户最常用、价值最高的功能模块。然而，目前的功能主要停留在“只读”和简单的启停操作，缺乏对容器组生命周期（特别是其关联数据和网络）的深度管理能力，这限制了其在实际生产场景中的应用。

V3.1 版本的核心使命是：围绕“容器组”，建立一套标准化的数据卷管理规范，并提供一种将容器内服务与工作流无缝集成的“反向代理”机制。

2. V3.1 核心目标
目标 1 (体验优化): 将“容器组”提升为容器管理模块的默认和核心视图。

目标 2 (数据标准化): 引入 LocalFS 抽象层，对所有受管容器组的数据卷、配置和日志，实现统一、规范的本地文件系统存储。

目标 3 (简化编排): 提供表单驱动的 Docker Compose 编辑器，自动执行标准化的目录映射，降低用户心智负担。

目标 4 (深度集成): 提供一键式的工作流代理功能，让用户能轻松地将容器内的服务暴露为可被外部调用的 Webhook。

3. 功能需求 (Functional Requirements)
Epic 1: LocalFS - 标准化容器文件系统 (优先级: P0)
FR-1.1: 引入 LocalFS 服务

需求: 后端需创建一个全新的 LocalFS 服务。该服务是专门用于管理项目根目录下 /backup 目录的抽象文件系统层。

FR-1.2: 强制性的目录结构规范

需求: 当任何一个容器组（例如 my-web-stack）被 Orchestrator Pro 管理时，LocalFS 服务必须幂等地在 /backup 目录下创建并维护以下标准结构：

backup/
└── my-web-stack/
    ├── infra/         # 存放 docker-compose.yml 文件
    ├── config/        # 存放各服务的持久化配置文件
    │   └── <service1_name>/
    │   └── <service2_name>/
    ├── logs/          # 存放各服务的持久化日志文件
    │   └── <service1_name>/
    └── entitydata/    # 存放各服务的核心数据（如数据库文件）
        └── <service1_name>/
FR-1.3: 自动维护 .gitignore

需求: LocalFS 服务在初始化时，必须确保项目根目录的 .gitignore 文件中包含 /backup/ 条目。

Epic 2: 容器组 (Composition) 体验升级 (优先级: P0)
FR-2.1: 调整默认视图

需求: 将“容器管理”页面的默认标签页从“容器”更改为“容器组”。

FR-2.2: 表单驱动的 Compose 编辑器

需求: 在“容器组”页面，点击“新建容器组”或“编辑”时，除了现有的“YAML 视图”，新增一个“表单视图”。

交互: 表单视图允许用户以结构化的方式添加/编辑服务。对于每个服务，用户可以填写服务名、镜像、端口、环境变量等。

核心功能 - 自动卷映射: 在表单的“卷 (Volumes)”配置部分，用户只需填写容器内的路径（例如 postgres 服务的 /var/lib/postgresql/data）。系统在生成 docker-compose.yml 时，必须自动将主机路径映射到 LocalFS 的标准结构，例如：

../../backup/my-web-stack/entitydata/postgres:/var/lib/postgresql/data

FR-2.3: “懒更新”与目录创建

需求: 当用户通过表单保存 Compose 配置时，后端不仅要生成 docker-compose.yml 文件到 infra/ 目录，还必须同时调用 LocalFS 接口，确保所有在 volumes 中定义的主机目录路径都已在本地创建完毕。

Epic 3: 工作流集成 - 容器反向代理 (优先级: P1)
FR-3.1: 新增“容器代理 (Container Proxy)”官方组件

需求: 创建一个新的官方组件，其 component.json 定义了 compositionName, serviceName, targetPort 等输入参数。

功能: 该组件的 index.js 逻辑是：接收一个 HTTP 请求，并将其原封不动地代理到 Docker 网络内部的 http://<serviceName>:<targetPort> 地址。

FR-3.2: 一键“创建工作流代理”

需求: 在“容器组”管理界面，对于正在运行的服务，其服务卡片上应出现一个“创建代理”或“Expose”按钮。

向导流程: 点击该按钮后，系统会弹出一个简单的向导：

让用户为这个新的代理入口命名（这将成为新工作流的名称）。

用户确认后，系统在后台自动完成以下所有操作：

创建一个新的 Webhook 触发器。

创建一个新的工作流。

将上述 Webhook 触发器关联到此工作流。

在工作流中添加一个步骤，使用“容器代理”组件，并自动填充好 compositionName, serviceName, targetPort 等参数。

结果: 用户仅需一步操作，即可获得一个可公网访问的、指向其容器内特定服务的稳定 Webhook URL，并能享受我们平台提供的异步长任务处理、日志记录等所有能力。

4. 任务清单 (Actionable To-Do List)
后端
[ ] LocalFS: 开发全新的 LocalFS 服务，实现对 /backup 目录的增删改查及目录结构维护。

[ ] LocalFS: 确保 LocalFS 服务能自动检查并更新 .gitignore。

[ ] 容器组: 开发根据表单数据生成符合 LocalFS 规范的 docker-compose.yml 的逻辑。

[ ] 容器组: 在保存 Compose 配置时，增加调用 LocalFS 创建目录的逻辑。

[ ] 组件: 开发新的“容器代理 (Container Proxy)”官方组件。

[ ] 工作流: 开发“一键创建工作流代理”的后端 API，实现触发器和工作流的自动化创建。

前端
[ ] UI: 将“容器组”调整为容器管理页面的默认标签页。

[ ] UI: 开发“表单视图”的 Docker Compose 编辑器。

[ ] UI: 在服务卡片上添“创建代理”按钮及其向导流程的 UI。

[ ] API 对接: 对接 LocalFS 和新的容器组管理 API。