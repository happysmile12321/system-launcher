You are an expert Node.js architect. Your task is to create a well-structured, modular, and extensible project for a hybrid CLI and Web application named "Orchestrator Pro". This application helps users deploy and manage a complex system involving local services and cloud APIs. The configuration and orchestration data will be persisted in a user's private GitHub repository.

Please generate the complete project structure and boilerplate code based on the following detailed requirements.

1. Project Structure
Create the following file and directory structure. This structure separates concerns, allowing for easy expansion in the future.

/
├── src/
│   ├── cli/
│   │   └── index.js             # The main entry point for the CLI (handles inquirer prompts).
│   ├── core/
│   │   ├── deployment.js        # Core logic for deployment tasks (Docker, Cloudflare, etc.).
│   │   └── orchestration.js     # Manages loading/saving the orchestration state via the GitHub service.
│   ├── services/
│   │   └── githubService.js     # A dedicated module for all GitHub API interactions (using Octokit).
│   ├── web/
│   │   ├── server.js            # Express.js server setup, API routes, and serving the frontend.
│   │   └── public/
│   │       ├── index.html       # The main page for the web interface.
│   │       ├── style.css        # Basic styling for the web interface.
│   │       └── app.js           # Frontend JavaScript for interacting with the backend API.
│   └── utils/
│       └── logger.js            # A centralized logger using 'chalk' for colored console output.
├── .env                         # For storing secrets like the GitHub token.
├── .gitignore                   # Standard Node.js gitignore.
├── package.json                 # Project manifest.
└── README.md                    # Project documentation.
2. File Contents and Implementation Details
Now, please populate each file with the following content and logic.

A. package.json

Initialize the project with these dependencies and scripts. The "type": "module" is crucial for using ES modules (import/export).

JSON

{
  "name": "orchestrator-pro",
  "version": "1.0.0",
  "description": "A tool to deploy and manage complex systems via CLI and Web UI.",
  "type": "module",
  "main": "src/cli/index.js",
  "bin": {
    "orchestrator-pro": "./src/cli/index.js"
  },
  "scripts": {
    "start": "node src/web/server.js",
    "cli": "node src/cli/index.js"
  },
  "keywords": ["cli", "web", "automation", "deploy"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "chalk": "^5.3.0",
    "dotenv": "^16.4.5",
    "execa": "^8.0.1",
    "express": "^4.19.2",
    "inquirer": "^9.2.20",
    "octokit": "^3.2.1"
  }
}
B. .env and .gitignore

Create a .env file for secret management and a .gitignore to protect it.

.env:

# --- GitHub Configuration ---
# Your Personal Access Token with 'repo' scope.
GITHUB_TOKEN=
# The owner of the repository (your GitHub username).
GITHUB_REPO_OWNER=
# The name of the repository where the config will be stored.
GITHUB_REPO_NAME=
# The path to the configuration file within that repository.
CONFIG_FILE_PATH=orchestration.json
.gitignore:

# Dependencies
/node_modules

# Environment variables
.env

# Logs
*.log
C. Utility: src/utils/logger.js

A simple, reusable module for colored logging.

JavaScript

import chalk from 'chalk';

export const log = console.log;
export const info = (msg) => log(chalk.blue(`[INFO] ${msg}`));
export const success = (msg) => log(chalk.green(`[SUCCESS] ${msg}`));
export const warning = (msg) => log(chalk.yellow(`[WARNING] ${msg}`));
export const error = (msg) => log(chalk.red(`[ERROR] ${msg}`));
D. Service Layer: src/services/githubService.js

This module encapsulates all logic for interacting with the GitHub API using octokit.

JavaScript

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
E. Core Logic

src/core/orchestration.js:

JavaScript

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
src/core/deployment.js: (Placeholder for now)

JavaScript

import { execa } from 'execa';
import { info, success, error } from '../utils/logger.js';

// This is where you will add your actual deployment functions.
export async function runDockerDeploy() {
  info('Starting Docker deployment...');
  // const { stdout } = await execa('docker-compose', ['up', '-d']);
  success('Docker deployment finished.');
  // return stdout;
  return "Docker deployment simulated.";
}

export async function runCloudflareDeploy(apiKey) {
    info('Starting Cloudflare deployment...');
    // Placeholder logic
    success('Cloudflare deployment finished.');
    return `Cloudflare deployment simulated with API key starting with ${apiKey.substring(0,4)}`;
}
F. Web Interface

src/web/server.js:

JavaScript

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadState, saveState } from '../core/orchestration.js';
import { runDockerDeploy } from '../core/deployment.js';
import { info, success } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API to get the current config
app.get('/api/orchestration', async (req, res) => {
  const state = await loadState();
  res.json(state);
});

// API to save the config
app.post('/api/orchestration', async (req, res) => {
  await saveState(req.body);
  res.json({ message: 'Configuration saved successfully!' });
});

// API to trigger a deployment
app.post('/api/deploy/docker', async (req, res) => {
  const result = await runDockerDeploy();
  res.json({ message: 'Docker deployment triggered!', output: result });
});

app.listen(PORT, () => {
  success(`Web UI is running!`);
  info(`Open your browser at http://localhost:${PORT}`);
});
src/web/public/index.html, style.css, app.js: Create these with basic "Hello World" content. For index.html, add a textarea and two buttons: "Load from GitHub" and "Save to GitHub". For app.js, add event listeners for these buttons that make fetch calls to the /api/orchestration endpoints.

G. CLI Entry Point: src/cli/index.js

Make this file executable (#!/usr/bin/env node). This ties everything together for the command-line experience.

JavaScript

#!/usr/bin/env node

import inquirer from 'inquirer';
import { loadState, saveState, getState } from '../core/orchestration.js';
import { runDockerDeploy } from '../core/deployment.js';
import { info } from '../utils/logger.js';

async function main() {
  info('Welcome to Orchestrator Pro CLI!');
  await loadState();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['View Current Orchestration', 'Run Docker Deploy', 'Exit'],
    },
  ]);

  if (action === 'View Current Orchestration') {
    info('Current state from GitHub:');
    console.log(JSON.stringify(getState(), null, 2));
  }

  if (action === 'Run Docker Deploy') {
    await runDockerDeploy();
  }

  if (action === 'Exit') {
    info('Goodbye!');
  }
}

main();
H. README.md

Create a README with a placeholder for your Feishu document link.

Markdown

# Orchestrator Pro

This tool helps deploy and manage my complex system via both a CLI and a Web UI.

## Setup

1.  Clone the repository.
2.  Run `npm install`.
3.  Create a `.env` file from the example and fill in your GitHub details.
4.  For detailed operational guides, please see our [Feishu Documentation](https://your-feishu-doc-link.com).

## Usage

### Web UI
Starts a web server at `http://localhost:3000`.

\`\`\`bash
npm start
\`\`\`

### CLI
Starts the interactive command-line interface.

\`\`\`bash
npm run cli
\`\`\`
After generating all this, please run npm install to finalize the setup.