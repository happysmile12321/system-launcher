import { scheduleJob } from 'node-schedule';
import { getConfig, loadConfig } from './configService.js';
import { saveGitHubConfig } from './githubService.js';
import { info, success, error, warning } from '../utils/logger.js';
import GitFS from '../core/gitfs.js';

let configJob = null;
let config = null;

/**
 * 验证配置文件的有效性
 * @param {Object} configObj - 配置对象
 * @returns {boolean} - 配置是否有效
 */
function validateConfig(configObj) {
  try {
    // Basic validation
    if (!configObj || typeof configObj !== 'object') {
      warning('Config is not a valid JSON object');
      return false;
    }

    // Validate GitHub config
    if (!configObj.github?.token || !configObj.github?.owner || !configObj.github?.repo) {
      warning('Config is missing necessary GitHub information');
      return false;
    }

    // Validate scheduler config
    if (configObj.scheduler && !configObj.scheduler.cronExpression) {
      warning('Scheduler config is missing cron expression');
      return false;
    }

    success('Config validation passed');
    return true;
  } catch (err) {
    error(`Config validation failed: ${err.message}`);
    return false;
  }
}

/**
 * 检查并同步配置文件到GitHub
 */
async function checkAndSyncConfig() {
  try {
    info('Starting scheduled config sync...');

    const latestConfig = await loadConfig();
    if (!latestConfig) {
      warning('No config file found, skipping sync.');
      return;
    }

    if (!validateConfig(latestConfig)) {
      warning('Config validation failed, skipping sync.');
      return;
    }

    try {
      const gitfs = new GitFS(latestConfig);
      
      const localConfigContent = JSON.stringify(latestConfig, null, 2);
      const gitConfigPath = latestConfig.github.configFile || 'config/system.json';
      
      const gitConfigData = await gitfs.readFile(gitConfigPath);
      
      if (!gitConfigData || gitConfigData.content !== localConfigContent) {
        // 只在gitConfigPath包含路径分隔符时创建目录
        const pathSeparatorIndex = gitConfigPath.lastIndexOf('/');
        if (pathSeparatorIndex > 0) {
          await gitfs.createDirectory(gitConfigPath.substring(0, pathSeparatorIndex));
        }
        
        await gitfs.writeFile(
          gitConfigPath,
          localConfigContent,
          `chore: automated config sync at ${new Date().toISOString()}`
        );
        
        success(`Config successfully synced to GitHub repository.`);
      } else {
        info('Config is already up to date with the GitHub repository.');
      }
    } catch (gitErr) {
      error(`GitHub sync failed: ${gitErr.message}`);
    }

  } catch (err) {
    error(`Scheduled config sync task failed: ${err.message}`);
  }
}

/**
 * 启动定时任务服务
 */
export async function startScheduler() {
  try {
    // 加载配置
    config = await loadConfig();
    
    // 如果配置中没有定时任务设置，则使用默认配置
    const cronExpression = config?.scheduler?.cronExpression || '0 0 * * *'; // 默认每天凌晨执行
    
    // 取消已有的任务（如果存在）
    if (configJob) {
      configJob.cancel();
    }

    // 创建新的定时任务
    configJob = scheduleJob(cronExpression, checkAndSyncConfig);
    
    info(`定时配置同步服务已启动，下一次执行时间: ${configJob.nextInvocation().toString()}`);
    
    // 立即执行一次任务，确保功能正常
    setTimeout(checkAndSyncConfig, 5000);
    
    return configJob;
  } catch (err) {
    error(`定时任务服务启动失败: ${err.message}`);
    throw err;
  }
}

/**
 * 停止定时任务服务
 */
export function stopScheduler() {
  if (configJob) {
    configJob.cancel();
    configJob = null;
    info('定时配置同步服务已停止');
  }
}

/**
 * 更新定时任务配置
 * @param {string} cronExpression - 新的cron表达式
 */
export async function updateSchedulerConfig(cronExpression) {
  try {
    // 停止现有的任务
    stopScheduler();
    
    // 更新配置
    if (config) {
      if (!config.scheduler) {
        config.scheduler = {};
      }
      config.scheduler.cronExpression = cronExpression;
    }
    
    // 启动新的任务
    await startScheduler();
    
    return configJob;
  } catch (err) {
    error(`定时任务配置更新失败: ${err.message}`);
    throw err;
  }
}

/**
 * 获取当前定时任务状态
 */
export function getSchedulerStatus() {
  if (!configJob) {
    return { running: false };
  }
  
  return {
    running: true,
    nextRun: configJob.nextInvocation().toString(),
    cronExpression: config?.scheduler?.cronExpression || '0 0 * * *'
  };
}