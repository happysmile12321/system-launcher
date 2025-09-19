import express from 'express';
import taskQueueService from '../../services/taskQueueService.js';
import { getWorkflow as getWorkflowById } from '../../services/workflowService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 处理Webhook调用 - 异步任务队列版本
 */
router.post('/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    info(`Webhook调用: ${workflowId} from ${clientIp}`);
    
    // 验证工作流是否存在
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      error(`工作流不存在: ${workflowId}`);
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }
    
    if (!workflow.enabled) {
      error(`工作流已禁用: ${workflowId}`);
      return res.status(403).json({
        success: false,
        error: '工作流已禁用'
      });
    }
    
    // 创建异步任务
    const taskId = await taskQueueService.addTask({
      type: 'webhook',
      workflowId,
      payload: {
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        ip: clientIp,
        timestamp: new Date().toISOString()
      }
    });
    
    success(`Webhook任务已创建: ${taskId}`);
    
    // 立即返回202 Accepted
    res.status(202).json({
      success: true,
      message: 'Webhook任务已接受，正在异步处理',
      taskId,
      statusUrl: `/api/webhook/status/${taskId}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    error(`Webhook调用失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Webhook调用失败'
    });
  }
});

/**
 * 处理GET请求（用于测试）
 */
router.get('/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    info(`Webhook测试调用: ${workflowId} from ${clientIp}`);
    
    // 验证工作流是否存在
    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }
    
    if (!workflow.enabled) {
      return res.status(403).json({
        success: false,
        error: '工作流已禁用'
      });
    }
    
    // 创建异步任务
    const taskId = await taskQueueService.addTask({
      type: 'webhook',
      workflowId,
      payload: {
        method: req.method,
        headers: req.headers,
        body: '',
        query: req.query,
        ip: clientIp,
        timestamp: new Date().toISOString()
      }
    });
    
    res.status(202).json({
      success: true,
      message: 'Webhook测试任务已创建',
      taskId,
      statusUrl: `/api/webhook/status/${taskId}`,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    error(`Webhook测试失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Webhook测试失败'
    });
  }
});

/**
 * 获取任务状态
 */
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const taskStatus = taskQueueService.getTaskStatus(taskId);
    
    if (!taskStatus) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: taskStatus
    });
    
  } catch (err) {
    error(`获取任务状态失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '获取任务状态失败'
    });
  }
});

/**
 * 获取队列统计信息
 */
router.get('/stats/queue', async (req, res) => {
  try {
    const stats = taskQueueService.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (err) {
    error(`获取队列统计失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '获取队列统计失败'
    });
  }
});

export default router;
