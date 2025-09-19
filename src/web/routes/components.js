import express from 'express';
import componentService from '../../services/componentService.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取所有组件列表
 */
router.get('/', async (req, res) => {
  try {
    info('获取组件列表');
    const components = await componentService.getAllComponents();
    
    res.json({
      success: true,
      data: components
    });
  } catch (err) {
    error(`获取组件列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取组件详情
 */
router.get('/:type/:name', async (req, res) => {
  try {
    const { type, name } = req.params;
    info(`获取组件详情: ${type}/${name}`);
    
    const component = await componentService.getComponent(type, name);
    
    if (!component) {
      res.status(404).json({
        success: false,
        error: '组件不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: component
    });
  } catch (err) {
    error(`获取组件详情失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 执行组件
 */
router.post('/execute/:type/:name', async (req, res) => {
  try {
    const { type, name } = req.params;
    const { inputs = {}, context = {} } = req.body;
    
    info(`执行组件: ${type}/${name}`);
    
    const result = await componentService.executeComponent(type, name, inputs, context);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    error(`执行组件失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建用户组件
 */
router.post('/user', async (req, res) => {
  try {
    const { name, manifest, code } = req.body;
    
    if (!name || !manifest || !code) {
      res.status(400).json({
        success: false,
        error: '缺少必要的组件信息'
      });
      return;
    }
    
    info(`创建用户组件: ${name}`);
    await componentService.createUserComponent(name, manifest, code);
    
    res.json({
      success: true,
      message: '组件创建成功'
    });
  } catch (err) {
    error(`创建用户组件失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 更新用户组件
 */
router.put('/user/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { manifest, code } = req.body;
    
    if (!manifest || !code) {
      res.status(400).json({
        success: false,
        error: '缺少必要的组件信息'
      });
      return;
    }
    
    info(`更新用户组件: ${name}`);
    await componentService.updateUserComponent(name, manifest, code);
    
    res.json({
      success: true,
      message: '组件更新成功'
    });
  } catch (err) {
    error(`更新用户组件失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除用户组件
 */
router.delete('/user/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    info(`删除用户组件: ${name}`);
    await componentService.deleteUserComponent(name);
    
    res.json({
      success: true,
      message: '组件删除成功'
    });
  } catch (err) {
    error(`删除用户组件失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 刷新组件列表
 */
router.post('/refresh', async (req, res) => {
  try {
    info('刷新组件列表');
    await componentService.refresh();
    
    res.json({
      success: true,
      message: '组件列表已刷新'
    });
  } catch (err) {
    error(`刷新组件列表失败: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;