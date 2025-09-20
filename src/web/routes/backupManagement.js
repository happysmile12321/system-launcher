import express from 'express';
import backupManagementService from '../../services/backupManagementService.js';
import { info, success, error } from '../../utils/logger.js';

const router = express.Router();

/**
 * V3.0: 备份管理API路由
 */

// 获取备份服务状态
router.get('/status', async (req, res) => {
  try {
    const status = await backupManagementService.getServiceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    error(`Failed to get backup service status: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup service status'
    });
  }
});

// 获取可备份的容器列表
router.get('/containers', async (req, res) => {
  try {
    const containers = await backupManagementService.getBackupableContainers();
    res.json({
      success: true,
      data: containers
    });
  } catch (err) {
    error(`Failed to get backupable containers: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get backupable containers'
    });
  }
});

// 获取所有备份工作流
router.get('/workflows', async (req, res) => {
  try {
    const workflows = await backupManagementService.getBackupWorkflows();
    res.json({
      success: true,
      data: workflows
    });
  } catch (err) {
    error(`Failed to get backup workflows: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup workflows'
    });
  }
});

// 创建备份工作流
router.post('/workflows', async (req, res) => {
  try {
    const {
      containerId,
      containerName,
      cronExpression,
      includeVolumes,
      includeConfig,
      backupPath,
      retentionDays
    } = req.body;

    if (!containerId || !cronExpression) {
      return res.status(400).json({
        success: false,
        error: 'Container ID and cron expression are required'
      });
    }

    const workflow = await backupManagementService.createContainerBackupWorkflow({
      containerId,
      containerName,
      cronExpression,
      includeVolumes,
      includeConfig,
      backupPath,
      retentionDays
    });

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (err) {
    error(`Failed to create backup workflow: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup workflow'
    });
  }
});

// 删除备份工作流
router.delete('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    await backupManagementService.deleteBackupWorkflow(workflowId);
    
    res.json({
      success: true,
      message: 'Backup workflow deleted successfully'
    });
  } catch (err) {
    error(`Failed to delete backup workflow: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to delete backup workflow'
    });
  }
});

// 执行备份工作流
router.post('/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    const result = await backupManagementService.executeBackupWorkflow(workflowId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to execute backup workflow: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to execute backup workflow'
    });
  }
});

export default router;
