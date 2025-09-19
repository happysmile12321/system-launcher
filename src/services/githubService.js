import GitFS from '../core/gitfs.js';
import { info, error } from '../utils/logger.js';

/**
 * 获取GitHub配置 - 使用GitFS抽象层
 */
export async function getGitHubConfig(config) {
  try {
    const gitfs = new GitFS(config);
    // 默认使用配置文件路径或回退到默认路径
    const configPath = config.configFilePath || 'config/main.json';
    
    const fileData = await gitfs.readFile(configPath);
    if (fileData) {
      return JSON.parse(fileData.content);
    } else {
      info(`Config file not found at ${configPath}, returning default config`);
      return { version: 1, steps: [] };
    }
  } catch (err) {
    error(`Failed to get GitHub config: ${err.message}`);
    throw err;
  }
}

/**
 * 保存GitHub配置 - 使用GitFS抽象层
 */
export async function saveGitHubConfig(config, configObject) {
  try {
    const gitfs = new GitFS(config);
    // 默认使用配置文件路径或回退到默认路径
    const configPath = config.configFilePath || 'config/main.json';
    
    // 确保配置目录存在
    await gitfs.createDirectory('config');
    
    await gitfs.writeFile(
      configPath, 
      JSON.stringify(configObject, null, 2),
      `chore: update orchestration config [${new Date().toISOString()}]`
    );
  } catch (err) {
    error(`Failed to save GitHub config: ${err.message}`);
    throw err;
  }
}