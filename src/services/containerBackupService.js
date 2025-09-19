import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ContainerBackupService {
  constructor() {
    this.workflowService = null;
    this.triggerService = null;
    this.componentService = null;
  }

  // 注入依赖服务
  setServices(workflowService, triggerService, componentService) {
    this.workflowService = workflowService;
    this.triggerService = triggerService;
    this.componentService = componentService;
  }

  /**
   * 为容器创建自动备份工作流
   * @param {Object} options - 备份配置选项
   * @param {string} options.containerId - 容器ID
   * @param {string} options.cronExpression - Cron表达式
   * @param {string} options.backupPath - 备份路径
   * @param {boolean} options.includeVolumes - 是否包含数据卷
   * @param {boolean} options.includeConfig - 是否包含配置
   * @param {boolean} options.compress - 是否压缩
   * @param {string} options.uploadToFeishu - 是否上传到飞书
   */
  async createAutoBackupWorkflow(options) {
    const {
      containerId,
      cronExpression = '0 2 * * *', // 默认每天凌晨2点
      backupPath = '/tmp/backups',
      includeVolumes = true,
      includeConfig = true,
      compress = true,
      uploadToFeishu = false
    } = options;

    try {
      // 1. 创建Cron触发器
      const trigger = await this.triggerService.createTrigger({
        type: 'cron',
        name: `容器备份-${containerId}`,
        config: {
          cron: cronExpression,
          enabled: true
        }
      });

      // 2. 创建工作流
      const workflow = {
        name: `容器自动备份-${containerId}`,
        description: `自动备份容器 ${containerId} 的数据和配置`,
        trigger: {
          type: 'cron',
          triggerId: trigger.id
        },
        steps: [
          {
            id: 'backup-container',
            name: '备份容器数据',
            component: 'local:container-backup',
            inputs: {
              containerId,
              backupPath,
              includeVolumes,
              includeConfig,
              compress
            }
          }
        ],
        metadata: {
          triggerType: 'cron',
          cronExpression,
          containerId,
          createdBy: 'container-backup-service',
          version: '1.0.0'
        }
      };

      // 如果启用飞书上传，添加上传步骤
      if (uploadToFeishu) {
        workflow.steps.push({
          id: 'upload-to-feishu',
          name: '上传到飞书云盘',
          component: 'local:feishu-rich-text-report',
          inputs: {
            filePath: '{{steps.backup-container.output.backupFile}}',
            fileName: `backup-${containerId}-{{timestamp}}.tar.gz`,
            folderPath: '/容器备份'
          }
        });
      }

      const createdWorkflow = await this.workflowService.createWorkflow(workflow);

      return {
        success: true,
        workflow: createdWorkflow,
        trigger,
        message: `容器 ${containerId} 的自动备份工作流已创建`
      };

    } catch (error) {
      throw new Error(`创建自动备份工作流失败: ${error.message}`);
    }
  }

  /**
   * 获取容器的备份工作流列表
   * @param {string} containerId - 容器ID
   */
  async getContainerBackupWorkflows(containerId) {
    try {
      const workflows = await this.workflowService.getAllWorkflows();
      
      return workflows.filter(workflow => 
        workflow.metadata?.containerId === containerId &&
        workflow.metadata?.createdBy === 'container-backup-service'
      );
    } catch (error) {
      throw new Error(`获取容器备份工作流失败: ${error.message}`);
    }
  }

  /**
   * 删除容器的备份工作流
   * @param {string} workflowId - 工作流ID
   */
  async deleteContainerBackupWorkflow(workflowId) {
    try {
      const workflow = await this.workflowService.getWorkflow(workflowId);
      
      if (!workflow || workflow.metadata?.createdBy !== 'container-backup-service') {
        throw new Error('工作流不存在或不是容器备份工作流');
      }

      // 删除关联的触发器
      if (workflow.trigger?.triggerId) {
        await this.triggerService.deleteTrigger(workflow.trigger.triggerId);
      }

      // 删除工作流
      await this.workflowService.deleteWorkflow(workflowId);

      return {
        success: true,
        message: '容器备份工作流已删除'
      };
    } catch (error) {
      throw new Error(`删除容器备份工作流失败: ${error.message}`);
    }
  }

  /**
   * 手动执行容器备份
   * @param {string} containerId - 容器ID
   * @param {Object} options - 备份选项
   */
  async executeManualBackup(containerId, options = {}) {
    try {
      const {
        backupPath = '/tmp/backups',
        includeVolumes = true,
        includeConfig = true,
        compress = true
      } = options;

      // 加载容器备份组件
      const component = await this.componentService.getComponent('local', 'container-backup');
      if (!component) {
        throw new Error('容器备份组件未找到');
      }

      // 执行备份
      const result = await this.componentService.executeComponent('local', 'container-backup', {
        containerId,
        backupPath,
        includeVolumes,
        includeConfig,
        compress
      });

      return {
        success: true,
        result,
        message: `容器 ${containerId} 备份完成`
      };
    } catch (error) {
      throw new Error(`手动备份失败: ${error.message}`);
    }
  }

  /**
   * 获取备份历史记录
   * @param {string} containerId - 容器ID
   * @param {string} backupPath - 备份路径
   */
  async getBackupHistory(containerId, backupPath = '/tmp/backups') {
    try {
      const backupFiles = [];
      
      try {
        const files = await fs.readdir(backupPath);
        
        for (const file of files) {
          if (file.includes(containerId) && (file.endsWith('.tar.gz') || file.startsWith('backup-'))) {
            const filePath = path.join(backupPath, file);
            const stats = await fs.stat(filePath);
            
            backupFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            });
          }
        }
      } catch (error) {
        // 备份目录不存在或无法访问
        console.warn(`无法访问备份目录 ${backupPath}:`, error.message);
      }

      // 按创建时间排序
      backupFiles.sort((a, b) => b.created - a.created);

      return backupFiles;
    } catch (error) {
      throw new Error(`获取备份历史失败: ${error.message}`);
    }
  }

  /**
   * 清理过期备份
   * @param {string} containerId - 容器ID
   * @param {number} keepDays - 保留天数
   * @param {string} backupPath - 备份路径
   */
  async cleanupOldBackups(containerId, keepDays = 30, backupPath = '/tmp/backups') {
    try {
      const backupFiles = await this.getBackupHistory(containerId, backupPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const filesToDelete = backupFiles.filter(file => file.created < cutoffDate);
      let deletedCount = 0;

      for (const file of filesToDelete) {
        try {
          await fs.unlink(file.path);
          deletedCount++;
        } catch (error) {
          console.warn(`删除备份文件失败 ${file.path}:`, error.message);
        }
      }

      return {
        success: true,
        deletedCount,
        message: `已删除 ${deletedCount} 个过期备份文件`
      };
    } catch (error) {
      throw new Error(`清理过期备份失败: ${error.message}`);
    }
  }
}

export default ContainerBackupService;
