import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, saveConfig, isConfigured, getConfig } from '../services/configService.js';
import { getGitHubConfig, saveGitHubConfig } from '../services/githubService.js';
import { runDockerDeploy } from '../core/deployment.js';
import { info, success, error, warning } from '../utils/logger.js';
import GitFS from '../core/gitfs.js';
import ScriptRunner from '../core/scriptRunner.js';
import { startScheduler, stopScheduler, getSchedulerStatus, updateSchedulerConfig } from '../services/schedulerService.js';
import feishuWebhookRouter from './routes/feishu.js';
import managementApiRouter from './routes/management.js';
import componentsRouter from './routes/components.js';
import triggersRouter from './routes/triggers.js';
import webhookRouter from './routes/webhook.js';
import servicesRouter from './routes/services.js';
import containersRouter from './routes/containers.js';
import containerBackupRouter, { initializeContainerBackupService } from './routes/containerBackup.js';
import aiCronRouter from './routes/aiCron.js';
import backupManagementRouter from './routes/backupManagement.js';
import compositionsRouter from './routes/compositions.js';
import localFSRouter from './routes/localFS.js';
import workflowProxyRouter from './routes/workflowProxy.js';
import feishuWebSocketService from '../services/feishuWebSocketService.js';
import {
  listWorkflows,
  getWorkflow as getWorkflowById,
  saveWorkflow as persistWorkflow,
  createWorkflow,
  deleteWorkflow as removeWorkflow,
} from '../services/workflowService.js';

// --- Initial Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(express.json());
// Middleware to check if the app is configured
app.use(async (req, res, next) => {
  if (req.path.startsWith('/setup') || req.path.startsWith('/api/setup')) {
    return next(); // Allow access to setup page and API
  }
  if (!isConfigured()) {
    return res.redirect('/setup');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { index: false }));


// --- Routes ---
app.get('/', (req, res) => {
  const appIndex = path.join(__dirname, 'public', 'app', 'index.html');
  if (fs.existsSync(appIndex)) {
    return res.sendFile(appIndex);
  }
  return res.status(503).send(`<!doctype html><html lang="zh-cn"><head><meta charset="utf-8"><title>构建中 · Orchestrator Pro</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}section{max-width:520px;padding:32px;border-radius:24px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.2);backdrop-filter:blur(12px);}h1{font-size:1.5rem;margin-bottom:0.75rem;}code{background:rgba(15,118,110,0.15);padding:4px 8px;border-radius:8px;color:#5eead4;}</style></head><body><section><h1>前端资源尚未构建</h1><p>新的可视化工作流设计器需要先执行 <code>npm run web:build</code> 生成静态资源。</p><p style="margin-top:1rem;font-size:0.9rem;color:#94a3b8;">构建完成后刷新页面即可看到全新界面。</p></section></body></html>`);
});

// Serve the setup page
app.get('/setup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'setup.html'));
});

// Handle the setup form submission
app.post('/api/setup', async (req, res) => {
  try {
    await saveConfig(req.body);
    // Re-initialize services with the new config
    await loadConfig(); 
    success('Configuration saved!');
    res.json({ message: 'Configuration saved successfully!' });
  } catch (e) {
    error('Failed to save configuration: ' + e.message);
    res.status(500).json({ error: 'Failed to save configuration.' });
  }
});

// API to get the orchestration config from GitHub
app.get('/api/orchestration', async (req, res) => {
  try {
    const config = getConfig();
    const gitfs = new GitFS(config);
    const orchestrationPath = 'config/main.json';
    
    const fileData = await gitfs.readFile(orchestrationPath);
    if (fileData) {
      res.json(JSON.parse(fileData.content));
    } else {
      // Return default orchestration config if file doesn't exist
      res.json({ version: 1, steps: [] });
    }
  } catch (e) {
    error('Failed to get orchestration config: ' + e.message);
    res.status(500).json({ error: 'Failed to get orchestration config.' });
  }
});

// API to save the orchestration config to GitHub
app.post('/api/orchestration', async (req, res) => {
  try {
    const config = getConfig();
    const gitfs = new GitFS(config);
    const orchestrationPath = 'config/main.json';
    
    // Ensure the config directory exists
    await gitfs.createDirectory('config');
    
    await gitfs.writeFile(
      orchestrationPath, 
      JSON.stringify(req.body, null, 2),
      'Update orchestration configuration'
    );
    
    res.json({ message: 'Orchestration saved to GitHub successfully!' });
  } catch (e) {
    error('Failed to save orchestration config: ' + e.message);
    res.status(500).json({ error: 'Failed to save orchestration config.' });
  }
});

// Workflow management APIs
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = await listWorkflows();
    res.json({ workflows });
  } catch (e) {
    error('Failed to list workflows: ' + e.message);
    res.status(500).json({ error: 'Failed to list workflows.' });
  }
});

app.post('/api/workflows', async (req, res) => {
  try {
    const { name, description } = req.body ?? {};
    const workflow = await createWorkflow({ name, description });
    res.status(201).json(workflow);
  } catch (e) {
    error('Failed to create workflow: ' + e.message);
    res.status(500).json({ error: 'Failed to create workflow.' });
  }
});

app.get('/api/workflows/:workflowId', async (req, res) => {
  try {
    const workflow = await getWorkflowById(req.params.workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found.' });
    }
    res.json(workflow);
  } catch (e) {
    error('Failed to get workflow: ' + e.message);
    res.status(500).json({ error: 'Failed to load workflow.' });
  }
});

app.put('/api/workflows/:workflowId', async (req, res) => {
  try {
    const workflowId = req.params.workflowId;
    if (!req.body || req.body.id !== workflowId) {
      return res.status(400).json({ error: 'Workflow payload must include matching id.' });
    }
    const workflow = await persistWorkflow(req.body);
    res.json(workflow);
  } catch (e) {
    error('Failed to save workflow: ' + e.message);
    res.status(500).json({ error: 'Failed to save workflow.' });
  }
});

app.delete('/api/workflows/:workflowId', async (req, res) => {
  try {
    await removeWorkflow(req.params.workflowId);
    res.status(204).end();
  } catch (e) {
    error('Failed to delete workflow: ' + e.message);
    res.status(500).json({ error: 'Failed to delete workflow.' });
  }
});

// API to trigger a deployment
app.post('/api/deploy/docker', async (req, res) => {
  const result = await runDockerDeploy();
  res.json({ message: 'Docker deployment triggered!', output: result });
});

// Script Management APIs

// Get list of scripts
app.get('/api/scripts', async (req, res) => {
  try {
    const config = getConfig();
    const gitfs = new GitFS(config);
    const scriptsDir = 'scripts';
    
    const items = await gitfs.listDirectory(scriptsDir);
    const scripts = items
      .filter(item => item.type === 'file' && item.name.endsWith('.js'))
      .map(item => ({
        name: item.name,
        path: item.path.replace('.orchestrator-pro/', '')
      }));
    
    res.json(scripts);
  } catch (e) {
    error('Failed to get scripts: ' + e.message);
    res.status(500).json({ error: 'Failed to get scripts.' });
  }
});

// Get script content
app.get('/api/scripts/:scriptName', async (req, res) => {
  try {
    const config = getConfig();
    const gitfs = new GitFS(config);
    const scriptPath = `scripts/${req.params.scriptName}`;
    
    const fileData = await gitfs.readFile(scriptPath);
    if (fileData) {
      res.json({ content: fileData.content });
    } else {
      res.status(404).json({ error: 'Script not found.' });
    }
  } catch (e) {
    error('Failed to get script: ' + e.message);
    res.status(500).json({ error: 'Failed to get script.' });
  }
});

// Save script
app.post('/api/scripts/:scriptName', async (req, res) => {
  try {
    const config = getConfig();
    const gitfs = new GitFS(config);
    const scriptPath = `scripts/${req.params.scriptName}`;
    
    // Ensure the scripts directory exists
    await gitfs.createDirectory('scripts');
    
    await gitfs.writeFile(
      scriptPath, 
      req.body.content,
      `Update script: ${req.params.scriptName}`
    );
    
    res.json({ message: 'Script saved successfully!' });
  } catch (e) {
    error('Failed to save script: ' + e.message);
    res.status(500).json({ error: 'Failed to save script.' });
  }
});

// Delete script
app.delete('/api/scripts/:scriptName', async (req, res) => {
  try {
    const config = getConfig();
    const gitfs = new GitFS(config);
    const scriptPath = `scripts/${req.params.scriptName}`;
    
    await gitfs.deleteFile(
      scriptPath,
      `Delete script: ${req.params.scriptName}`
    );
    
    res.json({ message: 'Script deleted successfully!' });
  } catch (e) {
    error('Failed to delete script: ' + e.message);
    res.status(500).json({ error: 'Failed to delete script.' });
  }
});

// Run script
app.post('/api/scripts/:scriptName/run', async (req, res) => {
  try {
    const config = getConfig();
    const scriptRunner = new ScriptRunner(config);
    const scriptPath = `scripts/${req.params.scriptName}`;
    
    const result = await scriptRunner.runScriptFromPath(scriptPath);
    
    if (result.error) {
      res.status(500).json({
        message: 'Script execution failed',
        result: result.result,
        error: result.error,
        logs: result.logs
      });
    } else {
      res.json({
        message: 'Script executed successfully!',
        result: result.result,
        logs: result.logs
      });
    }
  } catch (e) {
    error('Failed to run script: ' + e.message);
    res.status(500).json({ 
      error: 'Failed to run script.',
      logs: [`[ERROR] ${e.message}`] 
    });
  }
});

// Scheduler APIs
// Get scheduler status
app.get('/api/scheduler/status', async (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json({
      message: 'Scheduler status retrieved successfully!',
      status
    });
  } catch (e) {
    error('Failed to get scheduler status: ' + e.message);
    res.status(500).json({ error: 'Failed to get scheduler status.' });
  }
});

// Update scheduler configuration
app.post('/api/scheduler/update', async (req, res) => {
  try {
    const { cronExpression } = req.body;
    if (!cronExpression) {
      return res.status(400).json({ error: 'cronExpression is required.' });
    }
    
    const updatedJob = await updateSchedulerConfig(cronExpression);
    res.json({
      message: 'Scheduler configuration updated successfully!',
      nextRun: updatedJob.nextInvocation().toString(),
      cronExpression
    });
  } catch (e) {
    error('Failed to update scheduler configuration: ' + e.message);
    res.status(500).json({ error: 'Failed to update scheduler configuration.' });
  }
});

// Feishu Webhook Route
app.use('/api/feishu', feishuWebhookRouter);

// Management API Route
app.use('/api/management', managementApiRouter);

// Components API Route
app.use('/api/components', componentsRouter);

// Triggers API Route
app.use('/api/triggers', triggersRouter);

// Webhook API Route
app.use('/api/webhook', webhookRouter);

// System Services API Route
app.use('/api/services', servicesRouter);

// Container Management API Route
app.use('/api/containers', containersRouter);

// Container Backup API Route
app.use('/api/container-backup', containerBackupRouter);

// AI Cron API Route
app.use('/api/ai-cron', aiCronRouter);

// Backup Management API Route
app.use('/api/backup-management', backupManagementRouter);
app.use('/api/compositions', compositionsRouter);

// LocalFS API Route
app.use('/api/local-fs', localFSRouter);

// Workflow Proxy API Route
app.use('/api/workflow-proxy', workflowProxyRouter);


// --- Server Startup ---
async function startServer() {
  await loadConfig();
  
  // Initialize necessary directories if configured
  if (isConfigured()) {
    try {
      const config = getConfig();
      const gitfs = new GitFS(config);
      
      // V3.0: Initialize new directory structure and migrate if needed
      try {
        await gitfs.initializeV3Structure();
        
        // Check if migration is needed
        const oldConfigExists = await gitfs.exists('config');
        if (oldConfigExists) {
          info('V3.0: Old config structure detected, starting migration...');
          await gitfs.migrateToV3();
        }
      } catch (migrationError) {
        warning(`V3.0: Migration failed, continuing with existing structure: ${migrationError.message}`);
      }
      
      // Ensure basic directory structure exists (legacy support)
      await gitfs.createDirectory('config');
      await gitfs.createDirectory('scripts');
  
  // Ensure main orchestration file exists
  const orchestrationPath = 'config/main.json';
  const orchestrationExists = await gitfs.exists(orchestrationPath);
  if (!orchestrationExists) {
    await gitfs.writeFile(
      orchestrationPath, 
      JSON.stringify({ version: 1, steps: [] }, null, 2),
      'Initialize orchestration configuration'
    );
  }
  
  // 启动定时任务服务
  try {
    await startScheduler();
  } catch (schedulerError) {
    warning(`定时任务服务启动失败: ${schedulerError.message}`);
  }

  // 初始化容器备份服务
  try {
    const triggerService = (await import('../services/triggerService.js')).default;
    const componentService = (await import('../services/componentService.js')).default;
    
    // workflowService 导出的是函数，我们创建一个包装对象
    const workflowService = {
      createWorkflow: (await import('../services/workflowService.js')).createWorkflow,
      getAllWorkflows: async () => {
        const workflows = await (await import('../services/workflowService.js')).listWorkflows();
        return { workflows };
      },
      getWorkflow: (await import('../services/workflowService.js')).getWorkflow,
      saveWorkflow: (await import('../services/workflowService.js')).saveWorkflow,
      deleteWorkflow: (await import('../services/workflowService.js')).deleteWorkflow
    };
    
    initializeContainerBackupService(workflowService, triggerService, componentService);
    info('容器备份服务初始化完成');
  } catch (backupServiceError) {
    warning(`容器备份服务初始化失败: ${backupServiceError.message}`);
  }

  // 启动飞书WebSocket服务
  try {
    const webSocketStarted = await feishuWebSocketService.start();
    if (webSocketStarted) {
      info('飞书WebSocket服务启动成功');
    } else {
      warning('飞书WebSocket服务启动失败，请检查飞书配置');
    }
  } catch (webSocketError) {
    warning(`飞书WebSocket服务启动失败: ${webSocketError.message}`);
  }
    } catch (e) {
      warning(`Failed to initialize GitHub directories: ${e.message}`);
    }
  }
  
  app.listen(PORT, () => {
    success(`Orchestrator Pro is running!`);
    if (isConfigured()) {
      info(`Main application ready at http://localhost:${PORT}`);
    } else {
      warning(`Configuration needed. Please visit http://localhost:${PORT} to complete setup.`);
    }
  });
}

startServer();
