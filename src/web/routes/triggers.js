import express from 'express';
import triggerService from '../../services/triggerService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取所有Cron触发器状态
 */
router.get('/cron', async (req, res) => {
  try {
    info('获取Cron触发器列表');
    const triggers = triggerService.getCronTriggersStatus();
    
    res.json({
      success: true,
      data: triggers
    });
  } catch (err) {
    error(`获取Cron触发器列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建Cron触发器
 */
router.post('/cron', async (req, res) => {
  try {
    const { workflowId, cronExpression } = req.body;
    
    if (!workflowId || !cronExpression) {
      res.status(400).json({
        success: false,
        error: '缺少必要的工作流ID和Cron表达式'
      });
      return;
    }
    
    info(`创建Cron触发器: ${workflowId}`);
    const trigger = await triggerService.createCronTrigger(workflowId, cronExpression);
    
    res.status(201).json({
      success: true,
      data: trigger
    });
  } catch (err) {
    error(`创建Cron触发器失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取特定Cron触发器状态
 */
router.get('/cron/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    info(`获取Cron触发器状态: ${workflowId}`);
    
    const trigger = triggerService.getCronTriggerStatus(workflowId);
    
    if (!trigger) {
      res.status(404).json({
        success: false,
        error: 'Cron触发器不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: trigger
    });
  } catch (err) {
    error(`获取Cron触发器状态失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 更新Cron触发器
 */
router.put('/cron/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { cronExpression } = req.body;
    
    if (!cronExpression) {
      res.status(400).json({
        success: false,
        error: '缺少Cron表达式'
      });
      return;
    }
    
    info(`更新Cron触发器: ${workflowId}`);
    const trigger = await triggerService.updateCronTrigger(workflowId, cronExpression);
    
    res.json({
      success: true,
      data: trigger
    });
  } catch (err) {
    error(`更新Cron触发器失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除Cron触发器
 */
router.delete('/cron/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    info(`删除Cron触发器: ${workflowId}`);
    await triggerService.removeCronTrigger(workflowId);
    
    res.json({
      success: true,
      message: 'Cron触发器删除成功'
    });
  } catch (err) {
    error(`删除Cron触发器失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 手动触发工作流执行
 */
router.post('/trigger/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    info(`手动触发工作流: ${workflowId}`);
    
    const result = await triggerService.triggerWorkflow(workflowId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`手动触发工作流失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 验证Cron表达式
 */
router.post('/validate-cron', async (req, res) => {
  try {
    const { cronExpression } = req.body;
    
    if (!cronExpression) {
      res.status(400).json({
        success: false,
        error: '缺少Cron表达式'
      });
      return;
    }
    
    const isValid = triggerService.validateCronExpression(cronExpression);
    
    res.json({
      success: true,
      data: { valid: isValid }
    });
  } catch (err) {
    error(`验证Cron表达式失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
