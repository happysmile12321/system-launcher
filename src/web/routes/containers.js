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
 * 获取镜像列表
 */
router.get('/images', async (req, res) => {
  try {
    const { all } = req.query;
    const images = await containerManagementService.getImages(all === 'true');
    
    res.json({
      success: true,
      data: images
    });
  } catch (err) {
    error(`Failed to get images: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取容器日志
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { tail = 100, follow = false } = req.query;
    
    const logs = await containerManagementService.getContainerLogs(
      id, 
      parseInt(tail), 
      follow === 'true'
    );
    
    res.json({
      success: true,
      data: { logs }
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
 * 删除镜像
 */
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { force = false } = req.query;
    
    const result = await containerManagementService.removeImage(imageId, force === 'true');
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to remove image: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 部署Docker Compose
 */
router.post('/compose/deploy', async (req, res) => {
  try {
    const { composeContent, projectName } = req.body;
    
    if (!composeContent) {
      return res.status(400).json({
        success: false,
        error: 'Docker Compose内容不能为空'
      });
    }
    
    const result = await containerManagementService.executeCompose(composeContent, projectName);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`Failed to deploy compose: ${err.message}`);
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
