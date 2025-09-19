import { getGitHubConfig, saveGitHubConfig } from '../services/githubService.js';
import { info, success, error } from '../utils/logger.js';

let currentState = null;

export async function loadState() {
  info('Loading orchestration state from GitHub...');
  try {
    currentState = await getGitHubConfig();
    success('State loaded successfully.');
    return currentState;
  } catch (e) {
    error('Failed to load state from GitHub: ' + e.message);
    return null;
  }
}

export async function saveState(newState) {
  info('Saving orchestration state to GitHub...');
  try {
    await saveGitHubConfig(newState);
    currentState = newState;
    success('State saved successfully.');
  } catch (e) {
    error('Failed to save state to GitHub: ' + e.message);
  }
}

export function getState() {
  return currentState;
}