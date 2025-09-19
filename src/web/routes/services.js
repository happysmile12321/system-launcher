import express from 'express';
import systemService from '../../services/systemService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取所有系统服务
 */
router.get('/', async (req, res) => {
  try {
    info('获取系统服务列表');
    const services = await systemService.getAllServices();
    
    res.json({
      success: true,
      data: services
    });
  } catch (err) {
    error(`获取系统服务列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取已安装的系统服务
 */
router.get('/installed', async (req, res) => {
  try {
    info('获取已安装的系统服务');
    const services = await systemService.getInstalledServices();
    
    res.json({
      success: true,
      data: services
    });
  } catch (err) {
    error(`获取已安装的系统服务失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取系统服务详情
 */
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    info(`获取系统服务详情: ${serviceId}`);
    
    const service = await systemService.getService(serviceId);
    
    if (!service) {
      res.status(404).json({
        success: false,
        error: '系统服务不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (err) {
    error(`获取系统服务详情失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 安装系统服务
 */
router.post('/:serviceId/install', async (req, res) => {
  try {
    const { serviceId } = req.params;
    info(`安装系统服务: ${serviceId}`);
    
    await systemService.installService(serviceId);
    
    res.json({
      success: true,
      message: '系统服务安装成功'
    });
  } catch (err) {
    error(`安装系统服务失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 卸载系统服务
 */
router.post('/:serviceId/uninstall', async (req, res) => {
  try {
    const { serviceId } = req.params;
    info(`卸载系统服务: ${serviceId}`);
    
    await systemService.uninstallService(serviceId);
    
    res.json({
      success: true,
      message: '系统服务卸载成功'
    });
  } catch (err) {
    error(`卸载系统服务失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 检查依赖
 */
router.get('/check-dependency/:dependency', async (req, res) => {
  try {
    const { dependency } = req.params;
    info(`检查依赖: ${dependency}`);
    
    const isInstalled = await systemService.checkDependency(dependency);
    
    res.json({
      success: true,
      installed: isInstalled
    });
  } catch (err) {
    error(`检查依赖失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 刷新系统服务列表
 */
router.post('/refresh', async (req, res) => {
  try {
    info('刷新系统服务列表');
    await systemService.refresh();
    
    res.json({
      success: true,
      message: '系统服务列表已刷新'
    });
  } catch (err) {
    error(`刷新系统服务列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
