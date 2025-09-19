import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, saveConfig, isConfigured, getConfig } from '../services/configService.js';
import { getGitHubConfig, saveGitHubConfig } from '../services/githubService.js';
import { runDockerDeploy } from '../core/deployment.js';
import { info, success, error, warning } from '../utils/logger.js';
import GitFS from '../core/gitfs.js';
import ScriptRunner from '../core/scriptRunner.js';
import { startScheduler, stopScheduler } from '../services/schedulerService.js';

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
app.use(express.static(path.join(__dirname, 'public')));


// --- Routes ---
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


// --- Server Startup ---
async function startServer() {
  await loadConfig();
  
  // Initialize necessary directories if configured
  if (isConfigured()) {
    try {
      const config = getConfig();
      const gitfs = new GitFS(config);
      
      // Ensure basic directory structure exists
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