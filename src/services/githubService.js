import { Octokit } from 'octokit';
import 'dotenv/config';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_REPO_OWNER;
const repo = process.env.GITHUB_REPO_NAME;
const path = process.env.CONFIG_FILE_PATH;

// Fetches the configuration file from GitHub.
export async function getGitHubConfig() {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.status === 404) {
      // File not found, return a default structure
      return { version: 1, steps: [] };
    }
    throw error;
  }
}

// Saves the configuration file to GitHub.
export async function saveGitHubConfig(configObject) {
  let sha;
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    sha = data.sha;
  } catch (error) {
    // If file doesn't exist, sha will be undefined, which is fine for creation.
  }

  const content = Buffer.from(JSON.stringify(configObject, null, 2)).toString('base64');
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `chore: update orchestration config [${new Date().toISOString()}]`,
    content,
    sha,
  });
}