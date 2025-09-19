import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '..', '..', '.orchestrator.config.json');

let config = null;

export async function loadConfig() {
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8');
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
  await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
  config = newConfig;
}

export function getConfig() {
  return config;
}

export function isConfigured() {
  return config !== null && config.githubToken;
}