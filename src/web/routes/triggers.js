import express from 'express';
import triggerService from '../../services/triggerService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取所有触发器列表
 */
router.get('/', async (req, res) => {
  try {
    info('获取触发器列表');
    const triggers = await triggerService.getAllTriggers();
    
    res.json({
      success: true,
      data: triggers
    });
  } catch (err) {
    error(`获取触发器列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建新触发器
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, workflowId } = req.body;
    
    if (!name || !workflowId) {
      res.status(400).json({
        success: false,
        error: '缺少必要的触发器信息'
      });
      return;
    }
    
    info(`创建触发器: ${name}`);
    const trigger = await triggerService.createTrigger({
      name,
      description,
      workflowId
    });
    
    res.status(201).json({
      success: true,
      data: trigger
    });
  } catch (err) {
    error(`创建触发器失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取触发器详情
 */
router.get('/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    info(`获取触发器详情: ${triggerId}`);
    
    const trigger = await triggerService.getTrigger(triggerId);
    
    if (!trigger) {
      res.status(404).json({
        success: false,
        error: '触发器不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: trigger
    });
  } catch (err) {
    error(`获取触发器详情失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 更新触发器
 */
router.put('/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const updateData = req.body;
    
    info(`更新触发器: ${triggerId}`);
    const trigger = await triggerService.updateTrigger(triggerId, updateData);
    
    res.json({
      success: true,
      data: trigger
    });
  } catch (err) {
    error(`更新触发器失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除触发器
 */
router.delete('/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    
    info(`删除触发器: ${triggerId}`);
    await triggerService.deleteTrigger(triggerId);
    
    res.json({
      success: true,
      message: '触发器删除成功'
    });
  } catch (err) {
    error(`删除触发器失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取触发器的调用记录
 */
router.get('/:triggerId/requests', async (req, res) => {
  try {
    const { triggerId } = req.params;
    info(`获取触发器调用记录: ${triggerId}`);
    
    const requests = await triggerService.getTriggerRequests(triggerId);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (err) {
    error(`获取触发器调用记录失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 刷新触发器列表
 */
router.post('/refresh', async (req, res) => {
  try {
    info('刷新触发器列表');
    await triggerService.refresh();
    
    res.json({
      success: true,
      message: '触发器列表已刷新'
    });
  } catch (err) {
    error(`刷新触发器列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
