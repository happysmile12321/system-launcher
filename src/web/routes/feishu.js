
import express from 'express';
import { incrementCounter } from '../../services/metricsService.js';
import feishuOAuthService from '../../services/feishuOAuthService.js';
import feishuFS from '../../services/feishuFS.js';
import { info, error, success } from '../../utils/logger.js';

const router = express.Router();

/**
 * 获取Feishu认证状态
 */
router.get('/auth/status', async (req, res) => {
  try {
    const authStatus = await feishuOAuthService.getAuthStatus();
    
    res.json({
      success: true,
      data: authStatus
    });
  } catch (err) {
    error(`Failed to get Feishu auth status: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 开始Feishu OAuth认证
 */
router.get('/auth/start', async (req, res) => {
  try {
    const state = 'feishu_auth_' + Date.now();
    const authUrl = feishuOAuthService.generateAuthUrl(state);
    
    res.json({
      success: true,
      data: {
        authUrl,
        state
      }
    });
  } catch (err) {
    error(`Failed to start Feishu auth: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * Feishu OAuth回调处理
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>飞书认证失败</title></head>
          <body>
            <h2>认证失败</h2>
            <p>未收到授权码，请重试。</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `);
    }

    // 交换授权码获取访问令牌
    const tokens = await feishuOAuthService.exchangeCodeForToken(code, state);
    
    // 获取用户信息
    const userInfo = await feishuOAuthService.getUserInfo(tokens.accessToken);
    
    // 保存认证状态
    await feishuOAuthService.saveTokensToConfig(tokens, userInfo);
    
    res.send(`
      <html>
        <head><title>飞书认证成功</title></head>
        <body>
          <h2>认证成功！</h2>
          <p>欢迎，${userInfo.name || userInfo.email || '用户'}！</p>
          <p>您可以关闭此窗口。</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (err) {
    error(`Failed to handle Feishu callback: ${err.message}`);
    res.status(500).send(`
      <html>
        <head><title>飞书认证失败</title></head>
        <body>
          <h2>认证失败</h2>
          <p>错误信息：${err.message}</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  }
});


/**
 * 登出Feishu
 */
router.post('/auth/logout', async (req, res) => {
  try {
    await feishuOAuthService.logout();
    
    res.json({
      success: true,
      message: 'Successfully logged out from Feishu'
    });
  } catch (err) {
    error(`Failed to logout from Feishu: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取FeishuFS根目录
 */
router.get('/fs/root', async (req, res) => {
  try {
    const rootFolder = await feishuFS.getRootFolder();
    
    res.json({
      success: true,
      data: rootFolder
    });
  } catch (err) {
    error(`Failed to get FeishuFS root folder: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 列出文件夹内容
 */
router.get('/fs/list/:folderToken?', async (req, res) => {
  try {
    const { folderToken } = req.params;
    const { pageSize, pageToken, orderBy, direction } = req.query;
    
    const options = {
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      pageToken,
      orderBy,
      direction
    };
    
    const files = await feishuFS.listFiles(folderToken, options);
    
    res.json({
      success: true,
      data: files
    });
  } catch (err) {
    error(`Failed to list FeishuFS files: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 创建文件夹
 */
router.post('/fs/folder', async (req, res) => {
  try {
    const { name, parentToken } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }
    
    const folder = await feishuFS.createFolder(name, parentToken);
    
    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (err) {
    error(`Failed to create FeishuFS folder: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 上传文件
 */
router.post('/fs/upload', async (req, res) => {
  try {
    const { fileName, content, parentToken, contentType } = req.body;
    
    if (!fileName || !content) {
      return res.status(400).json({
        success: false,
        error: 'File name and content are required'
      });
    }
    
    const file = await feishuFS.uploadFile(fileName, content, parentToken, contentType);
    
    res.status(201).json({
      success: true,
      data: file
    });
  } catch (err) {
    error(`Failed to upload file to FeishuFS: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 下载文件
 */
router.get('/fs/download/:fileToken', async (req, res) => {
  try {
    const { fileToken } = req.params;
    
    const fileContent = await feishuFS.downloadFile(fileToken);
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileToken}"`
    });
    
    res.send(fileContent);
  } catch (err) {
    error(`Failed to download file from FeishuFS: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 删除文件或文件夹
 */
router.delete('/fs/:fileToken', async (req, res) => {
  try {
    const { fileToken } = req.params;
    const { type = 'file' } = req.query;
    
    await feishuFS.deleteFile(fileToken, type);
    
    res.json({
      success: true,
      message: `${type} deleted successfully`
    });
  } catch (err) {
    error(`Failed to delete from FeishuFS: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 获取文件信息
 */
router.get('/fs/info/:fileToken', async (req, res) => {
  try {
    const { fileToken } = req.params;
    
    const fileInfo = await feishuFS.getFileInfo(fileToken);
    
    res.json({
      success: true,
      data: fileInfo
    });
  } catch (err) {
    error(`Failed to get FeishuFS file info: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 搜索文件
 */
router.post('/fs/search', async (req, res) => {
  try {
    const { query, count, offset, searchScope } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const options = {
      count,
      offset,
      searchScope
    };
    
    const results = await feishuFS.searchFiles(query, options);
    
    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    error(`Failed to search FeishuFS files: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 检查FeishuFS服务状态
 */
router.get('/fs/status', async (req, res) => {
  try {
    const isAvailable = await feishuFS.isAvailable();
    
    res.json({
      success: true,
      data: {
        available: isAvailable
      }
    });
  } catch (err) {
    error(`Failed to check FeishuFS status: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 用于处理审批实例的回调
router.post('/approval', (req, res) => {
    incrementCounter('orchestrator_pro_feishu_api_calls_total', { route: 'approval' }, 1);
    // TODO: 触发审批相关的自定义脚本
    console.log('Received Feishu approval event:', req.body);
    res.sendStatus(200);
});

// 用于处理消息卡片的回调
router.post('/card', (req, res) => {
    incrementCounter('orchestrator_pro_feishu_api_calls_total', { route: 'card' }, 1);
    // TODO: 处理卡片交互
    console.log('Received Feishu card event:', req.body);
    res.sendStatus(200);
});

export default router;
