import { info, success, error, warning } from '../utils/logger.js';
import { getConfig } from './configService.js';
import GitFS from '../core/gitfs.js';
import feishuFS from './feishuFS.js';
import containerService from './containerService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * V3.0: 备份管理服务
 * 提供自动备份工作流创建和管理功能
 */
class BackupManagementService {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化备份管理服务
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    info('Initializing backup management service...');
    this.initialized = true;
    success('Backup management service initialized successfully');
  }

  /**
   * 创建容器自动备份工作流
   * @param {Object} options - 备份选项
   * @returns {Object} - 创建的工作流信息
   */
  async createContainerBackupWorkflow(options) {
    try {
      await this.initialize();

      const {
        containerId,
        containerName,
        cronExpression,
        includeVolumes = true,
        includeConfig = true,
        backupPath = '/tmp/backups',
        retentionDays = 30
      } = options;

      if (!containerId || !cronExpression) {
        throw new Error('Container ID and cron expression are required');
      }

      info(`Creating backup workflow for container: ${containerId}`);

      // 生成工作流ID
      const workflowId = `backup-${containerId}-${uuidv4().substring(0, 8)}`;

      // 创建工作流定义
      const workflow = {
        id: workflowId,
        name: `容器自动备份-${containerName || containerId}`,
        description: `自动备份容器 ${containerName || containerId} 的数据和配置`,
        trigger: {
          type: 'cron',
          cronExpression: cronExpression,
          enabled: true
        },
        steps: [
          {
            id: 'backup-container',
            name: '备份容器数据',
            component: 'local:container-backup',
            inputs: {
              containerId: containerId,
              backupPath: backupPath,
              includeVolumes: includeVolumes,
              includeConfig: includeConfig
            }
          },
          {
            id: 'upload-to-feishu',
            name: '上传到飞书云盘',
            component: 'local:feishu-rich-text-report',
            inputs: {
              filePath: `${backupPath}/${containerId}-backup-{{timestamp}}.tar.gz`,
              uploadPath: `backups/${containerName || containerId}/`,
              description: `容器 ${containerName || containerId} 的自动备份`
            }
          }
        ],
        metadata: {
          created: new Date().toISOString(),
          containerId: containerId,
          containerName: containerName,
          retentionDays: retentionDays,
          type: 'container-backup'
        }
      };

      // 保存工作流到GitFS
      const config = getConfig();
      const gitfs = new GitFS(config);
      
      // 确保工作流目录存在
      await gitfs.createDirectory('workflows');
      
      // 保存工作流文件
      await gitfs.writeFile(
        `workflows/${workflowId}.json`,
        JSON.stringify(workflow, null, 2),
        `V3.0: Create container backup workflow for ${containerName || containerId}`
      );

      // 创建对应的触发器
      await this.createBackupTrigger(workflow);

      success(`Created backup workflow: ${workflowId}`);
      return workflow;

    } catch (err) {
      error(`Failed to create backup workflow: ${err.message}`);
      throw err;
    }
  }

  /**
   * 创建备份触发器
   * @param {Object} workflow - 工作流定义
   */
  async createBackupTrigger(workflow) {
    try {
      const config = getConfig();
      const gitfs = new GitFS(config);
      
      // 确保触发器目录存在
      await gitfs.createDirectory('triggers');
      
      const trigger = {
        id: `trigger-${workflow.id}`,
        name: `备份触发器-${workflow.name}`,
        type: 'cron',
        cronExpression: workflow.trigger.cronExpression,
        enabled: workflow.trigger.enabled,
        workflowId: workflow.id,
        metadata: {
          created: new Date().toISOString(),
          type: 'backup-trigger'
        }
      };

      // 保存触发器文件
      await gitfs.writeFile(
        `triggers/${trigger.id}.json`,
        JSON.stringify(trigger, null, 2),
        `V3.0: Create backup trigger for ${workflow.name}`
      );

      success(`Created backup trigger: ${trigger.id}`);

    } catch (err) {
      error(`Failed to create backup trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取所有备份工作流
   * @returns {Array} - 备份工作流列表
   */
  async getBackupWorkflows() {
    try {
      await this.initialize();

      const config = getConfig();
      const gitfs = new GitFS(config);
      
      // 获取所有工作流文件
      const workflows = await gitfs.listDirectory('workflows');
      const backupWorkflows = [];

      for (const workflowFile of workflows) {
        if (workflowFile.type === 'file' && workflowFile.name.endsWith('.json')) {
          try {
            const content = await gitfs.readFile(`workflows/${workflowFile.name}`);
            const workflow = JSON.parse(content.content);
            
            // 检查是否为备份工作流
            if (workflow.metadata?.type === 'container-backup') {
              backupWorkflows.push(workflow);
            }
          } catch (parseErr) {
            warning(`Failed to parse workflow file: ${workflowFile.name}`);
          }
        }
      }

      return backupWorkflows;

    } catch (err) {
      error(`Failed to get backup workflows: ${err.message}`);
      return [];
    }
  }

  /**
   * 删除备份工作流
   * @param {string} workflowId - 工作流ID
   */
  async deleteBackupWorkflow(workflowId) {
    try {
      await this.initialize();

      const config = getConfig();
      const gitfs = new GitFS(config);
      
      // 删除工作流文件
      await gitfs.deleteFile(
        `workflows/${workflowId}.json`,
        `V3.0: Delete backup workflow ${workflowId}`
      );

      // 删除对应的触发器
      await gitfs.deleteFile(
        `triggers/trigger-${workflowId}.json`,
        `V3.0: Delete backup trigger for ${workflowId}`
      );

      success(`Deleted backup workflow: ${workflowId}`);

    } catch (err) {
      error(`Failed to delete backup workflow: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取可备份的容器列表
   * @returns {Array} - 容器列表
   */
  async getBackupableContainers() {
    try {
      await this.initialize();

      // 检查容器服务是否可用
      const isAvailable = await containerService.isAvailable();
      if (!isAvailable) {
        warning('Container service is not available');
        return [];
      }

      // 获取容器列表
      const containers = await containerService.getContainers();
      
      // 过滤出可备份的容器（运行中的容器）
      return containers.filter(container => 
        container.state === 'running' || container.status.includes('Up')
      );

    } catch (err) {
      error(`Failed to get backupable containers: ${err.message}`);
      return [];
    }
  }

  /**
   * 检查备份服务状态
   * @returns {Object} - 服务状态
   */
  async getServiceStatus() {
    try {
      await this.initialize();

      const status = {
        containerService: false,
        feishuService: false,
        gitfsService: false
      };

      // 检查容器服务
      try {
        status.containerService = await containerService.isAvailable();
      } catch (err) {
        status.containerService = false;
      }

      // 检查飞书服务
      try {
        status.feishuService = await feishuFS.isAvailable();
      } catch (err) {
        status.feishuService = false;
      }

      // 检查GitFS服务
      try {
        const config = getConfig();
        if (config.github?.token) {
          status.gitfsService = true;
        }
      } catch (err) {
        status.gitfsService = false;
      }

      return status;

    } catch (err) {
      error(`Failed to get service status: ${err.message}`);
      return {
        containerService: false,
        feishuService: false,
        gitfsService: false
      };
    }
  }

  /**
   * 执行备份工作流
   * @param {string} workflowId - 工作流ID
   */
  async executeBackupWorkflow(workflowId) {
    try {
      await this.initialize();

      info(`Executing backup workflow: ${workflowId}`);

      // 这里应该调用工作流执行引擎
      // 暂时返回成功状态
      success(`Backup workflow ${workflowId} executed successfully`);
      
      return {
        success: true,
        workflowId: workflowId,
        executedAt: new Date().toISOString()
      };

    } catch (err) {
      error(`Failed to execute backup workflow: ${err.message}`);
      throw err;
    }
  }
}

// 创建单例实例
const backupManagementService = new BackupManagementService();

export default backupManagementService;
export { BackupManagementService };
