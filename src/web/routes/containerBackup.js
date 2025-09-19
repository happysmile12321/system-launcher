import express from 'express';
import ContainerBackupService from '../../services/containerBackupService.js';

const router = express.Router();
const containerBackupService = new ContainerBackupService();

// 注入依赖服务（需要在应用启动时调用）
export function initializeContainerBackupService(workflowService, triggerService, componentService) {
  containerBackupService.setServices(workflowService, triggerService, componentService);
}

/**
 * 为容器创建自动备份工作流
 * POST /api/container-backup/workflows
 */
router.post('/workflows', async (req, res) => {
  try {
    const {
      containerId,
      cronExpression = '0 2 * * *',
      backupPath = '/tmp/backups',
      includeVolumes = true,
      includeConfig = true,
      compress = true,
      uploadToFeishu = false
    } = req.body;

    if (!containerId) {
      return res.status(400).json({
        success: false,
        error: '容器ID不能为空'
      });
    }

    const result = await containerBackupService.createAutoBackupWorkflow({
      containerId,
      cronExpression,
      backupPath,
      includeVolumes,
      includeConfig,
      compress,
      uploadToFeishu
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('创建容器备份工作流失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取容器的备份工作流列表
 * GET /api/container-backup/workflows/:containerId
 */
router.get('/workflows/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const workflows = await containerBackupService.getContainerBackupWorkflows(containerId);
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('获取容器备份工作流失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除容器的备份工作流
 * DELETE /api/container-backup/workflows/:workflowId
 */
router.delete('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    const result = await containerBackupService.deleteContainerBackupWorkflow(workflowId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('删除容器备份工作流失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 手动执行容器备份
 * POST /api/container-backup/execute/:containerId
 */
router.post('/execute/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    const {
      backupPath = '/tmp/backups',
      includeVolumes = true,
      includeConfig = true,
      compress = true
    } = req.body;

    const result = await containerBackupService.executeManualBackup(containerId, {
      backupPath,
      includeVolumes,
      includeConfig,
      compress
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('手动备份失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取备份历史记录
 * GET /api/container-backup/history/:containerId
 */
router.get('/history/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    const { backupPath = '/tmp/backups' } = req.query;

    const history = await containerBackupService.getBackupHistory(containerId, backupPath);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取备份历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 清理过期备份
 * DELETE /api/container-backup/cleanup/:containerId
 */
router.delete('/cleanup/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    const { keepDays = 30, backupPath = '/tmp/backups' } = req.query;

    const result = await containerBackupService.cleanupOldBackups(
      containerId, 
      parseInt(keepDays), 
      backupPath
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('清理过期备份失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
