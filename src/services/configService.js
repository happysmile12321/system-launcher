import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fsPromises from 'fs/promises';
import crypto from 'crypto';
import GitFS from '../core/gitfs.js';
import { GitHubTokenValidator } from './githubTokenValidator.js';

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
      }
    } catch (err) {
      // 如果读取GitFS配置失败，忽略错误
      console.warn('Failed to load Feishu config from GitFS:', err.message);
    }
  }

  return config;
}

export function isConfigured() {
  return config !== null && config.github?.token;
}

/**
 * 检查GitHub token是否有效
 * @param {boolean} skipRepoCheck - 是否跳过仓库检查
 * @returns {Promise<boolean>}
 */
export async function isTokenValid(skipRepoCheck = false) {
  if (!isConfigured()) {
    return false;
  }

  try {
    const { token, owner, repo } = config.github;
    const validation = await GitHubTokenValidator.validateToken(token, owner, repo, skipRepoCheck);
    return validation.valid;
  } catch (err) {
    console.warn('Token validation failed:', err.message);
    return false;
  }
}

/**
 * 检查配置是否完整且有效
 * @returns {Promise<boolean>}
 */
export async function isFullyConfigured() {
  if (!isConfigured()) {
    return false;
  }

  // 首先尝试完整验证
  let valid = await isTokenValid(false);

  // 如果完整验证失败，尝试跳过仓库检查
  if (!valid) {
    console.warn('Full validation failed, trying token-only validation...');
    valid = await isTokenValid(true);
    if (valid) {
      console.warn('Token is valid but repository access failed. This may be due to repository permissions or the repository not existing yet.');
      console.warn('Server will start in "trust mode" - assuming token is valid based on configuration.');
      return true; // 信任模式：如果token格式正确且配置完整，就认为有效
    }
  }

  return valid;
}