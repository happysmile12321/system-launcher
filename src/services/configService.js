import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fsPromises from 'fs/promises';
import crypto from 'crypto';

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

export function getConfig() {
  return config;
}

export function isConfigured() {
  return config !== null && config.github?.token;
}