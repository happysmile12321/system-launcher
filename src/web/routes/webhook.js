import express from 'express';
import triggerService from '../../services/triggerService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 处理Webhook调用
 */
router.post('/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    info(`Webhook调用: ${triggerId} from ${clientIp}`);
    
    // 获取触发器信息
    const trigger = await triggerService.getTrigger(triggerId);
    
    if (!trigger) {
      error(`Webhook触发器不存在: ${triggerId}`);
      return res.status(404).json({
        success: false,
        error: 'Webhook触发器不存在'
      });
    }
    
    if (!trigger.enabled) {
      error(`Webhook触发器已禁用: ${triggerId}`);
      return res.status(403).json({
        success: false,
        error: 'Webhook触发器已禁用'
      });
    }
    
    // 记录调用
    const requestData = {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
      ip: clientIp,
      status: 200
    };
    
    await triggerService.recordWebhookCall(triggerId, requestData);
    
    // 这里可以添加触发工作流执行的逻辑
    // 目前只是记录调用，实际的工作流触发将在后续实现
    
    success(`Webhook调用成功: ${triggerId}`);
    res.json({
      success: true,
      message: 'Webhook调用成功',
      triggerId,
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
router.get('/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    info(`Webhook测试调用: ${triggerId} from ${clientIp}`);
    
    // 获取触发器信息
    const trigger = await triggerService.getTrigger(triggerId);
    
    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: 'Webhook触发器不存在'
      });
    }
    
    if (!trigger.enabled) {
      return res.status(403).json({
        success: false,
        error: 'Webhook触发器已禁用'
      });
    }
    
    // 记录调用
    const requestData = {
      method: req.method,
      headers: req.headers,
      body: '',
      ip: clientIp,
      status: 200
    };
    
    await triggerService.recordWebhookCall(triggerId, requestData);
    
    res.json({
      success: true,
      message: 'Webhook测试成功',
      trigger: {
        id: trigger.id,
        name: trigger.name,
        enabled: trigger.enabled
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

export default router;
