import { v4 as uuidv4 } from 'uuid';
import { info, success, error, warning } from '../utils/logger.js';
import triggerService from './triggerService.js';
import { getWorkflow as getWorkflowById } from './workflowService.js';

/**
 * 异步任务队列服务
 */
class TaskQueueService {
  constructor() {
    this.taskQueue = [];
    this.runningTasks = new Map();
    this.completedTasks = new Map();
    this.isProcessing = false;
    this.maxConcurrentTasks = 5;
    this.taskTimeout = 300000; // 5分钟超时
  }

  /**
   * 添加任务到队列
   * @param {Object} taskData - 任务数据
   * @returns {string} - 任务ID
   */
  async addTask(taskData) {
    const taskId = uuidv4();
    const task = {
      id: taskId,
      type: taskData.type || 'webhook',
      workflowId: taskData.workflowId,
      payload: taskData.payload || {},
      status: 'queued',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      retryCount: 0,
      maxRetries: taskData.maxRetries || 3
    };

    this.taskQueue.push(task);
    info(`Task added to queue: ${taskId}`);

    // 如果队列处理器没有运行，启动它
    if (!this.isProcessing) {
      this.startProcessor();
    }

    return taskId;
  }

  /**
   * 启动任务处理器
   */
  startProcessor() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    info('Task queue processor started');
    this.processQueue();
  }

  /**
   * 停止任务处理器
   */
  stopProcessor() {
    this.isProcessing = false;
    info('Task queue processor stopped');
  }

  /**
   * 处理任务队列
   */
  async processQueue() {
    while (this.isProcessing) {
      try {
        // 检查是否有可用的任务槽位
        if (this.runningTasks.size >= this.maxConcurrentTasks) {
          await this.sleep(1000);
          continue;
        }

        // 获取下一个任务
        const task = this.taskQueue.shift();
        if (!task) {
          await this.sleep(1000);
          continue;
        }

        // 执行任务
        this.executeTask(task);
      } catch (err) {
        error(`Task queue processor error: ${err.message}`);
        await this.sleep(5000);
      }
    }
  }

  /**
   * 执行单个任务
   * @param {Object} task - 任务对象
   */
  async executeTask(task) {
    const { id: taskId } = task;
    
    try {
      // 标记任务为运行中
      task.status = 'running';
      task.startedAt = new Date();
      this.runningTasks.set(taskId, task);

      info(`Executing task: ${taskId}`);

      // 根据任务类型执行不同的逻辑
      let result;
      switch (task.type) {
        case 'webhook':
          result = await this.executeWebhookTask(task);
          break;
        case 'workflow':
          result = await this.executeWorkflowTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // 任务成功完成
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      this.completedTasks.set(taskId, task);
      this.runningTasks.delete(taskId);

      success(`Task completed successfully: ${taskId}`);
    } catch (err) {
      error(`Task execution failed: ${taskId} - ${err.message}`);
      
      // 检查是否需要重试
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'queued';
        task.error = err.message;
        this.taskQueue.push(task); // 重新加入队列
        warning(`Task ${taskId} queued for retry (${task.retryCount}/${task.maxRetries})`);
      } else {
        // 任务最终失败
        task.status = 'failed';
        task.completedAt = new Date();
        task.error = err.message;
        this.completedTasks.set(taskId, task);
      }
      
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 执行Webhook任务
   * @param {Object} task - 任务对象
   */
  async executeWebhookTask(task) {
    const { workflowId, payload } = task;
    
    // 获取工作流
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    // 执行工作流
    const result = await triggerService.executeWorkflow(workflowId, workflow);
    
    return {
      workflowId,
      result,
      webhookPayload: payload
    };
  }

  /**
   * 执行工作流任务
   * @param {Object} task - 任务对象
   */
  async executeWorkflowTask(task) {
    const { workflowId, payload } = task;
    
    // 获取工作流
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // 执行工作流
    const result = await triggerService.executeWorkflow(workflowId, workflow);
    
    return {
      workflowId,
      result,
      taskPayload: payload
    };
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   */
  getTaskStatus(taskId) {
    // 检查运行中的任务
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      return {
        id: taskId,
        status: 'running',
        progress: 'executing',
        startedAt: runningTask.startedAt,
        estimatedCompletion: new Date(runningTask.startedAt.getTime() + this.taskTimeout)
      };
    }

    // 检查已完成的任务
    const completedTask = this.completedTasks.get(taskId);
    if (completedTask) {
      return {
        id: taskId,
        status: completedTask.status,
        result: completedTask.result,
        error: completedTask.error,
        createdAt: completedTask.createdAt,
        startedAt: completedTask.startedAt,
        completedAt: completedTask.completedAt,
        retryCount: completedTask.retryCount
      };
    }

    // 检查队列中的任务
    const queuedTask = this.taskQueue.find(task => task.id === taskId);
    if (queuedTask) {
      return {
        id: taskId,
        status: 'queued',
        progress: `Position ${this.taskQueue.indexOf(queuedTask) + 1} in queue`,
        createdAt: queuedTask.createdAt,
        estimatedStart: this.estimateStartTime(queuedTask)
      };
    }

    return null;
  }

  /**
   * 估算任务开始时间
   * @param {Object} task - 任务对象
   */
  estimateStartTime(task) {
    const queuePosition = this.taskQueue.indexOf(task);
    const avgTaskTime = 30000; // 假设平均任务执行时间30秒
    const estimatedWaitTime = queuePosition * avgTaskTime;
    return new Date(Date.now() + estimatedWaitTime);
  }

  /**
   * 获取队列统计信息
   */
  getQueueStats() {
    return {
      queued: this.taskQueue.length,
      running: this.runningTasks.size,
      completed: this.completedTasks.size,
      isProcessing: this.isProcessing,
      maxConcurrentTasks: this.maxConcurrentTasks
    };
  }

  /**
   * 清理已完成的任务（保留最近100个）
   */
  cleanupCompletedTasks() {
    const completedTasks = Array.from(this.completedTasks.values());
    if (completedTasks.length > 100) {
      // 按完成时间排序，保留最新的100个
      completedTasks.sort((a, b) => b.completedAt - a.completedAt);
      const toKeep = completedTasks.slice(0, 100);
      
      this.completedTasks.clear();
      toKeep.forEach(task => {
        this.completedTasks.set(task.id, task);
      });
      
      info(`Cleaned up completed tasks, kept ${toKeep.length} most recent`);
    }
  }

  /**
   * 睡眠函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 停止所有任务并清理
   */
  async shutdown() {
    this.stopProcessor();
    
    // 等待运行中的任务完成
    while (this.runningTasks.size > 0) {
      await this.sleep(1000);
    }
    
    // 清理资源
    this.taskQueue = [];
    this.completedTasks.clear();
    
    info('Task queue service shutdown complete');
  }
}

// 创建单例实例
const taskQueueService = new TaskQueueService();

export default taskQueueService;
export { TaskQueueService };
