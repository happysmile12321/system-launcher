import express from 'express';
import { getConfig } from '../../services/configService.js';
import GitFS from '../../core/gitfs.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取所有服务状态
 */
router.get('/status', async (req, res) => {
  try {
    const config = await getConfig();
    const services = {};

    // 容器管理服务状态
    services['container-management'] = {
      configured: !!(config.container?.driver),
      status: config.container?.driver ? '已配置' : '未配置',
      config: config.container || {}
    };

    // 备份管理服务状态
    services['backup-management'] = {
      configured: !!(config.storage?.driver),
      status: config.storage?.driver ? '已配置' : '未配置',
      config: config.storage || {}
    };

    // 飞书集成服务状态
    services['feishu-integration'] = {
      configured: !!(config.feishu?.appId && config.feishu?.appSecret),
      status: (config.feishu?.appId && config.feishu?.appSecret) ? '已配置' : '未配置',
      config: config.feishu || {}
    };

    res.json({
      success: true,
      data: services
    });
  } catch (err) {
    error(`获取服务状态失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取特定服务配置
 */
router.get('/:serviceId/config', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const config = await getConfig();
    
    let serviceConfig = {};
    
    switch (serviceId) {
      case 'container-management':
        serviceConfig = config.container || {};
        break;
      case 'backup-management':
        serviceConfig = config.storage || {};
        break;
      case 'feishu-integration':
        serviceConfig = config.feishu || {};
        break;
      default:
        return res.status(404).json({
          success: false,
          error: '服务不存在'
        });
    }

    res.json({
      success: true,
      config: serviceConfig
    });
  } catch (err) {
    error(`获取服务配置失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 保存特定服务配置
 */
router.post('/:serviceId/config', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const configData = req.body;
    const config = await getConfig();
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: '系统配置未初始化'
      });
    }

    const gitfs = new GitFS(config);
    
    // 根据服务类型更新配置
    switch (serviceId) {
      case 'container-management':
        config.container = {
          ...config.container,
          ...configData
        };
        break;
      case 'backup-management':
        config.storage = {
          ...config.storage,
          ...configData
        };
        break;
      case 'feishu-integration':
        config.feishu = {
          ...config.feishu,
          ...configData
        };
        
        // 保存飞书配置到GitFS
        if (configData.appId || configData.appSecret || configData.redirectUri) {
          await gitfs.createDirectory('.orchestrator-pro');
          await gitfs.writeFile(
            '.orchestrator-pro/feishu-config.json',
            JSON.stringify(config.feishu, null, 2),
            'Update Feishu configuration'
          );
        }
        break;
      default:
        return res.status(404).json({
          success: false,
          error: '服务不存在'
        });
    }

    // 保存更新后的配置
    await gitfs.writeFile(
      '.orchestrator-pro/config.json',
      JSON.stringify(config, null, 2),
      `Update ${serviceId} configuration`
    );

    success(`${serviceId} 配置保存成功`);
    
    res.json({
      success: true,
      message: '配置保存成功'
    });
  } catch (err) {
    error(`保存服务配置失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;