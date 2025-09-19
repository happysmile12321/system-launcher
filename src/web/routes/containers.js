import express from 'express';
import containerManagementService from '../../services/containerService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取容器管理服务状态
 */
router.get('/status', async (req, res) => {
  try {
    const isAvailable = await containerManagementService.isAvailable();
    const driverInfo = await containerManagementService.getDriverInfo();
    
    res.json({
      success: true,
      data: {
        available: isAvailable,
        driver: driverInfo
      }
    });
  } catch (err) {
    error(`Failed to get container service status: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取容器列表
 */
router.get('/', async (req, res) => {
  try {
    const containers = await containerManagementService.getContainers();
    
    res.json({
      success: true,
      data: containers
    });
  } catch (err) {
    error(`Failed to get containers: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 启动容器
 */
router.post('/:containerId/start', async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const result = await containerManagementService.startContainer(containerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to start container: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 停止容器
 */
router.post('/:containerId/stop', async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const result = await containerManagementService.stopContainer(containerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to stop container: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 重启容器
 */
router.post('/:containerId/restart', async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const result = await containerManagementService.restartContainer(containerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to restart container: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除容器
 */
router.delete('/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const result = await containerManagementService.removeContainer(containerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to remove container: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取容器日志
 */
router.get('/:containerId/logs', async (req, res) => {
  try {
    const { containerId } = req.params;
    const { lines = 100 } = req.query;
    
    const logs = await containerManagementService.getContainerLogs(containerId, parseInt(lines));
    
    res.json({
      success: true,
      data: logs
    });
  } catch (err) {
    error(`Failed to get container logs: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取容器统计信息
 */
router.get('/:containerId/stats', async (req, res) => {
  try {
    const { containerId } = req.params;
    
    const stats = await containerManagementService.getContainerStats(containerId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    error(`Failed to get container stats: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
