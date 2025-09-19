import { getConfig } from './configService.js';
import GitFS from '../core/gitfs.js';
import { info, success, error, warning } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 触发器管理服务 - 负责管理Webhook触发器
 */
class TriggerService {
  constructor() {
    this.triggers = new Map();
    this.requests = new Map(); // 存储调用记录
    this.loaded = false;
  }

  /**
   * 初始化触发器系统
   */
  async initialize() {
    if (this.loaded) {
      return;
    }

    info('Initializing trigger system...');
    
    try {
      await this.loadTriggers();
      this.loaded = true;
      success(`Trigger system initialized successfully. Loaded ${this.triggers.size} triggers.`);
    } catch (err) {
      error(`Failed to initialize trigger system: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取触发器存储路径
   */
  getTriggersPath() {
    return '.orchestrator-pro/triggers';
  }

  /**
   * 获取调用记录存储路径
   */
  getRequestsPath() {
    return '.orchestrator-pro/requests';
  }

  /**
   * 从Git仓库加载触发器
   */
  async loadTriggers() {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        warning('GitHub configuration not found. Skipping triggers load.');
        return;
      }

      const gitfs = new GitFS(config);
      const triggersPath = this.getTriggersPath();
      
      // 列出触发器目录中的所有文件
      const entries = await gitfs.listDirectory(triggersPath);
      
      for (const entry of entries) {
        if (entry.type === 'file' && entry.name.endsWith('.json')) {
          const triggerId = entry.name.replace('.json', '');
          await this.loadTriggerFromGit(gitfs, entry.path, triggerId);
        }
      }
    } catch (err) {
      error(`Failed to load triggers: ${err.message}`);
    }
  }

  /**
   * 从Git仓库加载单个触发器
   */
  async loadTriggerFromGit(gitfs, triggerPath, triggerId) {
    try {
      const fileData = await gitfs.readFile(triggerPath);
      if (!fileData) {
        warning(`Skipping trigger ${triggerId}: file not found`);
        return;
      }

      const trigger = JSON.parse(fileData.content);
      
      // 验证触发器数据
      if (!this.validateTrigger(trigger)) {
        warning(`Skipping trigger ${triggerId}: invalid data`);
        return;
      }

      // 生成Webhook URL
      trigger.url = this.generateWebhookUrl(triggerId);
      
      this.triggers.set(triggerId, trigger);
      info(`Loaded trigger: ${triggerId}`);
    } catch (err) {
      error(`Failed to load trigger ${triggerId}: ${err.message}`);
    }
  }

  /**
   * 验证触发器数据
   */
  validateTrigger(trigger) {
    if (!trigger || typeof trigger !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!trigger.name || !trigger.workflowId) {
      return false;
    }

    return true;
  }

  /**
   * 生成Webhook URL
   */
  generateWebhookUrl(triggerId) {
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/webhook/${triggerId}`;
  }

  /**
   * 创建新触发器
   */
  async createTrigger(triggerData) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        throw new Error('GitHub configuration not found');
      }

      const triggerId = uuidv4();
      const trigger = {
        id: triggerId,
        name: triggerData.name,
        description: triggerData.description || '',
        workflowId: triggerData.workflowId,
        enabled: true,
        createdAt: new Date().toISOString(),
        lastCall: null
      };

      // 验证触发器数据
      if (!this.validateTrigger(trigger)) {
        throw new Error('Invalid trigger data');
      }

      const gitfs = new GitFS(config);
      const triggersPath = this.getTriggersPath();
      const triggerPath = `${triggersPath}/${triggerId}.json`;

      // 确保触发器目录存在
      await gitfs.createDirectory(triggersPath);

      // 写入触发器文件
      await gitfs.writeFile(
        triggerPath,
        JSON.stringify(trigger, null, 2),
        `Create trigger: ${trigger.name}`
      );

      // 生成Webhook URL
      trigger.url = this.generateWebhookUrl(triggerId);

      // 添加到内存缓存
      this.triggers.set(triggerId, trigger);

      success(`Created trigger: ${trigger.name}`);
      return trigger;
    } catch (err) {
      error(`Failed to create trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 更新触发器
   */
  async updateTrigger(triggerId, updateData) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        throw new Error('GitHub configuration not found');
      }

      const existingTrigger = this.triggers.get(triggerId);
      if (!existingTrigger) {
        throw new Error('Trigger not found');
      }

      const updatedTrigger = {
        ...existingTrigger,
        ...updateData,
        id: triggerId // 确保ID不被覆盖
      };

      // 验证触发器数据
      if (!this.validateTrigger(updatedTrigger)) {
        throw new Error('Invalid trigger data');
      }

      const gitfs = new GitFS(config);
      const triggersPath = this.getTriggersPath();
      const triggerPath = `${triggersPath}/${triggerId}.json`;

      // 写入更新的触发器文件
      await gitfs.writeFile(
        triggerPath,
        JSON.stringify(updatedTrigger, null, 2),
        `Update trigger: ${updatedTrigger.name}`
      );

      // 更新内存缓存
      this.triggers.set(triggerId, updatedTrigger);

      success(`Updated trigger: ${updatedTrigger.name}`);
      return updatedTrigger;
    } catch (err) {
      error(`Failed to update trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 删除触发器
   */
  async deleteTrigger(triggerId) {
    try {
      const config = getConfig();
      if (!config || !config.github) {
        throw new Error('GitHub configuration not found');
      }

      const trigger = this.triggers.get(triggerId);
      if (!trigger) {
        throw new Error('Trigger not found');
      }

      const gitfs = new GitFS(config);
      const triggersPath = this.getTriggersPath();
      const triggerPath = `${triggersPath}/${triggerId}.json`;

      // 删除触发器文件
      await gitfs.deleteFile(triggerPath, `Delete trigger: ${trigger.name}`);

      // 从内存缓存中移除
      this.triggers.delete(triggerId);

      // 清理相关的调用记录
      this.requests.delete(triggerId);

      success(`Deleted trigger: ${trigger.name}`);
      return true;
    } catch (err) {
      error(`Failed to delete trigger: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取所有触发器
   */
  async getAllTriggers() {
    await this.initialize();
    return Array.from(this.triggers.values());
  }

  /**
   * 根据ID获取触发器
   */
  async getTrigger(triggerId) {
    await this.initialize();
    return this.triggers.get(triggerId) || null;
  }

  /**
   * 记录Webhook调用
   */
  async recordWebhookCall(triggerId, requestData) {
    try {
      const requestId = uuidv4();
      const request = {
        id: requestId,
        triggerId,
        method: requestData.method || 'POST',
        headers: requestData.headers || {},
        body: requestData.body || '',
        ip: requestData.ip || 'unknown',
        status: requestData.status || 200,
        timestamp: new Date().toISOString()
      };

      // 存储调用记录
      if (!this.requests.has(triggerId)) {
        this.requests.set(triggerId, []);
      }
      
      const triggerRequests = this.requests.get(triggerId);
      triggerRequests.unshift(request); // 最新的在前面
      
      // 只保留最近100条记录
      if (triggerRequests.length > 100) {
        triggerRequests.splice(100);
      }

      // 更新触发器的最后调用时间
      const trigger = this.triggers.get(triggerId);
      if (trigger) {
        trigger.lastCall = request.timestamp;
        this.triggers.set(triggerId, trigger);
      }

      info(`Recorded webhook call for trigger ${triggerId}`);
      return request;
    } catch (err) {
      error(`Failed to record webhook call: ${err.message}`);
      throw err;
    }
  }

  /**
   * 获取触发器的调用记录
   */
  async getTriggerRequests(triggerId) {
    await this.initialize();
    return this.requests.get(triggerId) || [];
  }

  /**
   * 刷新触发器列表
   */
  async refresh() {
    info('Refreshing trigger list...');
    
    this.triggers.clear();
    this.requests.clear();
    this.loaded = false;
    
    await this.initialize();
  }
}

// 创建单例实例
const triggerService = new TriggerService();

export default triggerService;

export { TriggerService };
