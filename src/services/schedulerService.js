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
    // 基本验证 - 确保配置对象包含必要字段
    if (!configObj || typeof configObj !== 'object') {
      warning('配置文件不是有效的JSON对象');
      return false;
    }

    // 验证GitHub配置
    if (!configObj.githubToken || !configObj.githubRepoOwner || !configObj.githubRepoName) {
      warning('配置文件缺少必要的GitHub信息');
      return false;
    }

    // 验证定时任务配置
    if (configObj.scheduler && !configObj.scheduler.cronExpression) {
      warning('定时任务配置缺少cron表达式');
      return false;
    }

    success('配置文件验证通过');
    return true;
  } catch (err) {
    error(`配置文件验证失败: ${err.message}`);
    return false;
  }
}

/**
 * 检查并同步配置文件到GitHub
 */
async function checkAndSyncConfig() {
  try {
    info('开始执行定时配置同步任务...');

    // 重新加载最新配置
    const latestConfig = await loadConfig();
    if (!latestConfig) {
      warning('没有找到配置文件，跳过同步');
      return;
    }

    // 验证配置文件
    if (!validateConfig(latestConfig)) {
      warning('配置文件验证失败，跳过同步');
      return;
    }

    try {
      // 创建GitFS实例
      const gitfs = new GitFS(latestConfig);
      
      // 检查配置文件是否需要同步
      // 1. 读取本地配置文件
      const localConfigPath = '.orchestrator.config.json';
      const localConfigContent = JSON.stringify(latestConfig, null, 2);
      
      // 2. 读取GitHub上的配置文件
      const gitConfigPath = 'config/system.json';
      const gitConfigData = await gitfs.readFile(gitConfigPath);
      
      // 3. 比较内容是否不同
      if (!gitConfigData || gitConfigData.content !== localConfigContent) {
        // 确保config目录存在
        await gitfs.createDirectory('config');
        
        // 保存配置文件到GitHub
        await gitfs.writeFile(
          gitConfigPath,
          localConfigContent,
          `chore: automated config sync at ${new Date().toISOString()}`
        );
        
        success(`配置文件已成功同步到GitHub仓库`);
      } else {
        info('配置文件与GitHub仓库版本一致，无需同步');
      }
    } catch (gitErr) {
      error(`GitHub同步失败: ${gitErr.message}`);
    }

  } catch (err) {
    error(`定时配置同步任务执行失败: ${err.message}`);
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