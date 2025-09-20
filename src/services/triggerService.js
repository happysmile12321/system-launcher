import { scheduleJob, scheduledJobs } from 'node-schedule';
import { info, success, error, warning } from '../utils/logger.js';
import componentService from './componentService.js';
import { getWorkflow as getWorkflowById } from './workflowService.js';

/**
 * 触发器服务 - 管理各种类型的触发器
 */
class TriggerService {
  constructor() {
    this.cronJobs = new Map(); // 存储Cron任务
    this.webhookHandlers = new Map(); // 存储Webhook处理器
    this.initialized = false;
  }

  /**
   * 初始化触发器服务
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    info('Initializing trigger service...');
    
    try {
      // 初始化组件服务
      await componentService.initialize();
      
      this.initialized = true;
      success('Trigger service initialized successfully');
    } catch (err) {
      error(`Failed to initialize trigger service: ${err.message}`);
      throw err;
    }
  }

  /**
   * 创建Cron触发器
   * @param {string} workflowId - 工作流ID
   * @param {string} cronExpression - Cron表达式
   * @param {Object} workflow - 工作流配置
   */
  async createCronTrigger(workflowId, cronExpression, workflow) {
    try {
      await this.initialize();

      // 验证Cron表达式
      if (!this.validateCronExpression(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // 如果已存在同名任务，先删除
      if (this.cronJobs.has(workflowId)) {
        await this.removeCronTrigger(workflowId);
      }

      // 创建Cron任务
      const job = scheduleJob(workflowId, cronExpression, async () => {
        await this.executeWorkflow(workflowId, workflow);
      });

      if (!job) {
        throw new Error('Failed to create cron job');
      }

      this.cronJobs.set(workflowId, {
        job,
        cronExpression,
        workflow,
        createdAt: new Date()
      });

      info(`Created cron trigger for workflow ${workflowId}: ${cronExpression}`);
      success(`Cron trigger created successfully. Next run: ${job.nextInvocation().toString()}`);

      return {
        workflowId,
        cronExpression,
        nextRun: job.nextInvocation().toString(),
        status: 'active'
      };
    } catch (err) {
      error(`Failed to create cron trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 更新Cron触发器
   * @param {string} workflowId - 工作流ID
   * @param {string} cronExpression - 新的Cron表达式
   */
  async updateCronTrigger(workflowId, cronExpression) {
    try {
      // 获取当前工作流
      const workflow = await getWorkflowById(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // 重新创建触发器
      return await this.createCronTrigger(workflowId, cronExpression, workflow);
    } catch (err) {
      error(`Failed to update cron trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除Cron触发器
   * @param {string} workflowId - 工作流ID
   */
  async removeCronTrigger(workflowId) {
    try {
      const trigger = this.cronJobs.get(workflowId);
      if (trigger) {
        trigger.job.cancel();
        this.cronJobs.delete(workflowId);
        info(`Removed cron trigger for workflow ${workflowId}`);
      }
    } catch (err) {
      error(`Failed to remove cron trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 执行工作流
   * @param {string} workflowId - 工作流ID
   * @param {Object} workflow - 工作流配置
   */
  async executeWorkflow(workflowId, workflow) {
    try {
      info(`Executing workflow: ${workflowId}`);
      
      if (!workflow.enabled) {
        warning(`Workflow ${workflowId} is disabled, skipping execution`);
        return;
      }

      // 执行工作流的每个步骤
      for (const step of workflow.steps || []) {
        await this.executeStep(step, workflowId);
      }

      success(`Workflow ${workflowId} executed successfully`);
    } catch (err) {
      error(`Failed to execute workflow ${workflowId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 执行工作流步骤
   * @param {Object} step - 步骤配置
   * @param {string} workflowId - 工作流ID
   */
  async executeStep(step, workflowId) {
    try {
      info(`Executing step: ${step.name || step.id}`);

      // 这里可以根据步骤类型执行不同的逻辑
      // 目前支持组件执行
      if (step.component) {
        await this.executeComponentStep(step, workflowId);
      } else if (step.script) {
        await this.executeScriptStep(step, workflowId);
      } else {
        warning(`Unknown step type in workflow ${workflowId}`);
      }
    } catch (err) {
      error(`Failed to execute step ${step.name || step.id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 执行组件步骤
   * @param {Object} step - 步骤配置
   * @param {string} workflowId - 工作流ID
   */
  async executeComponentStep(step, workflowId) {
    try {
      const { componentType, componentName, inputs } = step.component;
      
      const result = await componentService.executeComponent(
        componentType,
        componentName,
        inputs || {},
        { workflowId, stepId: step.id }
      );

      info(`Component step executed successfully: ${componentName}`);
      return result;
    } catch (err) {
      error(`Failed to execute component step: ${err.message}`);
      throw err;
    }
  }

  /**
   * 执行脚本步骤
   * @param {Object} step - 步骤配置
   * @param {string} workflowId - 工作流ID
   */
  async executeScriptStep(step, workflowId) {
    try {
      // 这里可以集成脚本执行逻辑
      // 目前只是记录日志
      info(`Script step execution: ${step.script}`);
      warning('Script execution not yet implemented');
    } catch (err) {
      error(`Failed to execute script step: ${err.message}`);
      throw err;
    }
  }

  /**
   * 验证Cron表达式
   * @param {string} cronExpression - Cron表达式
   * @returns {boolean} - 是否有效
   */
  validateCronExpression(cronExpression) {
    try {
      // 使用node-schedule验证Cron表达式
      const testJob = scheduleJob('test', cronExpression, () => {});
      if (testJob) {
        testJob.cancel();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * 获取所有Cron触发器状态
   */
  getCronTriggersStatus() {
    const triggers = [];
    
    for (const [workflowId, trigger] of this.cronJobs) {
      triggers.push({
        workflowId,
        cronExpression: trigger.cronExpression,
        nextRun: trigger.job.nextInvocation().toString(),
        status: 'active',
        createdAt: trigger.createdAt
      });
    }

    return triggers;
  }

  /**
   * 获取特定Cron触发器状态
   * @param {string} workflowId - 工作流ID
   */
  getCronTriggerStatus(workflowId) {
    const trigger = this.cronJobs.get(workflowId);
    if (!trigger) {
      return null;
    }

    return {
      workflowId,
      cronExpression: trigger.cronExpression,
      nextRun: trigger.job.nextInvocation().toString(),
      status: 'active',
      createdAt: trigger.createdAt
    };
  }

  /**
   * 手动触发工作流执行
   * @param {string} workflowId - 工作流ID
   */
  async triggerWorkflow(workflowId) {
    try {
      const workflow = await getWorkflowById(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      await this.executeWorkflow(workflowId, workflow);
      return { success: true, message: 'Workflow triggered successfully' };
    } catch (err) {
      error(`Failed to trigger workflow: ${err.message}`);
      throw err;
    }
  }

  /**
   * 创建触发器（通用方法）
   * @param {Object} triggerConfig - 触发器配置
   * @returns {Object} - 创建的触发器信息
   */
  async createTrigger(triggerConfig) {
    try {
      const { type, workflowId, config, enabled = true } = triggerConfig;
      
      if (type === 'cron') {
        const workflow = await getWorkflowById(workflowId);
        if (!workflow) {
          throw new Error('Workflow not found');
        }
        return await this.createCronTrigger(workflowId, config.cronExpression, workflow);
      } else if (type === 'webhook') {
        // 创建Webhook触发器
        const webhookId = `webhook-${workflowId}-${Date.now()}`;
        const webhookConfig = {
          id: webhookId,
          name: triggerConfig.name || `Webhook ${workflowId}`,
          type: 'webhook',
          workflowId,
          config: {
            path: config.path || `/webhook/${webhookId}`,
            method: config.method || 'POST',
            ...config
          },
          enabled,
          createdAt: new Date()
        };
        
        this.webhookHandlers.set(webhookId, webhookConfig);
        
        info(`Created webhook trigger: ${webhookId}`);
        return webhookConfig;
      } else {
        throw new Error(`Unsupported trigger type: ${type}`);
      }
    } catch (err) {
      error(`Failed to create trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取所有触发器
   */
  listTriggers() {
    const triggers = [];
    
    // 添加Cron触发器
    for (const [workflowId, trigger] of this.cronJobs) {
      triggers.push({
        id: workflowId,
        name: `Cron ${workflowId}`,
        type: 'cron',
        workflowId,
        config: {
          cronExpression: trigger.cronExpression
        },
        enabled: true,
        createdAt: trigger.createdAt
      });
    }
    
    // 添加Webhook触发器
    for (const [webhookId, trigger] of this.webhookHandlers) {
      triggers.push(trigger);
    }
    
    return triggers;
  }

  /**
   * 更新触发器
   * @param {string} triggerId - 触发器ID
   * @param {Object} updates - 更新内容
   */
  async updateTrigger(triggerId, updates) {
    try {
      // 检查是否是Cron触发器
      if (this.cronJobs.has(triggerId)) {
        if (updates.enabled === false) {
          await this.removeCronTrigger(triggerId);
        }
        return { success: true };
      }
      
      // 检查是否是Webhook触发器
      if (this.webhookHandlers.has(triggerId)) {
        const trigger = this.webhookHandlers.get(triggerId);
        const updatedTrigger = { ...trigger, ...updates };
        this.webhookHandlers.set(triggerId, updatedTrigger);
        return updatedTrigger;
      }
      
      throw new Error('Trigger not found');
    } catch (err) {
      error(`Failed to update trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除触发器
   * @param {string} triggerId - 触发器ID
   */
  async deleteTrigger(triggerId) {
    try {
      // 检查是否是Cron触发器
      if (this.cronJobs.has(triggerId)) {
        await this.removeCronTrigger(triggerId);
        return { success: true };
      }
      
      // 检查是否是Webhook触发器
      if (this.webhookHandlers.has(triggerId)) {
        this.webhookHandlers.delete(triggerId);
        info(`Deleted webhook trigger: ${triggerId}`);
        return { success: true };
      }
      
      throw new Error('Trigger not found');
    } catch (err) {
      error(`Failed to delete trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 清理所有触发器
   */
  async cleanup() {
    try {
      // 清理Cron任务
      for (const [workflowId, trigger] of this.cronJobs) {
        trigger.job.cancel();
      }
      this.cronJobs.clear();

      // 清理Webhook处理器
      this.webhookHandlers.clear();

      info('All triggers cleaned up');
    } catch (err) {
      error(`Failed to cleanup triggers: ${err.message}`);
    }
  }
}

// 创建单例实例
const triggerService = new TriggerService();

export default triggerService;
export { TriggerService, triggerService as createTrigger, triggerService as listTriggers, triggerService as updateTrigger, triggerService as deleteTrigger };