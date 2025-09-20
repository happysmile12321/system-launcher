import GitFS from '../core/gitfs.js';
import { getConfig } from './configService.js';
import { info, error } from '../utils/logger.js';

const WORKFLOW_DIR = 'config';
const WORKFLOW_SUFFIX = '.workflow.json';

function getWorkflowPath(id) {
  return `${WORKFLOW_DIR}/${id}${WORKFLOW_SUFFIX}`;
}

function slugifyName(name) {
  const base = (name || 'untitled-workflow')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `workflow-${Date.now()}`;
}

function parseWorkflowContent(content, fallbackId) {
  try {
    const parsed = JSON.parse(content);
    if (!parsed.id && fallbackId) {
      parsed.id = fallbackId;
    }
    return parsed;
  } catch (err) {
    error(`Failed to parse workflow ${fallbackId}: ${err.message}`);
    throw err;
  }
}

async function getGitFsInstance() {
  const config = getConfig();
  if (!config) {
    throw new Error('Application is not configured.');
  }
  
  // 检查GitHub配置
  if (!config.github?.token) {
    throw new Error('GitHub token is not configured. Please configure GitHub integration first.');
  }
  
  return new GitFS(config);
}

export async function listWorkflows() {
  try {
    const gitfs = await getGitFsInstance();
    const entries = await gitfs.listDirectory(WORKFLOW_DIR);

    const workflowFiles = entries.filter((item) => item.type === 'file' && item.name.endsWith(WORKFLOW_SUFFIX));

    const workflows = [];
    for (const file of workflowFiles) {
      const id = file.name.replace(WORKFLOW_SUFFIX, '');
      try {
        const fileData = await gitfs.readFile(`${WORKFLOW_DIR}/${file.name}`);
        if (!fileData) {
          continue;
        }
        const workflow = parseWorkflowContent(fileData.content, id);
        workflows.push({
          id,
          name: workflow.name || id,
          description: workflow.description || '',
          enabled: workflow.enabled !== false,
          triggerType: workflow.trigger?.type || 'cron',
        });
      } catch (err) {
        error(`Unable to read workflow ${id}: ${err.message}`);
      }
    }

    workflows.sort((a, b) => a.name.localeCompare(b.name));
    return workflows;
  } catch (err) {
    if (err.message.includes('GitHub token is not configured')) {
      info('GitHub not configured, returning empty workflow list');
      return [];
    }
    throw err;
  }
}

export async function getWorkflow(id) {
  const gitfs = await getGitFsInstance();
  const fileData = await gitfs.readFile(getWorkflowPath(id));
  if (!fileData) {
    return null;
  }
  return parseWorkflowContent(fileData.content, id);
}

export async function saveWorkflow(workflow) {
  if (!workflow || !workflow.id) {
    throw new Error('Workflow payload must contain an id.');
  }

  const gitfs = await getGitFsInstance();
  await gitfs.createDirectory(WORKFLOW_DIR);
  const filePath = getWorkflowPath(workflow.id);

  const payload = {
    id: workflow.id,
    name: workflow.name || workflow.id,
    description: workflow.description || '',
    enabled: workflow.enabled !== false,
    trigger: workflow.trigger || { type: 'cron', cronExpression: '' },
    steps: Array.isArray(workflow.steps) ? workflow.steps : [],
  };

  await gitfs.writeFile(
    filePath,
    JSON.stringify(payload, null, 2),
    `chore: update workflow ${workflow.id}`
  );
  info(`Workflow ${workflow.id} saved.`);
  return payload;
}

export async function createWorkflow({ name, description }) {
  const gitfs = await getGitFsInstance();
  await gitfs.createDirectory(WORKFLOW_DIR);

  const existing = await listWorkflows();
  const existingIds = new Set(existing.map((wf) => wf.id));

  let baseId = slugifyName(name);
  let uniqueId = baseId;
  let counter = 1;
  while (existingIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter++}`;
  }

  const workflow = {
    id: uniqueId,
    name: name || `Workflow ${existing.length + 1}`,
    description: description || '',
    enabled: true,
    trigger: {
      type: 'cron',
      cronExpression: '',
    },
    steps: [],
  };

  await gitfs.writeFile(
    getWorkflowPath(uniqueId),
    JSON.stringify(workflow, null, 2),
    `feat: add workflow ${uniqueId}`
  );

  info(`Workflow ${uniqueId} created.`);
  return workflow;
}

export async function deleteWorkflow(id) {
  const gitfs = await getGitFsInstance();
  await gitfs.deleteFile(
    getWorkflowPath(id),
    `chore: remove workflow ${id}`
  );
}
