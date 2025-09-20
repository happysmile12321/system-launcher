import express from 'express';
import localFSService from '../../services/localFS.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取LocalFS服务状态
 */
router.get('/status', async (req, res) => {
  try {
    const status = await localFSService.getServiceStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    error(`Failed to get LocalFS status: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 初始化LocalFS服务
 */
router.post('/initialize', async (req, res) => {
  try {
    await localFSService.initialize();
    
    res.json({
      success: true,
      message: 'LocalFS service initialized successfully'
    });
  } catch (err) {
    error(`Failed to initialize LocalFS: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取所有容器组
 */
router.get('/compositions', async (req, res) => {
  try {
    const compositions = await localFSService.listCompositions();
    
    res.json({
      success: true,
      data: compositions
    });
  } catch (err) {
    error(`Failed to list compositions: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建容器组目录结构
 */
router.post('/compositions', async (req, res) => {
  try {
    const { compositionName } = req.body;
    
    if (!compositionName) {
      return res.status(400).json({
        success: false,
        error: 'Composition name is required'
      });
    }

    const structure = await localFSService.createCompositionStructure(compositionName);
    
    res.json({
      success: true,
      data: structure,
      message: `Composition structure created for: ${compositionName}`
    });
  } catch (err) {
    error(`Failed to create composition structure: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取容器组目录结构
 */
router.get('/compositions/:compositionName', async (req, res) => {
  try {
    const { compositionName } = req.params;
    const structure = await localFSService.getCompositionStructure(compositionName);
    
    res.json({
      success: true,
      data: structure
    });
  } catch (err) {
    error(`Failed to get composition structure: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除容器组
 */
router.delete('/compositions/:compositionName', async (req, res) => {
  try {
    const { compositionName } = req.params;
    await localFSService.deleteComposition(compositionName);
    
    res.json({
      success: true,
      message: `Composition ${compositionName} deleted successfully`
    });
  } catch (err) {
    error(`Failed to delete composition: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 保存Docker Compose文件
 */
router.post('/compositions/:compositionName/compose', async (req, res) => {
  try {
    const { compositionName } = req.params;
    const { composeContent } = req.body;
    
    if (!composeContent) {
      return res.status(400).json({
        success: false,
        error: 'Compose content is required'
      });
    }

    const composeFilePath = await localFSService.saveComposeFile(compositionName, composeContent);
    
    res.json({
      success: true,
      data: {
        filePath: composeFilePath,
        compositionName
      },
      message: 'Compose file saved successfully'
    });
  } catch (err) {
    error(`Failed to save compose file: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 读取Docker Compose文件
 */
router.get('/compositions/:compositionName/compose', async (req, res) => {
  try {
    const { compositionName } = req.params;
    const composeContent = await localFSService.readComposeFile(compositionName);
    
    res.json({
      success: true,
      data: {
        compositionName,
        content: composeContent
      }
    });
  } catch (err) {
    error(`Failed to read compose file: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建服务配置目录
 */
router.post('/compositions/:compositionName/services/:serviceName/config', async (req, res) => {
  try {
    const { compositionName, serviceName } = req.params;
    const configPath = await localFSService.createServiceConfigDirectory(compositionName, serviceName);
    
    res.json({
      success: true,
      data: {
        configPath,
        compositionName,
        serviceName
      },
      message: 'Service config directory created successfully'
    });
  } catch (err) {
    error(`Failed to create service config directory: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建服务日志目录
 */
router.post('/compositions/:compositionName/services/:serviceName/logs', async (req, res) => {
  try {
    const { compositionName, serviceName } = req.params;
    const logPath = await localFSService.createServiceLogDirectory(compositionName, serviceName);
    
    res.json({
      success: true,
      data: {
        logPath,
        compositionName,
        serviceName
      },
      message: 'Service log directory created successfully'
    });
  } catch (err) {
    error(`Failed to create service log directory: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建服务数据目录
 */
router.post('/compositions/:compositionName/services/:serviceName/data', async (req, res) => {
  try {
    const { compositionName, serviceName } = req.params;
    const dataPath = await localFSService.createServiceDataDirectory(compositionName, serviceName);
    
    res.json({
      success: true,
      data: {
        dataPath,
        compositionName,
        serviceName
      },
      message: 'Service data directory created successfully'
    });
  } catch (err) {
    error(`Failed to create service data directory: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 生成卷映射路径
 */
router.post('/compositions/:compositionName/services/:serviceName/volume-path', async (req, res) => {
  try {
    const { compositionName, serviceName } = req.params;
    const { containerPath, type = 'entitydata' } = req.body;
    
    if (!containerPath) {
      return res.status(400).json({
        success: false,
        error: 'Container path is required'
      });
    }

    const volumePath = localFSService.generateVolumePath(compositionName, serviceName, containerPath, type);
    
    res.json({
      success: true,
      data: {
        volumePath,
        compositionName,
        serviceName,
        containerPath,
        type
      }
    });
  } catch (err) {
    error(`Failed to generate volume path: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
