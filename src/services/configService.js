import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fsPromises from 'fs/promises';
import crypto from 'crypto';
import GitFS from '../core/gitfs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', '..', '.orchestrator.config.json');

let config = null;

export async function loadConfig() {
  try {
    const fileContent = await fsPromises.readFile(configPath, 'utf-8');
    config = JSON.parse(fileContent);
    return config;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Config file doesn't exist
      return null;
    }
    throw error;
  }
}

export async function saveConfig(newConfig) {
  const { githubToken, githubRepoOwner, githubRepoName, configFilePath, feishuAppId, feishuAppSecret } = newConfig;

  const structuredConfig = {
    github: {
      token: githubToken,
      owner: githubRepoOwner,
      repo: githubRepoName,
      configFile: configFilePath,
    },
    storage: {
      driver: feishuAppId ? 'feishu' : 'local',
      feishu: {
        appId: feishuAppId,
        appSecret: feishuAppSecret,
      },
    },
    management: {
      apiKey: crypto.randomBytes(32).toString('hex'),
    },
    proxy: {
      enabled: false,
      http: '',
      https: '',
      noProxy: 'localhost,127.0.0.1',
    },
    container: {
      driver: 'docker',
      docker: {},
      podman: {},
    },
    scheduler: {
      cronExpression: '0 0 * * *',
    },
  };

  await fsPromises.writeFile(configPath, JSON.stringify(structuredConfig, null, 2));
  config = structuredConfig;
}

export async function getConfig() {
  if (!config) {
    await loadConfig();
  }
  
  // 如果配置存在，尝试从GitFS读取飞书配置
  if (config && config.github?.token) {
    try {
      const gitfs = new GitFS(config);
      const feishuConfigFile = await gitfs.readFile('.orchestrator-pro/feishu-config.json');
      
      if (feishuConfigFile) {
        const feishuConfig = JSON.parse(feishuConfigFile.content);
        config.feishu = feishuConfig;
        
        // 更新环境变量
        if (feishuConfig.appId) {
          process.env.FEISHU_APP_ID = feishuConfig.appId;
        }
        if (feishuConfig.appSecret) {
          process.env.FEISHU_APP_SECRET = feishuConfig.appSecret;
        }
        if (feishuConfig.redirectUri) {
          process.env.FEISHU_REDIRECT_URI = feishuConfig.redirectUri;
        }
      }
    } catch (err) {
      // 如果读取GitFS配置失败，忽略错误，使用环境变量
      console.warn('Failed to load Feishu config from GitFS:', err.message);
    }
  }
  
  return config;
}

export function isConfigured() {
  return config !== null && config.github?.token;
}