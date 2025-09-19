#!/usr/bin/env node

import inquirer from 'inquirer';
import { loadState, saveState, getState } from '../core/orchestration.js';
import { runDockerDeploy, runCloudflareDeploy } from '../core/deployment.js';
import { info, success, warning, error } from '../utils/logger.js';
import { execa, execaCommandSync } from 'execa';
import { existsSync } from 'fs';

async function main() {
  info('Welcome to Orchestrator Pro CLI!');
  await loadState();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View Current Orchestration', 
        'Run Docker Deploy', 
        'Deploy System Services',
        'Configure Cloudflare Gateway',
        'Save Orchestration State',
        'Exit'
      ],
    },
  ]);

  if (action === 'View Current Orchestration') {
    info('Current state from GitHub:');
    console.log(JSON.stringify(getState(), null, 2));
  }

  if (action === 'Run Docker Deploy') {
    await runDockerDeploy();
  }

  if (action === 'Deploy System Services') {
    await deploySystemServices();
  }

  if (action === 'Configure Cloudflare Gateway') {
    await configureCloudflareGateway();
  }

  if (action === 'Save Orchestration State') {
    const state = getState() || { version: 1, steps: [] };
    await saveState(state);
  }

  if (action === 'Exit') {
    info('Goodbye!');
  }
}

// 部署系统服务函数
async function deploySystemServices() {
  info('=== 开始部署系统服务 ===');

  // --- 1. 环境检查 ---
  info('1. 正在检查环境依赖...');
  try {
    execaCommandSync('docker --version');
    execaCommandSync('docker-compose --version');
    success('环境依赖检查通过！\n');
  } catch (e) {
    error('依赖检查失败: 请确保 Docker 和 Docker Compose 已正确安装并可以运行。');
    return;
  }

  // --- 2. 启动本地服务 ---
  info('2. 正在启动本地 Docker 服务 (知识库 & n8n)...');
  if (!existsSync('docker-compose.yml')) {
    error("当前目录下未找到 'docker-compose.yml' 文件。请将此工具与 docker-compose.yml 放在同一目录运行。");
    return;
  }
  try {
    await execa('docker-compose', ['up', '-d']);
    success('本地服务已在后台启动！');
    info('n8n 访问地址: http://127.0.0.1:5678');
    info('知识库 API 地址: http://127.0.0.1:8000 (请根据您的配置确认)\n');
  } catch (e) {
    error('启动 Docker 服务失败: ' + e.stderr);
    return;
  }

  // 更新编排状态
  const state = getState() || { version: 1, steps: [] };
  state.systemDeployed = true;
  state.lastDeployTime = new Date().toISOString();
  await saveState(state);

  // --- 最终手动操作清单 ---
  info("======================================================");
  success("🎉 恭喜！自动化部署部分已全部完成！ 🎉");
  warning("📝 接下来，请您完成最后几步手动配置:");
  console.log(`
1.  ${warning('[飞书 Agent 连接]')}
    - 请登录飞书集成平台，在“自定义连接”部分找到并下载您的专属本地 Agent。
    - 在您的服务器上运行 Agent，将其连接到云端。

2.  ${warning('[飞书集成平台配置]')}
    - 登录飞书集成平台，进入“连接器管理”。
    - 创建一个【本地知识库连接器】: 选择通过 Agent 访问，地址填写 http://knowledge-base:8000。
    - 创建一个【海外API连接器】: 选择公网API，地址填写您的Cloudflare网关地址。

系统部署完成！祝您使用愉快！
  `);
}

// 配置 Cloudflare 网关函数
async function configureCloudflareGateway() {
  info('3. 正在配置 Cloudflare API 网关...');
  warning('此步骤需要您已拥有 Cloudflare 账户、一个域名，并已全局安装 wrangler CLI。');
  
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: '请输入您要代理的海外API的密钥 (例如 OpenAI API Key):',
      mask: '*',
    },
  ]);

  if (!apiKey) {
    error('API Key 不能为空。');
    return;
  }

  try {
    info('正在将您的 API Key 安全地上传到 Cloudflare...');
    await execa('wrangler', ['secret', 'put', 'API_KEY'], { input: apiKey });
    success('API Key 已成功设置为环境变量。');
    
    info('正在部署 Worker 到 Cloudflare...');
    const { stdout } = await execa('wrangler', ['deploy', 'cloudflare/index.js']); // 假设代码在 cloudflare/index.js
    const workerUrl = stdout.match(/https:\/\/[^ ]*/)[0];
    success('Cloudflare API 网关已部署！');
    info(`您的专属API代理地址是: ${workerUrl}\n`);

    // 更新编排状态
    const state = getState() || { version: 1, steps: [] };
    state.cloudflareDeployed = true;
    state.workerUrl = workerUrl;
    state.lastCloudflareUpdate = new Date().toISOString();
    await saveState(state);

  } catch (e) {
    error('Cloudflare 配置失败: ' + (e.stderr || e.message));
    warning('请确保您已运行 `wrangler login` 并正确配置了 cloudflare/wrangler.toml 文件。');
    return;
  }
}

main().catch(console.error);